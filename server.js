require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-cambiar';
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

// ---------- Utilidades de "persistencia" (JSON plano) ----------
function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); }
  catch { return fallback; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CONFIG_FILE)) {
  writeJSON(CONFIG_FILE, { targetEmail: process.env.DEFAULT_TARGET_EMAIL || '' });
}
if (!fs.existsSync(LEADS_FILE)) writeJSON(LEADS_FILE, []);

// ---------- Middlewares ----------
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limit al formulario público (anti-spam / anti-flood)
const leadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
// Rate limit al login (anti fuerza bruta)
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8 });

// ---------- Auth admin ----------
function requireAdmin(req, res, next) {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
}

app.post('/api/admin/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  const validUser = process.env.ADMIN_USER;
  const validHash = process.env.ADMIN_PASS_HASH;
  if (!validUser || !validHash) {
    return res.status(500).json({ error: 'Admin no configurado en el servidor (.env)' });
  }
  if (username !== validUser) return res.status(401).json({ error: 'Credenciales inválidas' });

  const ok = await bcrypt.compare(password || '', validHash);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = jwt.sign({ user: username }, JWT_SECRET, { expiresIn: '8h' });
  res.cookie('admin_token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000
  });
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ ok: true });
});

app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ user: req.admin.user }));

// ---------- Mantenedor: email de destino ----------
app.get('/api/admin/config', requireAdmin, (req, res) => {
  res.json(readJSON(CONFIG_FILE, { targetEmail: '' }));
});

app.post('/api/admin/config', requireAdmin, (req, res) => {
  const { targetEmail } = req.body || {};
  if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
    return res.status(400).json({ error: 'Email de destino inválido' });
  }
  writeJSON(CONFIG_FILE, { targetEmail });
  res.json({ ok: true, targetEmail });
});

// ---------- Mantenedor: listado de leads ----------
app.get('/api/admin/leads', requireAdmin, (req, res) => {
  const leads = readJSON(LEADS_FILE, []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(leads);
});

// ---------- Endpoint público: recepción del formulario ----------
const DEVICE_LABELS = {
  'get-mini': 'Getnet Get Mini',
  'get-classica': 'Getnet Get Clássica',
  'get-smart': 'Getnet Get Smart'
};

app.post('/api/lead', leadLimiter, async (req, res) => {
  const { name, email, phone, device } = req.body || {};

  if (!name || !email || !phone || !device) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  if (!DEVICE_LABELS[device]) {
    return res.status(400).json({ error: 'Dispositivo inválido' });
  }

  const lead = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: String(name).slice(0, 120),
    email: String(email).slice(0, 160),
    phone: String(phone).slice(0, 40),
    device,
    deviceLabel: DEVICE_LABELS[device],
    createdAt: new Date().toISOString(),
    ip: req.ip
  };

  // 1) Guardar el lead (persistencia local, además del correo)
  const leads = readJSON(LEADS_FILE, []);
  leads.push(lead);
  writeJSON(LEADS_FILE, leads);

  // 2) Enviar el correo al email configurado por el admin
  const { targetEmail } = readJSON(CONFIG_FILE, { targetEmail: '' });
  if (targetEmail) {
    try {
      await sendLeadEmail(targetEmail, lead);
    } catch (err) {
      console.error('Error enviando email:', err.message);
      // No rompemos la experiencia del usuario: el lead ya quedó guardado.
    }
  } else {
    console.warn('No hay targetEmail configurado; el lead quedó guardado pero no se envió correo.');
  }

  res.json({ ok: true });
});

async function sendLeadEmail(targetEmail, lead) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  await transporter.sendMail({
    from: `"Sitio Terminales POS" <${process.env.SMTP_USER}>`,
    to: targetEmail,
    replyTo: lead.email,
    subject: `Nuevo interesado: ${lead.deviceLabel} — ${lead.name}`,
    text:
`Nuevo lead recibido desde el sitio web:

Dispositivo: ${lead.deviceLabel}
Nombre: ${lead.name}
Email: ${lead.email}
Teléfono: ${lead.phone}
Fecha: ${new Date(lead.createdAt).toLocaleString('es-CL')}
`,
    html: `
      <h2>Nuevo interesado</h2>
      <p><b>Dispositivo:</b> ${lead.deviceLabel}</p>
      <p><b>Nombre:</b> ${lead.name}</p>
      <p><b>Email:</b> ${lead.email}</p>
      <p><b>Teléfono:</b> ${lead.phone}</p>
      <p><b>Fecha:</b> ${new Date(lead.createdAt).toLocaleString('es-CL')}</p>
    `
  });
}

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
