# Versión GitHub Pages (estática, sin backend)

Esta carpeta (`docs/`) es una versión reducida del sitio pensada para correr **solo con GitHub**, sin servidor propio.

## Diferencias vs. la versión Node (carpeta `public/` + `server.js`)

| | Versión Node (`public/`) | Versión estática (`docs/`) |
|---|---|---|
| Hosting | Requiere Render/Railway/etc. | GitHub Pages (gratis, incluido en el repo) |
| Envío de email | Backend propio (Nodemailer + SMTP) | EmailJS (servicio de terceros, gratis) |
| Mantenedor | Login real (bcrypt + JWT) | No hay login — se edita `config.js` directo en GitHub |
| Leads guardados | Archivo `leads.json` en el server | No quedan guardados en ningún lado propio (solo en el email que llega + historial de EmailJS) |

## Activar GitHub Pages

1. En el repo → **Settings → Pages**.
2. **Source**: `Deploy from a branch`.
3. **Branch**: `main`, carpeta `/docs`.
4. Guardar. En 1-2 minutos tu sitio queda disponible en:
   `https://ohne-herz.github.io/catalogo/`

## Configurar EmailJS (obligatorio para que el formulario funcione)

Ver instrucciones paso a paso en `docs/admin.html` (o en la página `/admin.html` una vez publicado el sitio).

## Cuándo usar esta versión vs. la de backend

- **Usa esta (`docs/`)** si: quieres cero costo de hosting, no te importa que la config viva en el código del repo, y el volumen de leads es bajo.
- **Usa la versión Node (`public/` + `server.js`)** si: necesitas login admin realmente protegido, guardar los leads en tu propia base de datos, o vas a manejar volumen/reportes más serios.
