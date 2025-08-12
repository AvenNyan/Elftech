/* Универсальный script.js — модалка с лентой миниатюр + свайп + клавиши */
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  const descEl = document.getElementById('description');
  const ozonLink = document.getElementById('ozon-link');
  const colorButtons = document.getElementById('color-buttons'); // kept for backcompat
  const closeBtn = modal?.querySelector('.modal-close');

  // Defensive: ensure modal exists
  if (!modal) return;

  // hide initially
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');

  // set year in footer elements (if present)
  const y = new Date().getFullYear();
  ['year','year-toys','year-vases','year-repair','year-resin'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = y;
  });

  // Data source: try commonly used globals
  const RAW_DATA = window.itemsData || window.items || window.windowItems || null;

  // normalize input item (works with many shapes)
  function normalize(raw) {
    if (!raw) return null;
    const out = {
      name: raw.name || raw.title || '',
      description: raw.description || raw.desc || raw.text || '',
      ozon: raw.ozon || raw.oz || raw.ozon_link || '',
      contacts: raw.contacts || { telegram: raw.telegram || raw.tg || '', whatsapp: raw.whatsapp || raw.phone || raw.tel || '' },
      images: [],
      colors: []
    };

    // images priority
    if (Array.isArray(raw.images) && raw.images.length) out.images = raw.images.slice();
    else if (raw.image) out.images.push(raw.image);
    else if (raw.img) out.images.push(raw.img);

    // colors can be array/object
    if (Array.isArray(raw.colors) && raw.colors.length) {
      raw.colors.forEach((c, i) => {
        if (typeof c === 'string') {
          out.colors.push({ name: c, img: out.images[i] || '' });
        } else if (c && typeof c === 'object') {
          const img = c.img || c.image || '';
          out.colors.push({ name: c.name || c.title || ('Вариант ' + (i+1)), img, hex: c.hex || c.color || '' });
          if (img && !out.images.includes(img)) out.images.push(img);
        }
      });
    } else if (raw.colors && typeof raw.colors === 'object') {
      Object.keys(raw.colors).forEach(k => {
        const v = raw.colors[k];
        if (typeof v === 'string') {
          out.colors.push({ name: k, img: v });
          if (!out.images.includes(v)) out.images.push(v);
        } else if (v && typeof v === 'object') {
          const img = v.img || v.image || '';
          out.colors.push({ name: k, img, hex: v.hex || v.color || '' });
          if (img && !out.images.includes(img)) out.images.push(img);
        }
      });
    }

    // fallback: create colors from images
    if (out.colors.length === 0 && out.images.length) {
      out.images.forEach((im, idx) => out.colors.push({ name: 'Вариант ' + (idx+1), img: im }));
    }
    return out;
  }

  // find item by data-key or by image filename
  function findItemByTarget(target) {
    // prefer data-key if present
    const key = target.dataset?.key;
    if (key && RAW_DATA && RAW_DATA[key]) return { key, item: normalize(RAW_DATA[key]) };

    // fallback: try to match filename in RAW_DATA
    const src = target.getAttribute('src') || target.dataset?.src || '';
    const filename = src.split('/').pop();
    if (!filename || !RAW_DATA) return null;

    for (const k in RAW_DATA) {
      const raw = RAW_DATA[k];
      const norm = normalize(raw);
      if (!norm) continue;
      // images
      for (const im of norm.images) {
        if (!im) continue;
        if (im.split('/').pop() === filename) return { key: k, item: norm };
      }
      // colors
      for (const c of norm.colors) {
        if (!c || !c.img) continue;
        if (c.img.split('/').pop() === filename) return { key: k, item: norm };
      }
    }
    return null;
  }

  // create thumbnail container inside modal (just once)
  let thumbsContainer = modal.querySelector('.modal-thumbs');
  if (!thumbsContainer) {
    thumbsContainer = document.createElement('div');
    thumbsContainer.className = 'modal-thumbs';
    // We'll insert it after modalImg when opening the modal
  }

  let currentImages = [];
  let currentIndex = 0;

  // delegated click handler for gallery images
  document.addEventListener('click', (e) => {
    const img = e.target.closest('.gallery img, .gallery-item, img[data-key]');
    if (!img) return;
    e.preventDefault();

    const found = findItemByTarget(img);
    if (found && found.item) {
      openModalWithItem(found.item);
    } else {
      openRawImage(img);
    }
  });

  // open raw image without item data
  function openRawImage(imgEl) {
    currentImages = [ imgEl.src ];
    currentIndex = 0;
    renderMainAndThumbs();
    descEl.textContent = imgEl.alt || '';
    ozonLink.style.display = 'none';
    fillContactsEmpty();
    showModal();
  }

  // open modal with normalized item
  function openModalWithItem(item) {
    currentImages = (item.images && item.images.length) ? item.images.slice() : (item.colors.map(c => c.img).filter(Boolean));
    if (!currentImages || currentImages.length === 0) currentImages = ['']; // guard
    currentIndex = 0;
    renderMainAndThumbs();

    descEl.textContent = (item.name ? item.name + '. ' : '') + (item.description || '');

    if (item.ozon && String(item.ozon).trim() !== '') {
      ozonLink.href = item.ozon;
      ozonLink.style.display = 'inline-block';
    } else {
      ozonLink.style.display = 'none';
    }

    fillContacts(item.contacts);
    showModal();
  }

  // render main image and thumbnails
  function renderMainAndThumbs() {
    if (!modalImg) return;
    modalImg.src = currentImages[currentIndex] || '';
    modalImg.alt = '';

    // render thumbs
    thumbsContainer.innerHTML = '';
    currentImages.forEach((src, idx) => {
      const t = document.createElement('img');
      t.src = src;
      t.className = 'thumb';
      if (idx === currentIndex) t.classList.add('active');
      t.dataset.index = idx;
      t.addEventListener('click', () => {
        currentIndex = idx;
        renderMainAndThumbs();
      });
      thumbsContainer.appendChild(t);
    });

    // ensure thumbsContainer is in DOM right after modalImg
    // (avoid duplicating)
    const panel = modal.querySelector('.modal-panel');
    if (panel && !panel.contains(thumbsContainer)) {
      // find modalImg in panel and insert after it
      const imgNode = panel.querySelector('#modal-img');
      if (imgNode) imgNode.insertAdjacentElement('afterend', thumbsContainer);
      else panel.appendChild(thumbsContainer);
    }
    // scroll active thumb into view
    const active = thumbsContainer.querySelector('.thumb.active');
    if (active) active.scrollIntoView({ inline: 'center', behavior: 'auto' });
  }

  // fill contacts (clickable links + copy fields)
  function fillContacts(contacts) {
    let container = modal.querySelector('.modal-contacts');
    if (!container) {
      container = document.createElement('div');
      container.className = 'modal-contacts';
      modal.querySelector('.modal-panel')?.appendChild(container);
    }
    container.innerHTML = '';

    if (!contacts) return fillContactsEmpty();

    const tg = contacts.telegram || contacts.tg || contacts.telegram_handle || '';
    const wa = contacts.whatsapp || contacts.wh || contacts.phone || contacts.tel || '';

    const linksDiv = document.createElement('div');
    linksDiv.innerHTML = `
      ${tg ? `<a href="https://t.me/${tg.replace(/^@/,'')}" target="_blank" rel="noopener">Telegram: ${tg}</a>` : ''}
      ${tg && wa ? ' | ' : ''}
      ${wa ? `<a href="https://wa.me/${String(wa).replace(/\D/g,'')}" target="_blank" rel="noopener">WhatsApp: ${wa}</a>` : ''}
    `;
    container.appendChild(linksDiv);

    const copyRow = document.createElement('div');
    copyRow.className = 'copy-row';
    if (tg) {
      const wrap = document.createElement('div');
      const input = document.createElement('input'); input.readOnly = true; input.value = tg;
      const btn = document.createElement('button'); btn.textContent = 'Копировать'; btn.className='copy-btn';
      btn.addEventListener('click', () => copyToClipboard(tg, btn));
      wrap.appendChild(input); wrap.appendChild(btn); copyRow.appendChild(wrap);
    }
    if (wa) {
      const wrap = document.createElement('div');
      const input = document.createElement('input'); input.readOnly = true; input.value = wa;
      const btn = document.createElement('button'); btn.textContent = 'Копировать'; btn.className='copy-btn';
      btn.addEventListener('click', () => copyToClipboard(wa, btn));
      wrap.appendChild(input); wrap.appendChild(btn); copyRow.appendChild(wrap);
    }
    if (copyRow.children.length) container.appendChild(copyRow);
  }

  function fillContactsEmpty() {
    let container = modal.querySelector('.modal-contacts');
    if (!container) {
      container = document.createElement('div');
      container.className = 'modal-contacts';
      modal.querySelector('.modal-panel')?.appendChild(container);
    }
    container.innerHTML = '<div style="color:var(--muted)">Контакты: Telegram @AvenNyan | WhatsApp +7 981 852-21-94</div>';
  }

  function copyToClipboard(text, btn) {
    if (!text) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        const prev = btn.textContent; btn.textContent = 'Скопировано';
        setTimeout(()=> btn.textContent = prev, 1200);
      }).catch(()=> {});
    } else {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); const prev = btn.textContent; btn.textContent = 'Скопировано'; setTimeout(()=> btn.textContent = prev,1200); } catch(e){}
      ta.remove();
    }
  }

  // swipe support on the main modal image
  let touchStartX = null;
  modalImg.addEventListener('touchstart', (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartX = e.touches[0].clientX;
  }, {passive:true});
  modalImg.addEventListener('touchend', (e) => {
    if (!touchStartX) return;
    const x = e.changedTouches[0].clientX;
    const diff = x - touchStartX;
    touchStartX = null;
    if (diff > 50) prevImage();
    if (diff < -50) nextImage();
  });

  // keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (modal.getAttribute('aria-hidden') === 'false') {
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'Escape') closeModal();
    }
  });

  function nextImage() {
    if (currentImages.length <= 1) return;
    currentIndex = (currentIndex + 1) % currentImages.length;
    renderMainAndThumbs();
  }
  function prevImage() {
    if (currentImages.length <= 1) return;
    currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
    renderMainAndThumbs();
  }

  function showModal() {
    modal.style.display = 'flex';
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('no-scroll');
  }
  function closeModal() {
    modal.style.display = 'none';
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('no-scroll');
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

});
