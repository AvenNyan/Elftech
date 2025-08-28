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
    // --- material + description block (создаётся или обновляется) ---
(function showMaterialAndDesc(it){
  if (!modal) return;
  let matNode = modal.querySelector('.modal-material');
  if (!matNode) {
    matNode = document.createElement('div');
    matNode.className = 'modal-material';
    matNode.innerHTML = '<div class="modal-material-line"></div><div class="modal-material-desc"></div>';
    // вставляем в конец панели (перед кнопками если они есть)
    const panel = modal.querySelector('.modal-panel');
    if (panel) panel.appendChild(matNode);
  }
  const matLine = matNode.querySelector('.modal-material-line');
  const descLine = matNode.querySelector('.modal-material-desc');
  matLine.textContent = it.material ? ('Материал: ' + it.material) : '';
  descLine.textContent = it.description || '';
})(item);
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
    // remove material/description block for raw images
const oldMat = modal.querySelector('.modal-material');
if (oldMat) oldMat.remove();

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

/* --- renderPaletteIfNeeded (замена) --- */
function renderPaletteIfNeeded() {
  const root = document.querySelector('.palette-grid');
  if (!root) return false;

  const RAW = window.itemsData || {};
  const entries = Object.keys(RAW).map(k => ({ key: k, raw: RAW[k] })).filter(e => e.raw);

  // helper: determine type
  function detectType(raw) {
    if (!raw) return 'multi';
    const t = (raw.type || raw.kind || raw.ty || '').toString().toLowerCase();
    if (t === 'solid' || t === 'single' || t === 'one' || t === 'mono') return 'solid';
    if (t === 'multi' || t === 'multicolor' || t === 'multi-color') return 'multi';
    if (t === 'tech' || t === 'technical' || t === 'techplastic' || t === 'technical-plastic') return 'tech';

    const m = (raw.material || '').toString().toLowerCase();
    if (m.includes('tech') || m.includes('cf') || m.includes('carbon') || m.includes('nylon') || m.includes('pa') || m.includes('pbt')) return 'tech';
    if (m.includes('pla') || m.includes('petg') || m.includes('abs') || m.includes('tpu') || m.includes('pc')) return 'solid';

    // guess by code prefix: codes starting with T or t -> tech ; MUL/M/MC -> multi
    const code = (raw.code || raw.key || '').toString();
    if (/^t/i.test(code)) return 'tech';
    if (/^mul|^m/i.test(code)) return 'multi';

    // fallback: if image filename suggests gradient/multi (contains 'mix'/'multi'), classify multi
    if (raw.img && /mix|multi|gradient|varieg/i.test(raw.img)) return 'multi';

    return 'solid'; // safe default (put into first group)
  }

  // helper: hex -> hsl
  function hexToHsl(hex) {
    if (!hex || typeof hex !== 'string') return { h: 999, s: 0, l: 0 };
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return { h: 999, s: 0, l: 0 };
    const r = parseInt(hex.slice(0,2),16)/255;
    const g = parseInt(hex.slice(2,4),16)/255;
    const b = parseInt(hex.slice(4,6),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h=0, s=0, l=(max+min)/2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max){
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h = h * 60;
    }
    return { h: Math.round(h), s: Math.round(s*100), l: Math.round(l*100) };
  }

  // group containers
  const solids = [], multis = [], techs = [];

  entries.forEach(e => {
    const raw = e.raw;
    const type = detectType(raw);
    const item = {
      key: e.key,
      code: raw.code || e.key,
      name: raw.name || raw.title || raw.code || e.key,
      img: raw.img || raw.image || (raw.colors && raw.colors[0] && raw.colors[0].img) || raw.imageThumb || 'images/placeholder.png',
      material: raw.material || raw.mat || '',
      hex: (raw.hex || raw.colorHex || (raw.colors && raw.colors[0] && raw.colors[0].hex)) || '',
      description: raw.description || raw.desc || raw.note || ''
    };
    if (type === 'solid') solids.push(item);
    else if (type === 'multi') multis.push(item);
    else techs.push(item);
  });

  // sort solids by hue -> sat -> lightness
  solids.sort((a,b) => {
    const ha = hexToHsl(a.hex);
    const hb = hexToHsl(b.hex);
    if (ha.h !== hb.h) return ha.h - hb.h;
    if (ha.s !== hb.s) return hb.s - ha.s;
    return ha.l - hb.l;
  });

  // helper to create card
  function makeCard(item, flags = {}) {
    const c = document.createElement('div'); c.className = 'card';
    if (flags.badge) {
      const badge = document.createElement('div');
      badge.className = 'card-badge';
      badge.textContent = flags.badge;
      badge.style.position = 'absolute';
      badge.style.right = '8px';
      badge.style.top = '8px';
      badge.style.background = 'rgba(0,0,0,0.06)';
      badge.style.padding = '4px 6px';
      badge.style.fontSize = '12px';
      badge.style.borderRadius = '6px';
      c.style.position = 'relative';
      c.appendChild(badge);
    }
    const img = document.createElement('img');
    img.src = item.img;
    img.alt = item.name;
    img.loading = 'lazy';
    img.dataset.key = item.code || item.key;
    c.appendChild(img);

    const title = document.createElement('div'); title.className = 'title'; title.textContent = item.name;
    c.appendChild(title);

    const meta = document.createElement('div'); meta.className = 'meta';
    meta.textContent = (item.code ? item.code + (item.material ? ' ' + item.material : '') : (item.material || ''));
    c.appendChild(meta);

    return c;
  }

  // build DOM
  root.innerHTML = '';

  // solids first (no header)
  const solidsGrid = document.createElement('div'); solidsGrid.className = 'category-grid';
  solids.forEach(it => solidsGrid.appendChild(makeCard(it)));
  root.appendChild(solidsGrid);

  // multis
  if (multis.length) {
    const h = document.createElement('div'); h.className = 'category-title'; h.textContent = 'Многоцветные';
    root.appendChild(h);
    const g = document.createElement('div'); g.className = 'category-grid';
    multis.forEach(it => g.appendChild(makeCard(it, { badge: 'Многоцветный' })));
    root.appendChild(g);
  }

  // techs
  if (techs.length) {
    const h2 = document.createElement('div'); h2.className = 'category-title'; h2.textContent = 'Технические пластики';
    root.appendChild(h2);
    const g2 = document.createElement('div'); g2.className = 'category-grid';
    techs.forEach(it => g2.appendChild(makeCard(it, { badge: 'Техпластик' })));
    root.appendChild(g2);
  }

  // done
  return true;
}
