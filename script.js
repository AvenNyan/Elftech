/* script.js — поддержка variants (без/с магнитом), SKU, price, palette pref, touch detection */

// Touch detection (adds body.is-touch)
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
  let ozonLink = document.getElementById('ozon-link');
  let paletteLink = document.getElementById('palette-link');
  const skuEl = document.getElementById('sku');
  const priceEl = document.getElementById('price');
  const closeBtn = modal?.querySelector('.modal-close');

  const year = new Date().getFullYear();
  ['year','year-toys','year-vases','year-repair','year-resin'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = year; });

  // DATA: every page should include its own data file setting window.itemsData
  const RAW = window.itemsData || null;

  function normalize(raw, key) {
    if (!raw) return null;
    // variants: if raw.variants exists use it; else create default single variant ''
    const variants = Array.isArray(raw.variants) && raw.variants.length ? raw.variants.map(v => ({
      suffix: v.suffix || '',
      label: v.label || (v.suffix ? v.suffix : 'Базовый'),
      description: v.description || raw.description || '',
      ozon: v.ozon || raw.ozon || '',
      price: v.price || v.pr || ''
    })) : [{ suffix: raw.suffix || '', label: raw.variantLabel || 'Базовый', description: raw.description || '', ozon: raw.ozon || '', price: raw.price || '' }];

    // colors: if provided as codes-only, keep code; if object with img, use that
    const colors = Array.isArray(raw.colors) ? raw.colors.map(c => {
      if (!c) return { code: '', img: '' };
      if (typeof c === 'string') return { code: c, img: '' };
      return { code: c.code || c.name || '', img: c.img || c.image || '', ozon: c.ozon || '' };
    }) : [];

    return {
      key,
      name: raw.name || raw.title || key,
      group: raw.group || raw.category || '',
      baseDescription: raw.description || '',
      variants,
      colors,
      contacts: raw.contacts || { telegram: '@AvenNyan', whatsapp: '+79818522194' }
    };
  }

  // detect page (for palette behavior)
  const path = location.pathname.split('/').pop().toLowerCase();
  let pageCategory = 'toys';
  if (path.includes('vases')) pageCategory = 'vases';
  else if (path.includes('repair')) pageCategory = 'repair';
  else if (path.includes('resin')) pageCategory = 'resin';
  else if (path.includes('palette')) pageCategory = 'palette';
  else if (path === '' || path === 'index.html') pageCategory = 'home';

  /* ---------- fill gallery from RAW, group by group ---------- */
  function fillGallery() {
    if (!RAW) return;
    const galleryRoot = document.querySelector('.gallery');
    if (!galleryRoot) return;

    // existing keys -> avoid duplicates
    const existingKeys = new Set(Array.from(galleryRoot.querySelectorAll('[data-key]')).map(el => el.dataset.key).filter(Boolean));

    const items = Object.keys(RAW).map(k => ({ key:k, raw:RAW[k] }));
    const groups = {};
    items.forEach(it => {
      const norm = normalize(it.raw, it.key);
      const g = norm.group || (pageCategory === 'palette' ? 'palette' : 'Без группы');
      if (!groups[g]) groups[g] = [];
      groups[g].push(norm);
    });

    const ordered = Object.keys(groups).sort((a,b) => a.localeCompare(b,'ru'));
    ordered.forEach(groupName => {
      if (pageCategory !== 'palette') {
        const h = document.createElement('div');
        h.className = 'group';
        const title = document.createElement('div');
        title.className = 'group-title';
        title.textContent = groupName;
        h.appendChild(title);
        galleryRoot.appendChild(h);
      }

      const container = document.createElement('div');
      container.className = 'group-items';
      container.style.display = 'flex';
      container.style.flexWrap = 'wrap';
      container.style.gap = '12px';
      container.style.marginBottom = '12px';

      groups[groupName].forEach(item => {
        if (existingKeys.has(item.key)) return;
        const card = document.createElement('div');
        card.className = 'gallery-item card';
        const img = document.createElement('img');

        // choose first color img or placeholder: prefer explicit img; else build path from key + first variant suffix + code
        const firstColor = item.colors[0];
        let thumb = 'images/placeholder.png';
        if (firstColor) {
          if (firstColor.img) thumb = firstColor.img;
          else {
            // take first variant suffix (likely '') to build thumb
            const variantSuffix = item.variants && item.variants[0] ? item.variants[0].suffix || '' : '';
            thumb = `images/${item.key}${variantSuffix}-${firstColor.code}.jpg`;
          }
        }
        img.src = thumb;
        img.alt = item.name || item.key;
        img.loading = 'lazy';
        img.dataset.key = item.key;
        card.appendChild(img);

        const title = document.createElement('div'); title.className = 'title'; title.textContent = item.name || item.key;
        const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = item.key;
        card.appendChild(title); card.appendChild(meta);

        container.appendChild(card);
      });

      galleryRoot.appendChild(container);
    });
  }

  fillGallery();

  /* ---------- modal: manage current item, variant, color arrays ---------- */
  let currentItem = null; // normalized
  let currentVariantIndex = 0;
  let currentColorIndex = 0;
  let thumbsContainer = modal?.querySelector('.modal-thumbs') || null;
  if (!thumbsContainer && modal) { thumbsContainer = document.createElement('div'); thumbsContainer.className = 'modal-thumbs'; }

  function getImageFor(item, variant, color) {
    // if color.img is present and contains placeholders, replace; else if color.img present return it
    if (color.img && String(color.img).includes('{key}')) {
      return color.img.replace(/\{key\}/g, item.key).replace(/\{variant\}/g, variant.suffix || '').replace(/\{code\}/g, color.code || '');
    }
    if (color.img) return color.img;
    // build by convention images/<key><variantSuffix>-<code>.jpg
    const vs = variant.suffix || '';
    return `images/${item.key}${vs ? vs : ''}-${color.code}.jpg`;
  }

  function renderModalFor(item) {
    currentItem = item;
    currentVariantIndex = 0;
    currentColorIndex = 0;
    // show description of variant 0
    const desc = item.variants[0].description || item.baseDescription || '';
    descEl.textContent = desc;
    renderVariantControls();
    renderMainAndThumbs();
    updateSkuPriceOzon();
    fillContacts(item.contacts);
    showModal();
  }

  function renderVariantControls() {
    // create variant toggle if >1
    const panel = modal.querySelector('.modal-panel');
    let variantWrap = panel.querySelector('.variant-toggle');
    if (variantWrap) variantWrap.remove();
    if (!currentItem || !currentItem.variants || currentItem.variants.length <= 1) return;
    variantWrap = document.createElement('div');
    variantWrap.className = 'variant-toggle';
    currentItem.variants.forEach((v, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = v.label || (v.suffix || 'Вариант');
      if (idx === currentVariantIndex) btn.classList.add('active');
      btn.addEventListener('click', () => {
        currentVariantIndex = idx;
        // update description to variant-specific
        descEl.textContent = v.description || currentItem.baseDescription || '';
        // re-render thumbs and main image
        renderMainAndThumbs();
        updateSkuPriceOzon();
        // update active state
        variantWrap.querySelectorAll('button').forEach((b,i)=> b.classList.toggle('active', i===idx));
      });
      variantWrap.appendChild(btn);
    });
    // insert before actions or after modal-img
    const actions = panel.querySelector('.actions');
    if (actions) panel.insertBefore(variantWrap, actions);
    else panel.appendChild(variantWrap);
  }

  function renderMainAndThumbs() {
    if (!currentItem) return;
    const variant = currentItem.variants[currentVariantIndex];
    const colors = currentItem.colors || [];
    // build current images array
    const imgs = colors.map(c => getImageFor(currentItem, variant, c));
    // main image = first color by default or currentColorIndex
    currentColorIndex = Math.min(currentColorIndex, imgs.length - 1);
    modalImg.src = imgs[currentColorIndex] || '';
    modalImg.alt = currentItem.name || '';
    // thumbs
    thumbsContainer.innerHTML = '';
    imgs.forEach((src, idx) => {
      const t = document.createElement('img');
      t.src = src;
      t.className = 'thumb';
      if (idx === currentColorIndex) t.classList.add('active');
      t.dataset.index = idx;
      t.addEventListener('click', () => {
        currentColorIndex = idx;
        modalImg.src = imgs[currentColorIndex] || '';
        updateSkuPriceOzon();
        renderMainAndThumbs();
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

  function updateSkuPriceOzon() {
    if (!currentItem) return;
    const variant = currentItem.variants[currentVariantIndex];
    const color = currentItem.colors[currentColorIndex] || {};
    const code = color.code || '';
    // SKU: key + variantSuffix (without leading dash?)? user wants t010-m-G01 so we use variant.suffix as given
    const sku = code ? `${currentItem.key}${variant.suffix || ''}-${code}` : `${currentItem.key}${variant.suffix || ''}`;
    if (skuEl) skuEl.textContent = 'Артикул: ' + sku;
    // price
    if (priceEl) priceEl.textContent = (variant.price ? 'Цена: ' + variant.price : '');
    // palette link
    if (paletteLink) paletteLink.href = `palette.html?pref=${encodeURIComponent(sku)}`;
    // ozon priority: color.ozon > variant.ozon > ''
    const oz = (color.ozon && String(color.ozon).trim()) ? color.ozon : (variant.ozon && String(variant.ozon).trim() ? variant.ozon : '');
    if (oz && ozonLink) { ozonLink.href = oz; ozonLink.style.display = 'inline-block'; } else if (ozonLink) { ozonLink.href = '#'; ozonLink.style.display = 'none'; }
  }

  function fillContacts(contacts) {
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

  function openRawImage(imgEl) {
    // minimal modal for raw images
    currentItem = null;
    modalImg.src = imgEl.src;
    descEl.textContent = imgEl.alt || '';
    skuEl.textContent = '';
    if (priceEl) priceEl.textContent = '';
    if (ozonLink) ozonLink.style.display = 'none';
    fillContacts({telegram:'@AvenNyan', whatsapp:'+7 981 852-21-94'});
    showModal();
  }

  // click delegation for gallery images
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.gallery img, .gallery-item img, img[data-key]');
    if (!target) return;
    e.preventDefault();
    const key = target.dataset.key;
    if (RAW && key && RAW[key]) {
      const item = normalize(RAW[key], key);
      renderModalFor(item);
    } else if (RAW) {
      // try to find by matching filename
      const srcFile = (target.getAttribute('src')||'').split('/').pop();
      let found = null;
      for (const k in RAW) {
        const norm = normalize(RAW[k], k);
        // check if any color img equal filename (constructed or explicit)
        for (const v of norm.variants) {
          for (const c of norm.colors) {
            const candidate = c.img ? c.img.split('/').pop() : `${norm.key}${v.suffix||''}-${c.code}.jpg`;
            if (candidate === srcFile) { found = norm; break; }
          }
          if (found) break;
        }
        if (found) { renderModalFor(found); return; }
      }
      openRawImage(target);
    } else {
      openRawImage(target);
    }
  });

  // show/close modal
  function showModal(){ if (!modal) return; modal.style.display = 'flex'; modal.classList.add('show'); modal.setAttribute('aria-hidden','false'); document.body.classList.add('no-scroll'); }
  function closeModal(){ if (!modal) return; modal.style.display = 'none'; modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); document.body.classList.remove('no-scroll'); }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (modal?.getAttribute('aria-hidden') === 'false') {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') {
        // prev color
        if (currentItem && currentItem.colors && currentItem.colors.length>1) {
          currentColorIndex = (currentColorIndex - 1 + currentItem.colors.length) % currentItem.colors.length;
          renderMainAndThumbs();
          updateSkuPriceOzon();
        }
      }
      if (e.key === 'ArrowRight') {
        if (currentItem && currentItem.colors && currentItem.colors.length>1) {
          currentColorIndex = (currentColorIndex + 1) % currentItem.colors.length;
          renderMainAndThumbs();
          updateSkuPriceOzon();
        }
      }
    }
  });

  // swipe on modal image
  let touchStartX = null;
  modalImg?.addEventListener('touchstart', (e)=> { if (e.touches && e.touches.length) touchStartX = e.touches[0].clientX; }, {passive:true});
  modalImg?.addEventListener('touchend', (e)=> {
    if (touchStartX === null) return;
    const x = e.changedTouches[0].clientX; const diff = x - touchStartX; touchStartX = null;
    if (diff > 50) { // swipe right -> prev
      if (currentItem && currentItem.colors && currentItem.colors.length>1) {
        currentColorIndex = (currentColorIndex - 1 + currentItem.colors.length) % currentItem.colors.length; renderMainAndThumbs(); updateSkuPriceOzon();
      }
    } else if (diff < -50) {
      if (currentItem && currentItem.colors && currentItem.colors.length>1) {
        currentColorIndex = (currentColorIndex + 1) % currentItem.colors.length; renderMainAndThumbs(); updateSkuPriceOzon();
      }
    }
  }, {passive:true});

  // ensure ozonLink and paletteLink exist in modal panel
  if (!ozonLink && modal) {
    const a = document.createElement('a'); a.id='ozon-link'; a.className='btn'; a.textContent='Смотреть на Ozon'; a.style.display='none';
    modal.querySelector('.modal-panel')?.appendChild(a);
    ozonLink = a;
  }
  if (!paletteLink && modal) {
    const p = document.createElement('a'); p.id='palette-link'; p.className='btn ghost'; p.textContent='Подобрать цвет'; p.href='palette.html';
    modal.querySelector('.modal-panel')?.appendChild(p);
    paletteLink = p;
  }

});
