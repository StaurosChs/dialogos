function showSection(name) {
  ['home', 'about', 'contact'].forEach(s => {
    document.getElementById('section-' + s).style.display = s === name ? 'block' : 'none';
  });
  document.querySelectorAll('.nav-links a').forEach((a, i) => {
    a.classList.remove('active');
    if (
      (name === 'home'    && i === 0) ||
      (name === 'about'   && i === 1) ||
      (name === 'contact' && i === 2)
    ) {
      a.classList.add('active');
    }
  });
  document.getElementById('navLinks').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

function handleSubmit() {
  const inputs = document.querySelectorAll('#section-contact input, #section-contact textarea');
  const filled = Array.from(inputs).every(i => i.value.trim() !== '');
  if (!filled) {
    alert('Please fill in all fields before sending.');
    return;
  }
  alert('Your message has been sent. The dialogue begins.');
  inputs.forEach(i => i.value = '');
}
