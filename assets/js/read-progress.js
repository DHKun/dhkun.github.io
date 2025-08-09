/* Reading progress bar for post pages */
(function () {
  if (typeof window === 'undefined') return;
  // Only on post pages (article exists)
  const article = document.querySelector('article');
  if (!article) return;

  const bar = document.createElement('div');
  bar.id = 'read-progress';
  document.body.appendChild(bar);

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function update() {
    const start = article.offsetTop;
    const end = start + article.offsetHeight - window.innerHeight;
    const progress = clamp((window.scrollY - start) / (end - start), 0, 1);
    bar.style.width = (progress * 100).toFixed(3) + '%';
    // Hide when not in range
    bar.style.opacity = progress <= 0 ? '0' : '1';
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  window.addEventListener('load', update, { passive: true });
  update();
})();
