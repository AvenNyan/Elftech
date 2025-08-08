// script.js — обновлённая версия: кликабельные картинки, универсальный модал
document.addEventListener('DOMContentLoaded', () => {
  // вставляем год в футеры
  const y = new Date().getFullYear();
  document.querySelectorAll('#year, #year-toys, #year-vases, #year-repair, #year-resin').forEach(el => {
    if (el) el.textContent = y;
  });

  // подсветка верхней и нижней навигации по URL
  const path = location.pathname.split('/').pop() || 'index.html';
  const pageMap = { 'index.html':'index', '': 'index', 'toys.html':'toys','vases.html':'vases','repair.html':'repair','resin.html':'resin' };
  const key = pageMap[path] || 'index';

  // top-nav: по атрибуту href
  document.querySelectorAll('.top-nav .nav-link').forEach(a => {
    const href = a.getAttribute('href') || '';
    const should = href.endsWith(key + '.html') || (key === 'index' && href.endsWith('index.html'));
    a.classList.toggle('active', should);
  });

  // bottom nav
  document.querySelectorAll('.bn-item').forEach(a => a.classList.remove('active'));
  const bottom = document.getElementById('bn-' + key);
  if (bottom) bottom.classList.add('active');

  // modal hookup (close behavior)
  const modal = document.getElementById('modal');
  if (modal) {
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
  }

  // Attach click handlers to gallery images (robust: uses data-key or matches filename in data)
  const galleryImgs = document.querySelectorAll('.gallery img, .gallery-item, img.gallery-item');
  galleryImgs.forEach(img => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      // 1) try explicit data-key on img or nearest parent
      const explicitKey = img.dataset.key || img.closest('[data-key]')?.dataset?.key;
      if (explicitKey && window.data && data[explicitKey]) {
        openModalByKey(explicitKey);
        return;
      }

      // 2) try to match filename to entries in data/items.js
      if (window.data) {
        const filename = img.getAttribute('src')?.split('/').pop();
        if (filename) {
          for (const k in data) {
            const colors = data[k].colors || {};
            for (const colorKey in colors) {
              const p = colors[colorKey].img || '';
              const name = p.split('/').pop();
              if (name === filename) {
                openModalByKey(k, colorKey);
                return;
              }
            }
          }
        }
      }

      // 3) fallback — просто открыть изображение в модале (без данных)
      if (modal) {
        const imgEl = modal.querySelector('#modal-img') || modal.querySelector('img');
        const desc = modal.querySelector('#description') || modal.querySelector('.modal-description');
        if (imgEl) imgEl.src = img.src;
        if (desc) desc.textContent = img.alt || '';
        if (modal.querySelector('#ozon-link')) modal.querySelector('#ozon-link').href = '#';
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
      }
    });
  });
});

// open modal using data from data/items.js
function openModalByKey(key, colorKey) {
  if (!window.data || !data[key]) return;
  const item = data[key];
  const modal = document.getElementById('modal');
  if (!modal) return;

  const imgEl = modal.querySelector('#modal-img');
  const descEl = modal.querySelector('#description');
  const colorButtons = modal.querySelector('#color-buttons');
  const ozLink = modal.querySelector('#ozon-link');

  const available = Object.keys(item.colors || {});
  const chosen = colorKey || available[0];

  if (imgEl && item.colors[chosen]) {
    imgEl.src = item.colors[chosen].img;
    imgEl.alt = item.name || '';
  }
  if (descEl) {
    descEl.textContent = (item.name ? item.name + '. ' : '') + (item.description || '');
  }
  if (ozLink) {
    ozLink.href = item.colors[chosen]?.ozon || '#';
  }

  // build color buttons
  if (colorButtons) {
    colorButtons.innerHTML = '';
    available.forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = c;
      b.className = (c === chosen) ? 'active' : '';
      b.addEventListener('click', () => {
        if (imgEl && item.colors[c]) imgEl.src = item.colors[c].img;
        if (ozLink) ozLink.href = item.colors[c]?.ozon || '#';
        colorButtons.querySelectorAll('button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
      });
      colorButtons.appendChild(b);
    });
  }

  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (!modal) return;
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
}
