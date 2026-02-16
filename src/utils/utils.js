import pkg from '../../package.json';
let blur, focus, panicListener;

const getStoredOptions = () => {
  try {
    const raw = localStorage.getItem('options');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeStoredOptions = (options) => {
  try {
    localStorage.setItem('options', JSON.stringify(options));
  } catch {}
};

const ckOff = () => {
  const op = getStoredOptions();
  import('./config.js').then(({ meta }) => {
    const { tabName: t, tabIcon: i } = op;
    const { tabName: ogName, tabIcon: ogIcon } = meta[0].value;
    const set = (title, icon) => {
      document.title = title;
      document.querySelector("link[rel~='icon']")?.setAttribute('href', icon);
    };
    blur && window.removeEventListener('blur', blur);
    focus && window.removeEventListener('focus', focus);
    if (op.clkOff) {
      set(t, i);
      blur = () => {
        const nextOptions = getStoredOptions();
        set(nextOptions.tabName || ogName, nextOptions.tabIcon || ogIcon);
      };
      focus = () => set(ogName, ogIcon);
      window.addEventListener('blur', blur);
      window.addEventListener('focus', focus);
      set(ogName, ogIcon);
    } else {
      set(t || ogName, i || ogIcon);
      blur = focus = null;
    }
  });
};

const panic = () => {
  const op = getStoredOptions();
  const panicConfig = op.panic;
  if (panicListener) {
    window.removeEventListener('keydown', panicListener);
    panicListener = null;
  }
  if (panicConfig?.key && panicConfig?.url && !!op.panicToggleEnabled) {
    panicListener = (e) => {
      const combo = [];
      if (e.ctrlKey) combo.push('Ctrl');
      if (e.altKey) combo.push('Alt');
      if (e.shiftKey) combo.push('Shift');
      if (e.metaKey) combo.push('Meta');
      combo.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);

      const pressed = combo.join('+');
      if (pressed === panicConfig.key) {
        e.preventDefault();
        window.location.href = panicConfig.url;
      }
    };

    window.addEventListener('keydown', panicListener);
  }
};

(() => {
  const op = getStoredOptions();
  if (!op.version) {
    writeStoredOptions({ ...op, version: pkg.version });
  }
  if (op.beforeUnload) {
    window.addEventListener('beforeunload', (e) => {
      e.preventDefault();
      e.returnValue = '';
    });
  }
  if (window.top === window.self && op.aboutBlank) {
    const w = open('about:blank');
    if (!w || w.closed) {
      alert('Please enable popups to continue.');
      location.href = 'https://google.com';
    } else {
      const win = w.window,
        d = win.document,
        f = d.createElement('iframe');

      Object.assign(f, { src: location.href });
      Object.assign(f.style, { width: '100%', height: '100%', border: 'none' });
      Object.assign(d.body.style, { margin: 0, height: '100vh' });
      d.documentElement.style.height = '100%';
      d.head.appendChild(Object.assign(document.createElement('link'), { rel: 'icon', href: '' }));
      d.body.append(f);
      const s = d.createElement('script');
      s.textContent = `
        const readOptions = () => {
          try {
            const raw = localStorage.getItem('options');
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
          } catch {
            return {};
          }
        };
        const d = document;
        setInterval(() => {
          const op = readOptions();
          d.title = op.tabName || '';
          let icon = d.querySelector("link[rel~='icon']");
          if (!icon) {
            icon = d.createElement('link');
            icon.rel = 'icon';
            d.head.appendChild(icon);
          }
          icon.href = op.tabIcon || '';
        }, 800);
      `;
      d.head.appendChild(s);
      location.href = 'https://google.com';
    }
    history.replaceState(null, '', import.meta.env.BASE_URL || '/');
  }

  ckOff();
  panic();
})();
