const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    siteNav.classList.toggle('open');
  });
}

// ── hCaptcha explicit render ───────────────────────────────
let hcaptchaWidgetId = null;

window.onHcaptchaLoaded = function () {
  const el = document.querySelector('.h-captcha');
  if (!el) return;
  const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  hcaptchaWidgetId = hcaptcha.render(el, { sitekey: el.dataset.sitekey, theme });
};

// ── Theme toggle ───────────────────────────────────────────
const themeToggle = document.querySelector('.theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('raf-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('raf-theme', 'light');
    }

    // Re-render hCaptcha with the new theme
    const hcaptchaEl = document.querySelector('.h-captcha');
    if (hcaptchaEl && typeof hcaptcha !== 'undefined' && hcaptchaWidgetId !== null) {
      hcaptcha.remove(hcaptchaWidgetId);
      const newTheme = isLight ? 'dark' : 'light';
      hcaptchaWidgetId = hcaptcha.render(hcaptchaEl, {
        sitekey: hcaptchaEl.dataset.sitekey,
        theme: newTheme
      });
    }
  });
}

// ── Contact form ───────────────────────────────────────────
const form = document.querySelector('.contact-form');
if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const btn = form.querySelector('button[type="submit"]');

    if (typeof hcaptcha !== 'undefined' && !hcaptcha.getResponse(hcaptchaWidgetId)) {
      alert('Please complete the captcha first.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        form.innerHTML = '<p class="form-success">Your message has been sent. I\'ll get back to you soon.</p>';
      } else {
        if (typeof hcaptcha !== 'undefined') hcaptcha.reset(hcaptchaWidgetId);
        btn.disabled = false;
        btn.textContent = 'Send message';
        alert('Something went wrong. Please try again.');
      }
    } catch {
      if (typeof hcaptcha !== 'undefined') hcaptcha.reset(hcaptchaWidgetId);
      btn.disabled = false;
      btn.textContent = 'Send message';
      alert('Something went wrong. Please try again.');
    }
  });
}

// ── Reveal on scroll ───────────────────────────────────────
const revealItems = document.querySelectorAll('.reveal-item');
if ('IntersectionObserver' in window && revealItems.length) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach(el => obs.observe(el));
} else {
  revealItems.forEach(el => el.classList.add('is-revealed'));
}

// Small icon entrance pulse on load
window.addEventListener('load', () => {
  const sword = document.querySelector('.icon.sword');
  if (sword) {
    sword.classList.add('pulse');
    setTimeout(() => sword.classList.remove('pulse'), 2000);
  }
});

// ── Site preview modal (treasure chest cards) ─────────────

document.querySelectorAll('.chest-card').forEach(card => {
  card.addEventListener('click', () => openSitePreview(card));
});

function openSitePreview(card) {
  if (document.querySelector('.site-preview-overlay')) return;

  const url = card.dataset.url;
  const name = card.dataset.name;
  const thumbUrl = 'https://image.thum.io/get/width/1280/crop/720/' + url;

  const overlay = document.createElement('div');
  overlay.className = 'site-preview-overlay';

  overlay.innerHTML = `
    <div class="site-preview-modal">
      <div class="site-preview-header">
        <span class="site-preview-title"></span>
        <button class="site-preview-close" aria-label="Close preview">&#x2715;</button>
      </div>
      <div class="site-preview-frame">
        <div class="site-preview-loading">Loading preview…</div>
        <img class="site-preview-img" alt="" />
      </div>
      <div class="site-preview-footer">
        <a class="button primary" target="_blank" rel="noopener noreferrer">Visit Site &#x2197;</a>
      </div>
    </div>
  `;

  overlay.querySelector('.site-preview-title').textContent = name;
  const img = overlay.querySelector('.site-preview-img');
  img.alt = name + ' website screenshot';
  img.src = thumbUrl;
  const visitBtn = overlay.querySelector('.site-preview-footer a');
  visitBtn.href = url;

  document.body.appendChild(overlay);

  const loading = overlay.querySelector('.site-preview-loading');
  img.addEventListener('load', () => {
    loading.style.display = 'none';
    img.classList.add('loaded');
  });
  img.addEventListener('error', () => {
    loading.textContent = 'Preview unavailable';
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add('is-active');
    });
  });

  function closePreview() {
    overlay.classList.remove('is-active');
    const modal = overlay.querySelector('.site-preview-modal');
    modal.classList.add('is-closing');
    setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 320);
  }

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closePreview();
  });
  overlay.querySelector('.site-preview-close').addEventListener('click', closePreview);
  document.addEventListener('keydown', function onEsc(e) {
    if (e.key === 'Escape') {
      closePreview();
      document.removeEventListener('keydown', onEsc);
    }
  });
}

// ── Card modal (MTG-style reveal) ──────────────────────────

document.querySelectorAll('.card-art').forEach(card => {
  card.addEventListener('click', () => openCardModal(card));
});

function openCardModal(sourceCard) {
  if (document.querySelector('.card-modal-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'card-modal-overlay';

  const clone = sourceCard.cloneNode(true);
  clone.classList.add('card-modal-card');
  clone.querySelectorAll('.reveal-item').forEach(el => el.classList.add('is-revealed'));
  clone.style.transform = '';

  overlay.appendChild(clone);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add('is-active');
      clone.classList.add('is-active');
    });
  });

  function closeModal() {
    overlay.classList.remove('is-active');
    clone.classList.remove('is-active');
    clone.classList.add('is-closing');
    setTimeout(() => {
      if (overlay.parentNode) overlay.remove();
    }, 380);
  }

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', function onEsc(e) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', onEsc);
    }
  });
}
