document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  const descEl = document.getElementById('description');
  const colorButtons = document.getElementById('color-buttons');
  const ozonLink = document.getElementById('ozon-link');
  const closeBtn = modal?.querySelector('.modal-close');

  // Ensure modal hidden initially
  if (modal) { modal.style.display = 'none'; modal.setAttribute('aria-hidden', 'true'); }

  // Put year in footers
  const year = new Date().getFullYear();
  ['year','year-toys','year-vases','year-repair','year-resin'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = year;
  });

  // Data source (try several possible globals)
  const DATA = window.itemsData || window.items || window.itemsData || null;

  // Normalize possible raw item structures to a common format
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

    // images
    if (Array.isArray(raw.images) && raw.images.length) out.images = raw.images.slice();
    else if (raw.image) out.images.push(raw.image);
    else if (raw.img) out.images.push(raw.img);

    // colors handling
    if (Array.isArray(raw.colors) && raw.colors.length) {
      raw.colors.forEach((c, i) => {
        if (typeof c === 'string') { out.colors.push({ name: c, img: out.images[i] || '' }); }
        else if (c && typeof c === 'object') {
          out.colors.push({ name: c.name || c.title || ('Вариант ' + (i+1)), img: c.img || c.image || '', hex: c.hex || c.color || '' });
          if (c.img && !out.images.includes(c.img)) out.images.push(c.img);
        }
      });
    } else if (raw.colors && typeof raw.colors === 'object') {
      Object.keys(raw.colors).forEach(k => {
        const v = raw.colors[k];
        if (typeof v === 'string') { out.colors.push({ name: k, img: v }); if (!out.images.includes(v)) out.images.push(v); }
        else if (v && typeof v === 'object') {
          const img = v.img || v.image || '';
          out.colors.push({ name: k, img, hex: v.hex || v.color || '' });
          if (img && !out.images.includes(img)) out.images.push(img);
        }
      });
    }

    // fallback: if no colors but images exist, make default colors
    if (out.colors.length === 0 && out.images.length) {
      out.images.forEach((im, idx) => out.colors.push({ name: 'Вариант ' + (idx+1), img: im }));
    }

    return out;
  }

  // find item by filename or data-key
  function findItemBySrc(src, keyHint) {
    const filename = src?.split('/').pop();
    if (!DATA) return null;

    // direct key hint
    if (keyHint && DATA[keyHint]) return { key: keyHint, item: normalize(DATA[keyHint]) };

    for (const k in DATA) {
      const raw = DATA[k];
      const norm = normalize(raw);
      if (!norm) continue;
      // check images and colors
      for (const im of norm.images) {
        if (!im) continue;
        if (im.split('/').pop() === filename) return { key: k, item: norm };
      }
      for (const c of norm.colors) {
        if (!c || !c.img) continue;
        if (c.img.split('/').pop() === filename) return { key: k, item: norm };
      }
    }
    return null;
  }

  // Delegated click handler: any img inside .gallery
  document.addEventListener('click', (e) => {
    const targetImg = e.target.closest('.gallery img, .gallery-item, img[data-key]');
    if (!targetImg) return;
    e.preventDefault();

    // try data-key first
    const key = targetImg.dataset?.key;
    let found = null;
    if (key && DATA && DATA[key]) found = { key, item: normalize(DATA[key]) };
    else found = findItemBySrc(targetImg.getAttribute('src'), key);

    if (found && found.item) openModalWithItem(found.item);
    else openModalRaw(targetImg);
  });

  // open raw image (no item data)
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

  // open modal using normalized item
  function openModalWithItem(item) {
    if (!modal) return;
    modalImg.src = item.images[0] || (item.colors[0] && item.colors[0].img) || '';
    modalImg.alt = item.name || '';
    descEl.textContent = (item.name ? item.name + '. ' : '') + (item.description || '');

    // color buttons
    colorButtons.innerHTML = '';
    if (Array.isArray(item.colors) && item.colors.length) {
      item.colors.forEach((c) => {
        const b = document.createElement('button');
        b.type = 'button';
        if (c.hex) {
          b.style.background = c.hex;
          b.style.width = '28px';
          b.style.height = '28px';
          b.style.borderRadius = '50%';
          b.title = c.name || '';
        } else {
          b.textContent = c.name || 'Вариант';
        }
        b.addEventListener('click', () => { if (c.img) modalImg.src = c.img; });
        colorButtons.appendChild(b);
      });
    }

    // handle ozon link visibility
    if (ozonLink) {
      if (item.ozon && String(item.ozon).trim() !== '') { ozonLink.href = item.ozon; ozonLink.classList.remove('hidden'); ozonLink.style.display = 'inline-block'; }
      else { ozonLink.href = '#'; ozonLink.classList.add('hidden'); ozonLink.style.display = 'none'; }
    }

    fillContacts(item.contacts);
    showModal();
  }

  // contacts helper
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
      ${wa ? `<a href="https://wa.me/${String(wa).replace(/\\D/g,'')}" target="_blank" rel="noopener">WhatsApp: ${wa}</a>` : ''}
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

  // copy to clipboard helper
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

  // show / close modal
  function showModal() {
    if (!modal) return;
    modal.style.display = 'flex';
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    if (!modal) return;
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

document.querySelectorAll('.gallery-item').forEach(img => {
  img.addEventListener('click', () => {
    const key = img.dataset.key;
    if (!items[key]) return;
    openModal(key);
  });
});

function openModal(key) {
  const item = items[key];
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  const description = document.getElementById('description');
  const ozonLink = document.getElementById('ozon-link');
  const colorButtons = document.getElementById('color-buttons');

  modalImg.src = item.images[0];
  description.textContent = item.description;
  colorButtons.innerHTML = '';

  if (item.colors) {
    item.colors.forEach(color => {
      const btn = document.createElement('button');
      btn.textContent = color.name;
      btn.addEventListener('click', () => {
        modalImg.src = color.image;
      });
      colorButtons.appendChild(btn);
    });
  }

  if (item.ozon) {
    ozonLink.href = item.ozon;
    ozonLink.style.display = '';
  } else {
    ozonLink.style.display = 'none';
  }

  modal.setAttribute('aria-hidden', 'false');
}

document.querySelector('.modal-close').addEventListener('click', () => {
  document.getElementById('modal').setAttribute('aria-hidden', 'true');
});
