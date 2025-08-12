/* script.js — общая логика галерей/модалки, multi-page via data/items.*.js */
/* Touch detection — добавляем класс is-touch */
(function detectTouchAndMarkBody(){
  try {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0);
    if (isTouch) {
      document.documentElement.classList.add('is-touch');
      if (document.body) document.body.classList.add('is-touch');
      else document.addEventListener('DOMContentLoaded', () => document.body.classList.add('is-touch'));
    }
  } catch(e){}
})();

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  const descEl = document.getElementById('description');
  const ozonLink = document.getElementById('ozon-link');
  const paletteLink = document.getElementById('palette-link');
  const skuEl = document.getElementById('sku');
  const closeBtn = modal?.querySelector('.modal-close');
  const year = new Date().getFullYear();
  ['year','year-toys','year-vases','year-repair','year-resin'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = year; });

  // DATA: each page should include its own data file that sets window.itemsData
  const RAW = window.itemsData || null;
  if (!RAW) {
    // nothing to render automatically
  }

  // normalize item structure (colors array with code,img,ozon)
  function normalize(raw, key){
    if (!raw) return null;
    const out = {
      key: key,
      name: raw.name || raw.title || '',
      description: raw.description || '',
      ozon: raw.ozon || '',
      contacts: raw.contacts || { telegram: "@AvenNyan", whatsapp: "+79818522194" },
      group: raw.group || raw.category || '',
      colors: []
    };
    if (Array.isArray(raw.colors) && raw.colors.length) {
      raw.colors.forEach(c => {
        if (!c) return;
        if (typeof c === 'string') out.colors.push({ code: c, img: '', ozon: '' });
        else out.colors.push({ code: c.code || c.name || '', img: c.img || c.image || '', ozon: c.ozon || c.ozon_link || '' });
      });
    } else if (Array.isArray(raw.images) && raw.images.length) {
      raw.images.forEach((im, i) => out.colors.push({ code: 'C' + String(i+1).padStart(2,'0'), img: im, ozon: raw.ozon || '' }));
    }
    return out;
  }

  // determine page category for palette linking or special behavior
  const path = location.pathname.split('/').pop().toLowerCase();
  let pageCategory = 'toys';
  if (path.includes('vases')) pageCategory = 'vases';
  else if (path.includes('repair')) pageCategory = 'repair';
  else if (path.includes('resin')) pageCategory = 'resin';
  else if (path.includes('palette')) pageCategory = 'palette';
  else if (path === '' || path === 'index.html') pageCategory = 'home';

  // fill gallery from RAW, grouping by group field
  function fillGallery() {
    if (!RAW) return;
    const galleryRoot = document.querySelector('.gallery');
    if (!galleryRoot) return;

    // group items by group name
    const items = Object.keys(RAW).map(k => ({ key:k, raw:RAW[k] }));
    // if items already in DOM (with data-key) we won't duplicate
    const existingKeys = new Set(Array.from(galleryRoot.querySelectorAll('[data-key]')).map(el => el.dataset.key).filter(Boolean));

    // group by raw.group or fallback to 'Без группы'
    const groups = {};
    items.forEach(it => {
      const norm = normalize(it.raw, it.key);
      let g = norm.group || (pageCategory === 'palette' ? 'palette' : 'Без группы');
      if (!groups[g]) groups[g] = [];
      groups[g].push(norm);
    });

    // render groups in stable order (Лягушки/Драконы first if exist)
    const ordered = Object.keys(groups).sort((a,b) => a.localeCompare(b,'ru'));
    ordered.forEach(groupName => {
      // add group header if not palette page
      if (pageCategory !== 'palette') {
        const h = document.createElement('div');
        h.className = 'group';
        const title = document.createElement('div');
        title.className = 'group-title';
        title.textContent = groupName;
        h.appendChild(title);
        galleryRoot.appendChild(h);
      }
      // container for group items
      const container = document.createElement('div');
      container.className = 'group-items';
      container.style.display = 'flex';
      container.style.flexWrap = 'wrap';
      container.style.gap = '12px';
      container.style.marginBottom = '12px';

      groups[groupName].forEach(item => {
        if (existingKeys.has(item.key)) return; // skip duplicates already in HTML
        const card = document.createElement('div');
        card.className = 'gallery-item card';
        card.style.width = ''; // controlled by CSS flex rules
        const img = document.createElement('img');
        // choose first color img or placeholder
        const thumb = (item.colors && item.colors[0] && item.colors[0].img) ? item.colors[0].img : 'images/placeholder.png';
        img.src = thumb;
        img.alt = item.name || item.key;
        img.loading = 'lazy';
        img.dataset.key = item.key;
        card.appendChild(img);

        // caption area under image
        const title = document.createElement('div');
        title.className = 'title';
        title.textContent = item.name || item.key;
        card.appendChild(title);

        // maybe short meta (sku base)
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = item.key;
        card.appendChild(meta);

        container.appendChild(card);
      });

      galleryRoot.appendChild(container);
    });
  }

  fillGallery();

  // modal machinery
  let currentImages = [];
  let currentOzon = [];
  let currentCodes = [];
  let currentKey = '';
  let currentIndex = 0;

  // thumbs container
  let thumbsContainer = modal.querySelector('.modal-thumbs');
  if (!thumbsContainer){ thumbsContainer = document.createElement('div'); thumbsContainer.className = 'modal-thumbs'; }

  function renderModalForItem(item) {
    currentKey = item.key;
    currentImages = item.colors.map(c => c.img || '');
    currentOzon = item.colors.map(c => c.ozon || '');
    currentCodes = item.colors.map(c => c.code || '');
    if (!currentImages.length) currentImages = [''];
    currentIndex = 0;
    descEl.textContent = item.description || '';
    renderMainAndThumbs();
    // SKU: shown as key-(code) for current color
    updateSkuAndOzon();
    // contacts
    fillContacts(item.contacts);
    showModal();
  }

  function renderMainAndThumbs(){
    modalImg.src = currentImages[currentIndex] || '';
    modalImg.alt = '';
    thumbsContainer.innerHTML = '';
    currentImages.forEach((src, idx) => {
      const t = document.createElement('img');
      t.src = src;
      t.className = 'thumb';
      if (idx === currentIndex) t.classList.add('active');
      t.dataset.index = idx;
      t.addEventListener('click', () => { currentIndex = idx; renderMainAndThumbs(); updateSkuAndOzon(); });
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

  function updateSkuAndOzon(){
    const code = currentCodes[currentIndex] || '';
    const sku = code ? `${currentKey}-${code}` : `${currentKey}`;
    if (skuEl) skuEl.textContent = 'Артикул: ' + sku;
    // palette link: palette.html?pref=sku
    if (paletteLink) paletteLink.href = `palette.html?pref=${encodeURIComponent(sku)}`;
    // ozon link per-image if present, else fallback to ''
    const oz = (currentOzon[currentIndex] && String(currentOzon[currentIndex]).trim()) ? currentOzon[currentIndex] : '';
    if (oz) { ozonLink.href = oz; ozonLink.style.display = 'inline-block'; }
    else { ozonLink.href = '#'; ozonLink.style.display = 'none'; }
  }

  function fillContacts(contacts){
    let container = modal.querySelector('.modal-contacts');
    if (!container) {
      container = document.createElement('div');
      container.className = 'modal-contacts';
      modal.querySelector('.modal-panel')?.appendChild(container);
    }
    const tg = contacts?.telegram || '@AvenNyan';
    const wa = contacts?.whatsapp || '+7 981 852-21-94';
    container.innerHTML = `<a href="https://t.me/${String(tg).replace(/^@/,'')}" target="_blank" rel="noopener">Telegram: ${tg}</a> &nbsp;|&nbsp; <a href="https://wa.me/${String(wa).replace(/\D/g,'')}" target="_blank" rel="noopener">WhatsApp: ${wa}</a>`;
  }
  function fillContactsEmpty(){ fillContacts({telegram:'@AvenNyan', whatsapp:'+7 981 852-21-94'}); }

  // open raw img if clicked and not found in itemsData
  function openRawImage(imgEl){
    currentImages = [ imgEl.src ];
    currentOzon = [''];
    currentCodes = [''];
    currentKey = imgEl.dataset.key || 'img';
    currentIndex = 0;
    descEl.textContent = imgEl.alt || '';
    renderMainAndThumbs();
    updateSkuAndOzon();
    fillContactsEmpty();
    showModal();
  }

  // clicks: delegate gallery images
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.gallery img, .gallery-item img, img[data-key]');
    if (!target) return;
    e.preventDefault();
    const key = target.dataset.key;
    if (RAW && key && RAW[key]) {
      const item = normalize(RAW[key], key);
      renderModalForItem(item);
    } else {
      // try to find by filename
      const src = target.getAttribute('src') || '';
      if (RAW) {
        let found = null;
        for (const k in RAW) {
          const norm = normalize(RAW[k], k);
          if (norm.colors.some(c => c.img && c.img.split('/').pop() === src.split('/').pop())) { found = norm; break; }
        }
        if (found) { renderModalForItem(found); return; }
      }
      openRawImage(target);
    }
  });

  // show / close modal
  function showModal(){ if (!modal) return; modal.style.display = 'flex'; modal.classList.add('show'); modal.setAttribute('aria-hidden','false'); document.body.classList.add('no-scroll'); }
  function closeModal(){ if (!modal) return; modal.style.display = 'none'; modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); document.body.classList.remove('no-scroll'); }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (modal?.getAttribute('aria-hidden') === 'false'){ if (e.key==='Escape') closeModal(); if (e.key==='ArrowLeft') { if (currentImages && currentImages.length>1){ currentIndex=(currentIndex-1+currentImages.length)%currentImages.length; renderMainAndThumbs(); updateSkuAndOzon(); } } if (e.key==='ArrowRight'){ if (currentImages && currentImages.length>1){ currentIndex=(currentIndex+1)%currentImages.length; renderMainAndThumbs(); updateSkuAndOzon(); } } } });

  // swipe support
  let touchStartX = null;
  modalImg?.addEventListener('touchstart', (e)=> { if (e.touches && e.touches.length) touchStartX = e.touches[0].clientX; }, {passive:true});
  modalImg?.addEventListener('touchend', (e)=> { if (touchStartX===null) return; const x = e.changedTouches[0].clientX; const diff = x - touchStartX; touchStartX = null; if (diff > 50){ if (currentImages && currentImages.length>1){ currentIndex=(currentIndex-1+currentImages.length)%currentImages.length; renderMainAndThumbs(); updateSkuAndOzon(); } } if (diff < -50){ if (currentImages && currentImages.length>1){ currentIndex=(currentIndex+1)%currentImages.length; renderMainAndThumbs(); updateSkuAndOzon(); } } }, {passive:true});

  // copy SKU on click (if skuEl clicked) — create small copy button
  if (skuEl) {
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Копировать';
    copyBtn.style.marginLeft = '8px';
    copyBtn.className = 'btn ghost';
    copyBtn.addEventListener('click', () => {
      const txt = skuEl.textContent.replace(/^Артикул:\s*/i,'').trim();
      if (!txt) return;
      if (navigator.clipboard) navigator.clipboard.writeText(txt);
      const prev = copyBtn.textContent; copyBtn.textContent = 'Скопировано'; setTimeout(()=> copyBtn.textContent = prev,1200);
    });
    skuEl.style.display = 'inline-block';
    skuEl.appendChild(copyBtn);
  }

  // ensure there's a paletteLink element and ozonLink in modal markup; if not, create them
  if (!ozonLink && modal) {
    const a = document.createElement('a'); a.id='ozon-link'; a.className='btn'; a.textContent='Смотреть на Ozon'; a.style.display='none';
    modal.querySelector('.modal-panel')?.appendChild(a);
  }
  if (!paletteLink && modal) {
    const p = document.createElement('a'); p.id='palette-link'; p.className='btn ghost'; p.textContent='Подобрать цвет'; p.href='palette.html';
    modal.querySelector('.modal-panel')?.appendChild(p);
  }

});
