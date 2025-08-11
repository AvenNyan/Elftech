/* ====== script.js (универсальный, устойчивый) ====== */
document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  const descEl = document.getElementById('description');
  const colorButtons = document.getElementById('color-buttons');
  const ozonLink = document.getElementById('ozon-link');
  const closeBtn = modal?.querySelector('.modal-close');

  // ensure modal hidden on load (defensive)
  if (modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }

  // set year in footers regardless of itemsData presence
  const year = new Date().getFullYear();
  ['year','year-toys','year-vases','year-repair','year-resin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = year;
  });

  // unified data source: try several variable names
  const DATA = window.itemsData || window.items || window.windowItems || null;

  // helper: normalize different shapes of item data to {name,description,ozon,contacts,images:[], colors: [{name,img,hex}]}
  function normalize(raw) {
    if (!raw) return null;
    const out = { name: raw.name || raw.title || '', description: raw.description || raw.desc || '', ozon: raw.ozon || raw.oz || raw.ozon_link || '', contacts: raw.contacts || { telegram: raw.telegram || raw.telegram_handle, whatsapp: raw.whatsapp || raw.phone || raw.tel || '' }, images: [], colors: [] };

    // images: prefer explicit images array
    if (Array.isArray(raw.images) && raw.images.length) out.images = raw.images.slice();
    else if (raw.img) out.images.push(raw.img);
    else if (raw.image) out.images.push(raw.image);

    // colors may be array of objects, array of strings, or object map
    if (Array.isArray(raw.colors)) {
      // could be array of objects or strings
      raw.colors.forEach((c, idx) => {
        if (typeof c === 'string') {
          // if images array correlates with colors
          const img = out.images[idx] || c;
          out.colors.push({ name: c, img });
        } else if (c && typeof c === 'object') {
          const name = c.name || c.title || ('color' + idx);
          const img = c.img || c.image || (Array.isArray(c.images) ? c.images[0] : '');
          const hex = c.hex || c.color || '';
          out.colors.push({ name, img, hex });
          if (img && !out.images.includes(img)) out.images.push(img);
        }
      });
    } else if (raw.colors && typeof raw.colors === 'object') {
      // object map: { pink: { img: '...' }, ... } or { pink: 'images/...' }
      Object.keys(raw.colors).forEach(k => {
        const v = raw.colors[k];
        if (typeof v === 'string') {
          out.colors.push({ name: k, img: v });
          if (!out.images.includes(v)) out.images.push(v);
        } else if (v && typeof v === 'object') {
          const img = v.img || v.image || '';
          const hex = v.hex || v.color || '';
          out.colors.push({ name: k, img, hex });
          if (img && !out.images.includes(img)) out.images.push(img);
        }
      });
    }

    // if still no colors but images exist, create default color entries
    if (out.colors.length === 0 && out.images.length > 0) {
      out.images.forEach((im, i) => out.colors.push({ name: 'Вариант ' + (i+1), img: im }));
    }

    return out;
  }

  // find item by data-key or by matching filename to any images in DATA
  function findItemByImageSrc(src, keyHint) {
    const filename = src?.split('/').pop();
    if (!DATA) return null;

    // try key hint first
    if (keyHint && DATA[keyHint]) {
      return normalize(DATA[keyHint]);
    }

    // search for matching filename
    for (const k in DATA) {
      const raw = DATA[k];
      const norm = normalize(raw);
      if (!norm) continue;
      // check images
      for (const img of norm.images) {
        if (!img) continue;
        if (img.split('/').pop() === filename) return { key: k, item: norm };
      }
      // check colors
      for (const c of norm.colors) {
        if (!c || !c.img) continue;
        if (c.img.split('/').pop() === filename) return { key: k, item: norm };
      }
    }
    return null;
  }

  // attach click handlers for gallery images (robust selector)
  const galleryImgs = Array.from(document.querySelectorAll('.gallery img, .gallery-item, img[data-key]'));
  galleryImgs.forEach(img => {
    // avoid duplicate binding
    if (img.__elfBound) return;
    img.__elfBound = true;

    img.style.cursor = 'pointer';
    img.addEventListener('click', (e) => {
      e.preventDefault();
      // prefer data-key
      const key = img.dataset?.key;
      let found = null;
      if (key && DATA && DATA[key]) {
        found = { key, item: normalize(DATA[key]) };
      } else {
        found = findItemByImageSrc(img.getAttribute('src'), key);
      }

      if (found && found.item) {
        openModalWithItem(found.item);
      } else {
        // fallback: show the raw image (no item data)
        openModalRaw(img);
      }
    });
  });

  // show modal for raw image
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

  // open modal with normalized item
  function openModalWithItem(item) {
    if (!modal) return;
    modalImg.src = item.images[0] || (item.colors[0] && item.colors[0].img) || '';
    modalImg.alt = item.name || '';
    descEl.textContent = (item.name ? item.name + '. ' : '') + (item.description || '');
    // color buttons
    colorButtons.innerHTML = '';
    if (Array.isArray(item.colors) && item.colors.length) {
      item.colors.forEach((c, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        // if hex provided, show as background circle-like
        if (c.hex) { btn.style.background = c.hex; btn.title = c.name || ''; btn.style.width='28px'; btn.style.height='28px'; btn.style.borderRadius='50%'; btn.style.padding='0'; }
        else btn.textContent = c.name || ('Вариант ' + (idx+1));
        btn.addEventListener('click', () => {
          if (c.img) modalImg.src = c.img;
        });
        colorButtons.appendChild(btn);
      });
    }

    // Ozon button
    if (ozonLink) {
      if (item.ozon && String(item.ozon).trim() !== '') { ozonLink.href = item.ozon; ozonLink.classList.remove('hidden'); ozonLink.style.display='inline-block'; }
      else { ozonLink.href = '#'; ozonLink.classList.add('hidden'); ozonLink.style.display='none'; }
    }

    // contacts: fill or create .modal-contacts
    fillContacts(item.contacts);

    showModal();
  }

  function fillContacts(contacts) {
    // find or create container
    let container = modal.querySelector('.modal-contacts');
    if (!container) {
      container = document.createElement('div');
      container.className = 'modal-contacts';
      const panel = modal.querySelector('.modal-panel');
      if (panel) panel.appendChild(container);
    }
    container.innerHTML = ''; // reset

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

    // copy inputs
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
    container.innerHTML = '<div style="color:var(--muted)">Контакты: Telegram @AvenNyan | WhatsApp +7 981 852-21-94</div>
