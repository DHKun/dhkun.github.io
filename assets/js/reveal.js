/* Lightweight reveal-on-scroll effect (respects reduced motion) */
(function () {
  if (typeof window === 'undefined') return;
  try {
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReduce.matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('reveal-in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
    );

    function markAndObserve(selector) {
      document.querySelectorAll(selector).forEach((el) => {
        if (!el.classList.contains('reveal-in')) {
          el.classList.add('reveal');
          io.observe(el);
        }
      });
    }

    window.addEventListener('load', () => {
      // Home cards and post content blocks
      markAndObserve('#post-list .card-wrapper, .post-content > *');
    });
  } catch (_) {
    // no-op
  }
})();
