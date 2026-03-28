// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Nav border on scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// Animated email on hero — letters pop in one by one after a short delay
const email = 'chenxu1098@gmail.com';
const emailEl = document.getElementById('heroEmail');
if (emailEl) {
  const baseDelay = 900; // ms after page load before first letter
  emailEl.innerHTML = email.split('').map((ch, i) => {
    const delay = baseDelay + i * 55;
    return `<span class="char" style="animation-delay:${delay}ms">${ch === ' ' ? '&nbsp;' : ch}</span>`;
  }).join('');
}
