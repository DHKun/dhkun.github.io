/* Pin/unpin sidebar on desktop by toggling the attribute used by theme CSS */
(function () {
  if (typeof window === 'undefined') return;
  const lgQuery = window.matchMedia('(min-width: 992px)');
  const root = document.documentElement; // <html>
  const body = document.body;
  const trigger = document.getElementById('sidebar-trigger');
  if (!trigger) return;

  function togglePinned() {
    if (!lgQuery.matches) return; // respect mobile behavior
    const has = root.hasAttribute('sidebar-display') || body.hasAttribute('sidebar-display');
    if (has) {
      root.removeAttribute('sidebar-display');
      body.removeAttribute('sidebar-display');
    } else {
      root.setAttribute('sidebar-display', '');
    }
  }

  trigger.addEventListener('click', function (ev) {
    // prevent default behavior only on desktop to avoid interfering with mobile drawer
    if (lgQuery.matches) {
      ev.preventDefault();
      togglePinned();
    }
  });
})();


