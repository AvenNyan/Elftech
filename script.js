/* script.js — поддержка variants (без/с магнитом), SKU, price, palette pref, touch detection */

/* Touch detection (adds body.is-touch) */
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
  ['year','year-toys','year-vases','year-repair','year-resin','year-toys'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = year; });

  // RAW data loaded via data/items.toys.js etc.
  const RAW = window.itemsData || null;

  function normalize(raw, key) {
    if (!raw) return null;
    const variants = Array.isArray(raw.variants) && raw.variants.length ? raw.variants.map(v => ({
      suffix: v.suffix || '',
      // if author provided label - use it, otherwise use readable defaults
      label: v.label || (v.suffix === '-m' ? 'С магнитами' : 'Без магнитов'),
      description: v.description || raw.description || '',
      ozon: v.ozon || raw.ozon || '',
      price: v.price || v.pr || ''
    })) : [{ suffix: raw.suffix || '', label: raw.variantLabel || 'Без магнитов', description: raw.description || '', ozon: raw.ozon || '', price: raw.price || '' }];

    const colors = Array.isArray(raw.colors) ? raw.colors.map(c => {
      if (!c) return { code: '', img: '' };
      if (typeof c === 'string') return { code: c, img: '' };
      return { code: c.code || c.name || '', img: c.img || c.image || '', ozon: c.ozon || '' , prices: c.prices || c.priceMap || {} };
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

  /* ------------ fillGallery (groups + grid) ------------ */
  function fillGallery() {
    const galleryRoot = document.querySelector('.gallery');
    if (!galleryRoot) return;
    // clear
    galleryRoot.innerHTML = '';

    if (!RAW || typeof RAW !== 'object') {
      const p = document.createElement('p'); p.textContent = 'Пока нет товаров.'; galleryRoot.appendChild(p); return;
    }

    const items = Object.keys(RAW).map(k => ({ key: k, norm: normalize(RAW[k], k) })).filter(x => x.norm);
    const groups = {};
    items.forEach(it => {
      const g = it.norm.group || 'Без группы';
      if (!groups[g]) groups[g] = [];
      groups[g].push(it.norm);
    });

    const groupNames = Object.keys(groups).sort((a,b) => a.localeCompare(b,'ru'));

    groupNames.forEach(groupName => {
      const section = document.createElement('section'); section.className = 'category-section';
      const title = document.createElement('div'); title.className = 'category-title'; title.textContent = groupName; section.appendChild(title);
      const grid = document.createElement('div'); grid.className = 'category-grid';

      groups[groupName].forEach(item => {
        const card = document.createElement('div'); card.className = 'card gallery-card';
        const img = document.createElement('img');
        const firstColor = item.colors && item.colors[0];
        let thumb = 'images/placeholder.png';
        if (firstColor) {
          if (firstColor.img) thumb = firstColor.img;
          else {
            const variantSuffix = (item.variants && item.variants[0]) ? (item.variants[0].suffix || '') : '';
            thumb = `images/${item.key}${variantSuffix}-${firstColor.code}.jpg`;
          }
        }
        img.src = thumb; img.alt = item.name || item.key; img.loading = 'lazy'; img.dataset.key = item.key;
        card.appendChild(img);
        const titleDiv = document.createElement('div'); titleDiv.className = 'title'; titleDiv.textContent = item.name || item.key; card.appendChild(titleDiv);
        const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = item.key; card.appendChild(meta);
        grid.appendChild(card);
      });

      section.appendChild(grid);
      galleryRoot.appendChild(section);
    });
  }

  // initial fill
  fillGallery();

  /* ---------- modal and interactions (most logic preserved) ---------- */
  let currentItem = null;
  let currentVariantIndex = 0;
  let currentColorIndex = 0;
  let thumbsContainer = modal?.querySelector('.modal-thumbs') || null;
  if (!thumbsContainer && modal) { thumbsContainer = document.createElement('div'); thumbsContainer.className = 'modal-thumbs'; }

  // History state flag
  let modalStatePushed = false;

  function getImageFor(item, variant, color) {
    if (color.img && String(color.img).includes('{key}')) {
      return color.img.replace(/\{key\}/g, item.key).replace(/\{variant\}/g, variant.suffix || '').replace(/\{code\}/g, color.code || '');
    }
    if (color.img) return color.img;
    const vs = variant.suffix || '';
    return `images/${item.key}${vs ? vs : ''}-${color.code}.jpg`;
  }

  function renderModalFor(item) {
    currentItem = item;
    currentVariantIndex = 0; // default to first (base)
    currentColorIndex = 0;
    const desc = item.variants[0].description || item.baseDescription || '';
    descEl.textContent = desc;
    renderVariantControls();
    renderMainAndThumbs();
    updateSkuPriceOzon();
    fillContacts(item.contacts);
    // show modal after SKU/price updated so we can push nice hash
    showModal();
  }

  function renderVariantControls() {
    const panel = modal.querySelector('.modal-panel');
    let variantWrap = panel.querySelector('.variant-toggle');
    if (variantWrap) variantWrap.remove();
    if (!currentItem || !currentItem.variants || currentItem.variants.length <= 1) return;
    variantWrap = document.createElement('div'); variantWrap.className = 'variant-toggle';
    currentItem.variants.forEach((v, idx) => {
      const btn = document.createElement('button'); btn.type = 'button';
      // use readable labels (prefer provided label)
      const label = v.label || (v.suffix === '-m' ? 'С магнитами' : 'Без магнитов');
      btn.textContent = label;
      if (idx === currentVariantIndex) btn.classList.add('active');
      btn.addEventListener('click', () => {
        currentVariantIndex = idx;
        descEl.textContent = v.description || currentItem.baseDescription || '';
        renderMainAndThumbs();
        updateSkuPriceOzon();
        variantWrap.querySelectorAll('button').forEach((b,i)=> b.classList.toggle('active', i===idx));
      });
      variantWrap.appendChild(btn);
    });
    const actions = panel.querySelector('.actions');
    if (actions) panel.insertBefore(variantWrap, actions);
    else panel.appendChild(variantWrap);
  }

  function renderMainAndThumbs() {
    if (!currentItem) return;
    const variant = currentItem.variants[currentVariantIndex];
    const colors = currentItem.colors || [];
    const imgs = colors.map(c => getImageFor(currentItem, variant, c));
    currentColorIndex = Math.min(currentColorIndex, imgs.length - 1);
    modalImg.src = imgs[currentColorIndex] || '';
    modalImg.alt = currentItem.name || '';
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
    const variant = currentItem.variants[currentVariantIndex] || { suffix: '' };
    const color = currentItem.colors[currentColorIndex] || {};
    const code = color.code || '';
    const sku = code ? `${currentItem.key}${variant.suffix || ''}-${code}` : `${currentItem.key}${variant.suffix || ''}`;
    if (skuEl) skuEl.textContent = 'Артикул: ' + sku;
    let price = '';
    if (color.prices) {
      if (variant.suffix && color.prices.hasOwnProperty(variant.suffix)) price = color.prices[variant.suffix];
      else if (color.prices.hasOwnProperty('')) price = color.prices[''];
    }
    if (!price && variant.price) price = variant.price;
    if (priceEl) priceEl.textContent = price ? 'Цена: ' + price : '';
    let oz = '';
    if (color.ozon) {
      if (typeof color.ozon === 'object') {
        if (variant.suffix && color.ozon[variant.suffix]) oz = color.ozon[variant.suffix];
        else if (color.ozon['']) oz = color.ozon[''];
      } else if (typeof color.ozon === 'string' && String(color.ozon).trim() !== '') {
        oz = color.ozon;
      }
    }
    if (!oz && variant.ozon) oz = variant.ozon;
    if (oz && ozonLink) { ozonLink.href = oz; ozonLink.style.display = 'inline-block'; }
    else if (ozonLink) { ozonLink.href = '#'; ozonLink.style.display = 'none'; }
    if (paletteLink) paletteLink.href = `palette.html?pref=${encodeURIComponent(sku)}`;
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
    // produce simple two links — styled via CSS
    container.innerHTML = `<a href="https://t.me/${String(tg).replace(/^@/,'')}" target="_blank" rel="noopener">Telegram: ${tg}</a>&nbsp;&nbsp;<span style="color:var(--muted)">|</span>&nbsp;&nbsp;<a href="https://wa.me/${String(wa).replace(/\D/g,'')}" target="_blank" rel="noopener">WhatsApp: ${wa}</a>`;
  }

  function openRawImage(imgEl) {
    currentItem = null;
    modalImg.src = imgEl.src;
    descEl.textContent = imgEl.alt || '';
    if (skuEl) skuEl.textContent = '';
    if (priceEl) priceEl.textContent = '';
    if (ozonLink) ozonLink.style.display = 'none';
    fillContacts({telegram:'@AvenNyan', whatsapp:'+7 981 852-21-94'});
    showModal();
  }

  // delegated click on gallery
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.gallery img, .gallery-card img, img[data-key]');
    if (!target) return;
    e.preventDefault();
    const key = target.dataset.key;
    if (RAW && key && RAW[key]) {
      const item = normalize(RAW[key], key);
      renderModalFor(item);
    } else if (RAW) {
      const srcFile = (target.getAttribute('src')||'').split('/').pop();
      let found = null;
      for (const k in RAW) {
        const norm = normalize(RAW[k], k);
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

  /* ----- History-aware modal open/close ----- */

  function closeModalNoHistory() {
    if (!modal) return;
    modal.style.display = 'none';
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('no-scroll');
    // show bottom nav back if hidden
    const bn = document.querySelector('.bottom-nav');
    if (bn) bn.classList.remove('hidden');
    modalStatePushed = false;
  }

  function showModal() {
    if (!modal) return;
    modal.style.display = 'flex';
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('no-scroll');

    // hide bottom nav to avoid overlap on mobile, if present
    const bn = document.querySelector('.bottom-nav');
    if (bn) bn.classList.add('hidden');

    // push state into history (only once per open)
    try {
      if (!modalStatePushed) {
        let skuText = '';
        if (skuEl && skuEl.textContent) {
          skuText = String(skuEl.textContent).replace(/^Артикул:\s*/i, '').trim();
          // sanitize to safe fragment
          skuText = skuText.replace(/\s+/g, '-').replace(/[^A-Za-z0-9\-_]/g, '');
        }
        const newHash = skuText ? ('#' + skuText) : ('#item');
        history.pushState({ modal: true, sku: skuText }, '', newHash);
        modalStatePushed = true;
      }
    } catch (e) {
      // ignore pushState errors (private mode, etc.)
      modalStatePushed = false;
    }
  }

  function closeModal() {
    if (!modal) return;
    // if we pushed a state for the modal, navigate back so popstate closes it
    if (modalStatePushed) {
      try { history.back(); }
      catch (e) { closeModalNoHistory(); }
    } else {
      closeModalNoHistory();
    }
  }

  // popstate: when user presses Back, close modal if open
  window.addEventListener('popstate', (e) => {
    if (modal && modal.getAttribute('aria-hidden') === 'false') {
      // close without affecting history (we're already in popstate)
      closeModalNoHistory();
    } else {
      // nothing special — allow normal navigation
    }
  });

  // attach close handlers
  if (closeBtn) {
    // ensure single listener
    closeBtn.removeEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
  }
  if (modal) {
    // overlay click
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  }

  // keyboard navigation while modal open
  document.addEventListener('keydown', (e) => {
    if (modal?.getAttribute('aria-hidden') === 'false') {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') {
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

  // touch swipe
  let touchStartX = null;
  modalImg?.addEventListener('touchstart', (e)=> { if (e.touches && e.touches.length) touchStartX = e.touches[0].clientX; }, {passive:true});
  modalImg?.addEventListener('touchend', (e)=> {
    if (touchStartX === null) return;
    const x = e.changedTouches[0].clientX; const diff = x - touchStartX; touchStartX = null;
    if (diff > 50) {
      if (currentItem && currentItem.colors && currentItem.colors.length>1) {
        currentColorIndex = (currentColorIndex - 1 + currentItem.colors.length) % currentItem.colors.length; renderMainAndThumbs(); updateSkuPriceOzon();
      }
    } else if (diff < -50) {
      if (currentItem && currentItem.colors && currentItem.colors.length>1) {
        currentColorIndex = (currentColorIndex + 1) % currentItem.colors.length; renderMainAndThumbs(); updateSkuPriceOzon();
      }
    }
  }, {passive:true});

  // ensure ozonLink and paletteLink exist
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
