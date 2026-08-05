const overlay = document.getElementById('overlay');
const modalTitle = document.getElementById('modalTitle');
const deviceInput = document.getElementById('deviceInput');
const form = document.getElementById('leadForm');
const feedback = document.getElementById('feedback');
const submitBtn = document.getElementById('submitBtn');

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

  try {
    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();

    if (!res.ok) throw new Error(json.error || 'Error al enviar');

    feedback.textContent = '¡Listo! Te contactaremos pronto.';
    feedback.className = 'feedback ok';
    form.reset();
    setTimeout(closeModal, 1800);
  } catch (err) {
    feedback.textContent = err.message;
    feedback.className = 'feedback err';
  } finally {
    submitBtn.disabled = false;
  }
});
