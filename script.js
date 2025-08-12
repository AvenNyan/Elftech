document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  const descEl = document.getElementById('description');
  const colorButtons = document.getElementById('color-buttons');
  const ozonLink = document.getElementById('ozon-link');
  const closeBtn = modal?.querySelector('.modal-close');

  if (modal) { 
    modal.style.display = 'none'; 
    modal.setAttribute('aria-hidden', 'true'); 
  }

  const year = new Date().getFullYear();
  ['year','year-toys','year-vases','year-repair','year-resin'].forEach(id => {
    const el = document.getElementById(id); 
    if (el) el.textContent = year;
  });

  const DATA = window.itemsData || window.items || null;

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

    if (Array.isArray(raw.images) && raw.images.length) out.images = raw.images.slice();
    else if (raw.image) out.images.push(raw.image);
    else if (raw.img) out.images.push(raw.img);

    if (Array.isArray(raw.colors) && raw.colors.length) {
      raw.colors.forEach((c, i) => {
        if (typeof c === 'string') { 
          out.colors.push({ name: c, img: out.images[i] || '' }); 
        } else if (c && typeof c === 'object') {
          out.colors.push({ name: c.name || ('Вариант ' + (i+1)), img: c.img || '', hex: c.hex || '' });
          if (c.img && !out.images.includes(c.img)) out.images.push(c.img);
        }
      });
    } else if (raw.colors && typeof raw.colors === 'object') {
      Object.keys(raw.colors).forEach(k => {
        const v = raw.colors[k];
        if (typeof v === 'string') { 
          out.colors.push({ name: k, img: v }); 
          if (!out.images.includes(v)) out.images.push(v); 
        } else if (v && typeof v === 'object') {
          const img = v.img || '';
          out.colors.push({ name: k, img, hex: v.hex || '' });
          if (img && !out.images.includes(img)) out.images.push(img);
        }
      });
    }

    if (out.colors.length === 0 && out.images.length) {
      out.images.forEach((im, idx) => out.colors.push({ name: 'Вариант ' + (idx+1), img: im }));
    }
    return out;
  }

  function findItemBySrc(src, keyHint) {
    const filename = src?.split('/').pop();
    if (!DATA) return null;
    if (keyHint && DATA[keyHint]) return { key: keyHint, item: normalize(DATA[keyHint]) };

    for (const k in DATA) {
      const raw = DATA[k];
      const norm = normalize(raw);
      if (!norm) continue;
      for (const im of norm.images) {
        if (im.split('/').pop() === filename) return { key: k, item: norm };
      }
      for (const c of norm.colors) {
        if (c.img && c.img.split('/').pop() === filename) return { key: k, item: norm };
      }
    }
    return null;
  }

  document.addEventListener('click', (e) => {
    const targetImg = e.target.closest('.gallery img, .gallery-item, img[data-key]');
    if (!targetImg) return;
    e.preventDefault();

    const key = targetImg.dataset?.key;
    let found = null;
    if (key && DATA && DATA[key]) found = { key, item: normalize(DATA[key]) };
    else found = findItemBySrc(targetImg.getAttribute('src'), key);

    if (found && found.item) openModalWithItem(found.item);
    else openModalRaw(targetImg);
  });

  function openModalRaw(imgEl) {
    if (!modal) return;
    modalImg.src = imgEl.src;
    modalImg.alt = imgEl.alt || '';
    descEl.textContent = imgEl.alt || '';
    colorButtons.innerHTML = '';
    if (ozonLink) { ozonLink.style.display = 'none'; ozonLink.href = '#'; }
    fillContactsEmpty();
    showModal();
  }

  function openModalWithItem(item) {
    if (!modal) return;
    modalImg.src = item.images[0] || '';
    modalImg.alt = item.name || '';
    descEl.textContent = (item.name ? item.name + '. ' : '') + (item.description || '');

    // миниатюры
    colorButtons.innerHTML = '';
    if (Array.isArray(item.colors) && item.colors.length) {
      item.colors.forEach((c) => {
        if (!c.img) return;
        const thumb = document.createElement('img');
        thumb.src = c.img;
        thumb.alt = c.name || '';
        thumb.style.width = '64px';
        thumb.style.height = '64px';
        thumb.style.objectFit = 'cover';
        thumb.style.cursor = 'pointer';
        thumb.style.border = '2px solid transparent';
        thumb.addEventListener('click', () => {
          modalImg.src = c.img;
          document.querySelectorAll('#color-buttons img').forEach(img => img.style.border = '2px solid transparent');
          thumb.style.border = '2px solid var(--accent, #00aaff)';
        });
        colorButtons.appendChild(thumb);
      });
    }

    if (ozonLink) {
      if (item.ozon && String(item.ozon).trim() !== '') { 
        ozonLink.href = item.ozon; 
        ozonLink.classList.remove('hidden'); 
        ozonLink.style.display = 'inline-block'; 
      } else { 
        ozonLink.href = '#'; 
        ozonLink.classList.add('hidden'); 
        ozonLink.style.display = 'none'; 
      }
    }

    fillContacts(item.contacts);
    showModal();
  }

  function fillContacts(contacts) {
    let container = modal.querySelector('.modal-contacts');
    if (!container) {
      container = document.createElement('div');
      container.className = 'modal-contacts';
      modal.querySelector('.modal-panel')?.appendChild(container);
    }
    container.innerHTML = '';
    if (!contacts) return fillContactsEmpty();

    const tg = contacts.telegram || '';
    const wa = contacts.whatsapp || '';

    const linksDiv = document.createElement('div');
    linksDiv.innerHTML = `
      ${tg ? `<a href="https://t.me/${tg.replace(/^@/,'')}" target="_blank">Telegram: ${tg}</a>` : ''}
      ${tg && wa ? ' | ' : ''}
      ${wa ? `<a href="https://wa.me/${String(wa).replace(/\D/g,'')}" target="_blank">WhatsApp: ${wa}</a>` : ''}
    `;
    container.appendChild(linksDiv);
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

  function showModal() {
    modal.style.display = 'flex';
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.style.display = 'none';
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  }
});
