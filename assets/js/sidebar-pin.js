/* Pin/unpin sidebar on desktop by toggling the attribute used by theme CSS */
(function () {
  if (typeof window === 'undefined') return;
  const lgQuery = window.matchMedia('(min-width: 992px)');
  const root = document.documentElement; // <html>
  const body = document.body;
  const trigger = document.getElementById('sidebar-trigger');
  if (!trigger) return;

  const KEY = 'sidebarPinned';

  function isPinnedStored() {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch (_) {
      return false;
    }
  }

  function setPinnedStored(pinned) {
    try {
      localStorage.setItem(KEY, pinned ? '1' : '0');
    } catch (_) {}
  }

  function togglePinned() {
    if (!lgQuery.matches) return; // respect mobile behavior
    const has =
      root.hasAttribute('sidebar-display') ||
      body.hasAttribute('sidebar-display');
    if (has) {
      root.removeAttribute('sidebar-display');
      body.removeAttribute('sidebar-display');
      setPinnedStored(false);
    } else {
      root.setAttribute('sidebar-display', '');
      setPinnedStored(true);
    }
  }

  trigger.addEventListener('click', function (ev) {
    // prevent default behavior only on desktop to avoid interfering with mobile drawer
    if (lgQuery.matches) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      togglePinned();
    }
  });

  function applyInitialState() {
    // Only apply pinned attribute on desktop
    if (lgQuery.matches) {
      if (isPinnedStored()) {
        root.setAttribute('sidebar-display', '');
      }
    } else {
      // Ensure attribute is removed on mobile for drawer logic
      root.removeAttribute('sidebar-display');
      body.removeAttribute('sidebar-display');
    }
  }

  // Apply on load
  applyInitialState();

  // React to viewport changes
  try {
    lgQuery.addEventListener('change', applyInitialState);
  } catch (_) {
    // Safari < 14
    lgQuery.addListener(applyInitialState);
  }
})();
