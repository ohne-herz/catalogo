# Sitio Terminales POS — Captación de leads

Sitio web con 4 dispositivos (SumUp Terminal, SumUp App, Transbank, Redelcom). Al hacer clic en un dispositivo se abre un formulario (nombre, email, teléfono); al enviarlo, el sistema:

1. Guarda el lead en `data/leads.json`.
2. Envía un correo al email configurado por el administrador.

Incluye un **mantenedor** (`/admin.html`) protegido por usuario/contraseña donde solo el admin puede:
- Definir/cambiar el email de destino de los leads.
- Ver el listado de leads recibidos.

## 1. Instalación

```bash
npm install
cp .env.example .env
```

## 2. Configurar `.env`

- **JWT_SECRET**: cualquier string largo y aleatorio (usado para firmar la sesión del admin).
- **ADMIN_USER / ADMIN_PASS_HASH**: credenciales del admin. El password NO se guarda en texto plano, se guarda su hash bcrypt:
  ```bash
  node -e "console.log(require('bcryptjs').hashSync('TU_PASSWORD_SEGURO', 10))"
  ```
  Copia el resultado en `ADMIN_PASS_HASH`.
- **SMTP_***: credenciales del servidor de correo saliente. Con Gmail necesitas una ["contraseña de aplicación"](https://myaccount.google.com/apppasswords) (no la clave normal de la cuenta). También puedes usar SendGrid, Amazon SES, Mailgun, etc.
- **DEFAULT_TARGET_EMAIL**: email inicial al que llegan los leads (después editable desde el panel).

## 3. Ejecutar

```bash
npm start
```

- Sitio público: `http://localhost:3000`
- Login admin: `http://localhost:3000/admin.html`

## 4. Despliegue a producción

Este es un backend Node/Express real (no solo archivos estáticos), así que necesita un hosting que ejecute Node, por ejemplo:
- **Render** / **Railway** / **Fly.io** (planes gratuitos disponibles)
- Un VPS propio con PM2 + Nginx como reverse proxy

En todos los casos: configura las mismas variables de `.env` como variables de entorno del servicio, y activa `NODE_ENV=production` para que la cookie de sesión del admin viaje solo por HTTPS (`secure: true`).

## 5. Seguridad — consideraciones

| Ítem | Estado actual | Recomendación producción |
|---|---|---|
| Sesión admin | Cookie httpOnly + JWT firmado | Agregar rotación de `JWT_SECRET` y expiración corta si el panel maneja datos sensibles |
| Fuerza bruta login | Rate limit (8 intentos/15 min) | Sumar captcha o bloqueo progresivo si se expone a internet |
| Spam en formulario público | Rate limit (10 envíos/15 min por IP) | Sumar honeypot o reCAPTCHA si empieza a recibir spam |
| Almacenamiento de leads | Archivo JSON plano | Migrar a una base de datos real (Postgres/MySQL) si el volumen crece |
| HTTPS | No incluido | Obligatorio en producción (Let's Encrypt o el certificado del hosting) |

## Estructura

```
sitio-pos/
├── server.js              # API + servidor Express
├── data/
│   ├── config.json         # email de destino configurado por el admin
│   └── leads.json          # leads recibidos
└── public/
    ├── index.html          # landing pública
    ├── admin.html           # login del admin
    ├── panel.html            # mantenedor (protegido)
    ├── css/style.css
    ├── js/main.js            # lógica del formulario público
    ├── js/admin.js            # lógica del panel admin
    └── images/                # fotos de los 4 dispositivos
```
