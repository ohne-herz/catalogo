async function guard() {
  const res = await fetch('/api/admin/me');
  if (!res.ok) { window.location.href = '/admin.html'; return; }
  const json = await res.json();
  document.getElementById('whoami').textContent = `Sesión: ${json.user}`;
}

async function loadConfig() {
  const res = await fetch('/api/admin/config');
  if (!res.ok) return;
  const json = await res.json();
  document.getElementById('targetEmail').value = json.targetEmail || '';
}

async function loadLeads() {
  const res = await fetch('/api/admin/leads');
  if (!res.ok) return;
  const leads = await res.json();
  const tbody = document.getElementById('leadsBody');
  tbody.innerHTML = leads.map(l => `
    <tr>
      <td>${new Date(l.createdAt).toLocaleString('es-CL')}</td>
      <td>${l.deviceLabel}</td>
      <td>${l.name}</td>
      <td>${l.email}</td>
      <td>${l.phone}</td>
    </tr>
  `).join('') || '<tr><td colspan="5">Aún no hay leads.</td></tr>';
}

document.getElementById('saveConfig').addEventListener('click', async () => {
  const targetEmail = document.getElementById('targetEmail').value.trim();
  const msg = document.getElementById('configMsg');
  msg.textContent = 'Guardando...';
  try {
    const res = await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetEmail })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    msg.textContent = 'Email de destino actualizado.';
    msg.style.color = '#16a34a';
  } catch (err) {
    msg.textContent = err.message;
    msg.style.color = '#dc2626';
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  window.location.href = '/admin.html';
});

guard();
loadConfig();
loadLeads();
