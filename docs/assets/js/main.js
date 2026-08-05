const overlay = document.getElementById('overlay');
const modalTitle = document.getElementById('modalTitle');
const deviceInput = document.getElementById('deviceInput');
const form = document.getElementById('leadForm');
const feedback = document.getElementById('feedback');
const submitBtn = document.getElementById('submitBtn');

// Inicializa EmailJS con la Public Key definida en config.js
emailjs.init({ publicKey: window.SITE_CONFIG.emailjs.publicKey });

function openModal(device, label) {
  deviceInput.value = device;
  modalTitle.textContent = `Cotizar: ${label}`;
  feedback.textContent = '';
  feedback.className = 'feedback';
  form.reset();
  deviceInput.value = device;
  overlay.classList.add('open');
}

function closeModal() {
  overlay.classList.remove('open');
}

document.querySelectorAll('.card').forEach(card => {
  const device = card.dataset.device;
  const label = card.dataset.label;
  card.querySelector('img').addEventListener('click', () => openModal(device, label));
  card.querySelector('.cta').addEventListener('click', () => openModal(device, label));
});

document.getElementById('closeModal').addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  feedback.textContent = 'Enviando...';
  feedback.className = 'feedback';

  const data = Object.fromEntries(new FormData(form).entries());
  const cfg = window.SITE_CONFIG;

  try {
    if (!cfg.emailjs.serviceId || cfg.emailjs.serviceId === 'TU_SERVICE_ID') {
      throw new Error('El sitio aún no tiene EmailJS configurado (ver assets/js/config.js).');
    }

    await emailjs.send(cfg.emailjs.serviceId, cfg.emailjs.templateId, {
      to_email: cfg.targetEmail,
      from_name: data.name,
      from_email: data.email,
      phone: data.phone,
      device: data.device,
      reply_to: data.email
    });

    feedback.textContent = '¡Listo! Te contactaremos pronto.';
    feedback.className = 'feedback ok';
    form.reset();
    setTimeout(closeModal, 1800);
  } catch (err) {
    feedback.textContent = err.message || 'No se pudo enviar. Intenta de nuevo.';
    feedback.className = 'feedback err';
  } finally {
    submitBtn.disabled = false;
  }
});
