// ============================================================
// CONFIGURACIÓN DEL SITIO — este es tu "mantenedor" en la versión
// estática (GitHub Pages). Para cambiar el email de destino o las
// credenciales de EmailJS: edita este archivo directo en GitHub
// (botón del lápiz ✏️ en github.com) y haz commit a main.
// GitHub Pages redespliega solo en 1-2 minutos.
// ============================================================

window.SITE_CONFIG = {
  // Email donde quieres recibir los leads.
  // OJO: este valor viaja al navegador del visitante (es público,
  // como toda config en un sitio estático). No pongas nada sensible aquí.
  targetEmail: "ventasgetnetcl@gmail.com",

  // Credenciales de EmailJS (gratis en https://www.emailjs.com).
  // El "Public Key" está diseñado para ser público, no es secreto.
  emailjs: {
    publicKey: "AbCdEfGhIjKlMnOp",
    serviceId: "gmail_getnet",
    templateId: "template_qo3ks99"
  }
};
