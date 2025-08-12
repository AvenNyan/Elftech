/* script.js — модалка с лентой миниатюр, per-color ozon, компактные контакты, авто-дополнение галереи */
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal');
  if (!modal) return;

  const modalImg = document.getElementById('modal-img');
  const descEl = document.getElementById('description');
  const ozonLink = document.getElementById('ozon-link');
  const closeBtn = modal.querySelector('.modal-close');

  // set year placeholders
  const year = new Date().getFullYear();
  ['year','year-toys','year-vases','year-repair','year-resin'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = year;
  });

  const RAW = window.itemsData || window.items || null;

  function normalize(raw) {
    if (!raw) return null;
    const out = {
      name: raw.name || raw.title || '',
      description: raw.description || raw.desc || raw.text || '',
      ozon: raw.ozon || raw.oz || raw.ozon_link || '',
      contacts: raw.contacts || { telegram: raw.telegram || raw.tg || '@AvenNyan', whatsapp: raw.whatsapp || raw.phone || raw.tel || '+79818522194' },
      images: [],
      colors: []
    };

    if (Array.isArray(raw.images) && raw.images.length) out.images = raw.images.slice();
    else if (raw.image) out.images.push(raw.image);
    else if (raw.img) out.images.push(raw.img);

    if (Array.isArray(raw.colors) && raw.colors.length) {
      raw.colors.forEach((c, i) => {
        if (typeof c === 'string') out.colors.push({ name: c, img: out.images[i] || '', ozon: '' });
        else if (c && typeof c === 'object') {
          const img = c.img || c.image || '';
          out.colors.push({ name: c.name || c.title || ('Вариант ' + (i+1)), img, hex: c.hex || c.color || '', ozon: c.ozon || c.ozon_link || c.oz || '' });
          if (img && !out.images.includes(img)) out.images.push(img);
        }
      });
    } else if (raw.colors && typeof raw.colors === 'object') {
      Object.keys(raw.colors).forEach(k => {
        const v = raw.colors[k];
        if (typeof v === 'string') { out.colors.push({ name: k, img: v, ozon: '' }); if (!out.images.includes(v)) out.images.push(v); }
        else if (v && typeof v === 'object') {
          const img = v.img || v.image || '';
          out.colors.push({ name: k, img, hex: v.hex || v.color || '', ozon: v.ozon || v.ozon_link || v.oz || '' });
          if (img && !out.images.includes(img)) out.images.push(img);
        }
      });
    }

    // fallback: colors from images
    if (out.colors.length === 0 && out.images.length) out.images.forEach((im, i) => out.colors.push({ name: 'Вариант ' + (i+1), img: im, ozon: '' }));

    return out;
  }

  function findItemByTarget(target) {
    const key = target.dataset?.key;
    if (key && RAW && RAW[key]) return { key, item: normalize(RAW[key]) };

    const src = target.getAttribute('src') || target.dataset?.src || '';
    const filename = src.split('/').pop();
    if (!filename || !RAW) return null;

    for (const k in RAW) {
      const norm = normalize(RAW[k]);
      if (!norm) continue;
      for (const im of norm.images) if (im && im.split('/').pop() === filename) return { key: k, item: norm };
      for (const c of norm.colors) if (c && c.img && c.img.split('/').pop() === filename) return { key: k, item: norm };
    }
    return null;
  }

  // thumbs container
  let thumbsContainer = modal.querySelector('.modal-thumbs');
  if (!thumbsContainer) {
    thumbsContainer = document.createElement('div');
    thumbsContainer.className = 'modal-thumbs';
  }

  let currentImages = [];
  let currentOzon = []; // per-image ozon links ('' if none)
  let currentIndex = 0;

  autoFillGallery(); // append missing items if needed

  // delegated clicking on gallery
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.gallery img, .gallery-item, img[data-key]');
    if (!target) return;
    e.preventDefault();

    const found = findItemByTarget(target);
    if (found && found.item) openModalWithItem(found.item);
    else openRawImage(target);
  });

  function openRawImage(imgEl) {
    currentImages = [ imgEl.src ];
    currentOzon = [''];
    currentIndex = 0;
    renderMainAndThumbs();
    descEl.textContent = imgEl.alt || '';
    hideOzon();
    fillContactsEmpty();
    showModal();
  }

  function openModalWithItem(item) {
    // build arrays of images and per-image ozon links
    const colors = item.colors && item.colors.length ? item.colors : (item.images.map((im, i) => ({ name: 'Вариант ' + (i+1), img: im, ozon: item.ozon || '' })));
    currentImages = colors.map(c => c.img || '');
    currentOzon = colors.map(c => c.ozon || item.ozon || '');
    if (!currentImages || currentImages.length === 0) currentImages = [''];
    currentIndex = 0;

    renderMainAndThumbs();
    descEl.textContent = (item.name ? item.name + '. ' : '') + (item.description || '');

    // show ozon for the current image if exists
    updateOzonForIndex(currentIndex);

    fillContacts(item.contacts);
    showModal();
  }

  function renderMainAndThumbs() {
    modalImg.src = currentImages[currentIndex] || '';
    modalImg.alt = '';

    thumbsContainer.innerHTML = '';
    currentImages.forEach((src, idx) => {
      const t = document.createElement('img');
      t.src = src;
      t.className = 'thumb';
      if (idx === currentIndex) t.classList.add('active');
      t.dataset.index = idx;
      // attach per-thumb click
      t.addEventListener('click', () => {
        currentIndex = idx;
        renderMainAndThumbs();
        updateOzonForIndex(idx);
      });
      thumbsContainer.appendChild(t);
    });

    const panel = modal.querySelector('.modal-panel');
    if (panel && !panel.contains(thumbsContainer)) {
      const imgNode = panel.querySelector('#modal-img');
      if (imgNode) imgNode.insertAdjacentElement('afterend', thumbsContainer);
      else panel.appendChild(thumbsContainer);
    }

    const active = thumbsContainer.querySelector('.thumb.active');
    if (active) active.scrollIntoView({ inline:'center', behavior:'auto' });
  }

  function updateOzonForIndex(idx) {
    const oz = (currentOzon && currentOzon[idx]) ? String(currentOzon[idx]).trim() : '';
    if (oz) {
      ozonLink.href = oz;
      ozonLink.style.display = 'inline-block';
    } else {
      hideOzon();
    }
  }

  function hideOzon() {
    if (ozonLink) { ozonLink.href = '#'; ozonLink.style.display = 'none'; }
  }

  /* Contacts handling: use existing "Контакты" block if present, else create modal-contacts */
  function getOrCreateContactsContainer() {
    let container = modal.querySelector('.modal-contacts');
    if (container) return container;

    // try to find an existing inline "Контакты" block (static markup) and reuse it
    const panel = modal.querySelector('.modal-panel');
    if (panel) {
      const possible = Array.from(panel.children).find(ch => {
        if (ch === thumbsContainer) return false;
        if (ch.classList && ch.classList.contains('modal-contacts')) return true;
        if (ch.tagName === 'DIV' || ch.tagName === 'P') {
          const txt = (ch.textContent || '').trim();
          return /контакт/i.test(txt) && txt.length < 200; // heuristic: contains 'Контакт' and not huge
        }
        return false;
      });
      if (possible) {
        possible.classList.add('modal-contacts');
        container = possible;
      }
    }

    if (!container) {
      container = document.createElement('div');
      container.className = 'modal-contacts';
      modal.querySelector('.modal-panel')?.appendChild(container);
    }
    return container;
  }

  function fillContacts(contacts) {
    const container = getOrCreateContactsContainer();
    container.innerHTML = '';
    const tg = contacts?.telegram || contacts?.tg || contacts?.telegram_handle || '@AvenNyan';
    const wa = contacts?.whatsapp || contacts?.wh || contacts?.phone || contacts?.tel || '+7 981 852-21-94';
    const tgLink = `<a href="https://t.me/${tg.replace(/^@/,'')}" target="_blank" rel="noopener">Telegram: ${tg}</a>`;
    const waLink = `<a href="https://wa.me/${String(wa).replace(/\D/g,'')}" target="_blank" rel="noopener">WhatsApp: ${wa}</a>`;
    container.innerHTML = `${tgLink} &nbsp;|&nbsp; ${waLink}`;
  }

  function fillContactsEmpty() {
    const container = getOrCreateContactsContainer();
    container.innerHTML = `<a href="https://t.me/AvenNyan" target="_blank" rel="noopener">Telegram: @AvenNyan</a> &nbsp;|&nbsp; <a href="https://wa.me/79818522194" target="_blank" rel="noopener">WhatsApp: +7 981 852-21-94</a>`;
  }

  function copyToClipboard(text, btn) {
    if (!text) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        const prev = btn.textContent; btn.textContent = 'Скопировано';
        setTimeout(()=> btn.textContent = prev, 1200);
      }).catch(()=> {});
    }
  }

  // swipe support on modalImg
  let touchStartX = null;
  modalImg.addEventListener('touchstart', (e) => { if (e.touches && e.touches.length) touchStartX = e.touches[0].clientX; }, {passive:true});
  modalImg.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const x = e.changedTouches[0].clientX;
    const diff = x - touchStartX; touchStartX = null;
    if (diff > 50) prevImage(); if (diff < -50) nextImage();
  }, {passive:true});

  // keyboard nav
  document.addEventListener('keydown', (e) => {
    if (modal.getAttribute('aria-hidden') === 'false') {
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'Escape') closeModal();
    }
  });

  function nextImage(){ if (!currentImages || currentImages.length <= 1) return; currentIndex = (currentIndex + 1) % currentImages.length; renderMainAndThumbs(); updateOzonForIndex(currentIndex); }
  function prevImage(){ if (!currentImages || currentImages.length <= 1) return; currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length; renderMainAndThumbs(); updateOzonForIndex(currentIndex); }

  function showModal(){ modal.style.display = 'flex'; modal.classList.add('show'); modal.setAttribute('aria-hidden','false'); document.body.classList.add('no-scroll'); }
  function closeModal(){ modal.style.display = 'none'; modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); document.body.classList.remove('no-scroll'); }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  /* ---------- AUTO-FILL GALLERY: append missing items if gallery has less elements ---------- */
  function autoFillGallery() {
    if (!RAW) return;
    const gallery = document.querySelector('.gallery');
    if (!gallery) return;

    const keys = Object.keys(RAW);
    const toyKeys = keys.filter(k => (/frog|dragon|toy|игруш/i).test(k) || String(RAW[k].name||'').toLowerCase().includes('лягуш') || String(RAW[k].name||'').toLowerCase().includes('дракон'));
    const renderKeys = toyKeys.length ? toyKeys : keys;

    // existing keys in DOM
    const existingKeys = new Set(Array.from(gallery.querySelectorAll('[data-key]')).map(img => img.dataset.key).filter(Boolean));

    renderKeys.forEach(k => {
      if (existingKeys.has(k)) return;
      const raw = RAW[k];
      const norm = normalize(raw);
      const thumbSrc = norm.images && norm.images[0] ? norm.images[0] : (norm.colors && norm.colors[0] ? norm.colors[0].img : 'images/placeholder.png');
      const wrap = document.createElement('div');
      wrap.className = 'gallery-item';
      const img = document.createElement('img');
      img.src = thumbSrc;
      img.alt = norm.name || k;
      img.loading = 'lazy';
      img.dataset.key = k;
      wrap.appendChild(img);
      gallery.appendChild(wrap);
    });
  }

});
