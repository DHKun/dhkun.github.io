/* Convert blockquotes starting with [!TYPE] into styled admonitions */
(function () {
  if (typeof window === 'undefined') return;
  document.addEventListener('DOMContentLoaded', function () {
    const map = {
      NOTE: { cls: 'note', label: 'Note', icon: 'fa-regular fa-note-sticky' },
      TIP: { cls: 'tip', label: 'Tip', icon: 'fa-solid fa-lightbulb' },
      INFO: { cls: 'info', label: 'Info', icon: 'fa-regular fa-circle-info' },
      WARNING: {
        cls: 'warning',
        label: 'Warning',
        icon: 'fa-solid fa-triangle-exclamation',
      },
      CAUTION: {
        cls: 'warning',
        label: 'Caution',
        icon: 'fa-solid fa-triangle-exclamation',
      },
      DANGER: {
        cls: 'danger',
        label: 'Danger',
        icon: 'fa-solid fa-circle-exclamation',
      },
    };

    document.querySelectorAll('.post-content blockquote').forEach((bq) => {
      const first = bq.firstElementChild;
      if (!first) return;
      const text = first.textContent.trim();
      const m = text.match(
        /^\[\!(NOTE|TIP|INFO|WARNING|CAUTION|DANGER)\]\s*(.*)$/i
      );
      if (!m) return;

      const key = m[1].toUpperCase();
      const rest = m[2];
      const conf = map[key];
      if (!conf) return;

      bq.classList.add('admonition', conf.cls);

      // build title
      const title = document.createElement('div');
      title.className = 'admonition-title';
      title.innerHTML = `<i class="${conf.icon}"></i><span>${conf.label}</span>`;

      // replace first paragraph content without the marker
      if (rest) {
        first.textContent = rest;
      } else {
        first.remove();
      }

      bq.prepend(title);
    });
  });
})();
