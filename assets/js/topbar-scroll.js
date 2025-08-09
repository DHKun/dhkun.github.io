/* Toggle solid topbar on scroll (apple-like) */
(function () {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const THRESHOLD = 24; // px

  function update() {
    if (window.scrollY > THRESHOLD) {
      root.classList.add('topbar-solid');
    } else {
      root.classList.remove('topbar-solid');
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('load', update, { passive: true });
  update();
})();
