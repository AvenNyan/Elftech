/* palette-render.js
   Render palette page into .palette-grid using window.paletteData (fallback window.itemsData).
   Adds grouping: solids (first, no header), multi (header), tech (header).
   Self-contained modal for palette view (won't change other pages).
*/
(function(){
  'use strict';

  function $(sel, root=document) { return root.querySelector(sel); }
  function $all(sel, root=document) { return Array.from(root.querySelectorAll(sel)); }

  // helper: safe data source
  const RAW = window.paletteData || window.itemsData || window.items || {};

  // convert raw entries to normalized item
  function normEntry(key, raw) {
    raw = raw || {};
    return {
      key: key,
      code: raw.code || key,
      name: raw.name || raw.title || key,
      img: raw.img || raw.image || (raw.colors && raw.colors[0] && raw.colors[0].img) || 'images/placeholder.png',
      material: raw.material || raw.mat || '',
      type: (raw.type || raw.kind || '').toString().toLowerCase() || (raw.material ? inferTypeFromMaterial(raw.material) : ''),
      hex: (raw.hex || raw.colorHex || (raw.colors && raw.colors[0] && raw.colors[0].hex) || '').toString(),
      description: raw.description || raw.desc || raw.note || ''
    };
  }

  function inferTypeFromMaterial(m) {
    if (!m) return '';
    m = m.toLowerCase();
    if (m.includes('pla') || m.includes('petg') || m.includes('abs') || m.includes('tpu') || m.includes('pc')) return 'solid';
    if (m.includes('mix') || m.includes('multi')) return 'multi';
    if (m.includes('cf') || m.includes('nylon') || m.includes('pa') || m.includes('tech') || m.includes('pbt')) return 'tech';
    return '';
  }

  // hex -> H (0..360) fallback big number for unknown
  function hexToHue(hex) {
    if (!hex) return 9999;
    hex = String(hex).replace('#','').trim();
    if (hex.length === 3) hex = hex.split('').map(x=>x+x).join('');
    if (!/^[0-9a-f]{6}$/i.test(hex)) return 9999;
    const r = parseInt(hex.slice(0,2),16)/255;
    const g = parseInt(hex.slice(2,4),16)/255;
    const b = parseInt(hex.slice(4,6),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    if (max === min) return 0;
    const d = max - min;
    let h;
    switch(max){
      case r: h = ((g - b) / d) % 6; break;
      case g: h = ((b - r) / d) + 2; break;
      default: h = ((r - g) / d) + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    return h;
  }

  // create card DOM
  function makeCard(item) {
    const card = document.createElement('div');
    card.className = 'card palette-card';
    // image
    const img = document.createElement('img');
    img.src = item.img;
    img.alt = item.name;
    img.loading = 'lazy';
    img.dataset.paletteKey = item.code || item.key;
    img.style.width = '100%';
    card.appendChild(img);
    // title
    const title = document.createElement('div'); title.className = 'title'; title.textContent = item.name;
    card.appendChild(title);
    // meta: code + material
    const meta = document.createElement('div'); meta.className = 'meta';
    meta.textContent = (item.code ? item.code : '') + (item.material ? ' ' + item.material : '');
    card.appendChild(meta);
    return card;
  }

  // main render
  function renderPalette() {
    const root = document.querySelector('.palette-grid');
    if (!root) return;
    // flatten RAW keys
    const entries = Object.keys(RAW).map(k => normEntry(k, RAW[k]));
    // classify
    const solids = [], multis = [], techs = [];
    entries.forEach(it => {
      const type = (it.type || '').toString().toLowerCase();
      if (type === 'multi' || type === 'multicolor' || /multi|mix|varieg/i.test(it.name+it.img+it.description)) {
        multis.push(it);
      } else if (type === 'tech' || type === 'technical' || /cf|nylon|pa|pbt|tech|carbon/i.test(it.material+it.name)) {
        techs.push(it);
      } else {
        solids.push(it);
      }
    });

    // sort solids by hue if hex present (unknowns go to end)
    solids.sort((a,b) => {
      const ha = hexToHue(a.hex), hb = hexToHue(b.hex);
      if (ha === hb) return (a.code||'').localeCompare(b.code||'');
      return ha - hb;
    });

    // clear root
    root.innerHTML = '';

    // tiny helper to append grid
    function appendGrid(items, showHeader, headerText, noHeaderForSolids){
      if (!items.length) return;
      if (showHeader && !noHeaderForSolids) {
        const h = document.createElement('div');
        h.className = 'category-title';
        h.textContent = headerText;
        root.appendChild(h);
      } else if (showHeader && noHeaderForSolids && headerText) {
        // in our UX solids have no header; ignore
      }
      const grid = document.createElement('div');
      grid.className = 'category-grid';
      items.forEach(it => grid.appendChild(makeCard(it)));
      root.appendChild(grid);
    }

    // solids first (no header)
    appendGrid(solids, true, '', true);
    // multis
    appendGrid(multis, true, 'Многоцветные');
    // techs
    appendGrid(techs, true, 'Технические пластики');

    // attach click listeners (delegated)
    root.querySelectorAll('img[data-palette-key]').forEach(img => {
      img.addEventListener('click', (e) => {
        const key = img.dataset.paletteKey;
        const entry = entries.find(x => (x.code === key) || (x.key === key));
        if (entry) openPaletteModal(entry);
        else openRawPaletteImg(img.src, img.alt);
      });
    });
  }

  // modal behavior for palette (self-contained)
  const modal = document.getElementById('modal');
  const modalPanel = modal ? modal.querySelector('.modal-panel') : null;
  const modalImg = modal ? modal.querySelector('#modal-img') : null;

  function ensurePaletteSkuNode() {
    if (!modalPanel) return null;
    let sku = modalPanel.querySelector('.palette-sku');
    if (!sku) {
      sku = document.createElement('div');
      sku.className = 'palette-sku';
      sku.style.marginTop = '8px';
      sku.style.fontWeight = '600';
      sku.style.color = 'var(--sku-color, #333)';
      modalPanel.appendChild(sku);
    }
    return sku;
  }

  function openPaletteModal(entry) {
    if (!modal || !modalImg) return;
    modalImg.src = entry.img;
    modalImg.alt = entry.name || '';
    const sku = ensurePaletteSkuNode();
    if (sku) sku.textContent = (entry.code || '') + (entry.material ? ' ' + entry.material : '');
    // description (optional)
    let desc = modalPanel.querySelector('.palette-desc');
    if (!desc) {
      desc = document.createElement('div');
      desc.className = 'palette-desc';
      desc.style.color = 'var(--muted)';
      desc.style.marginTop = '6px';
      desc.style.fontSize = '0.95rem';
      modalPanel.appendChild(desc);
    }
    desc.textContent = entry.description || '';
    // show modal
    modal.style.display = 'flex';
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('no-scroll');
  }

  function openRawPaletteImg(src, alt) {
    if (!modal || !modalImg) return;
    modalImg.src = src;
    modalImg.alt = alt || '';
    const sku = ensurePaletteSkuNode();
    if (sku) sku.textContent = '';
    const desc = modalPanel.querySelector('.palette-desc');
    if (desc) desc.textContent = '';
    modal.style.display = 'flex';
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('no-scroll');
  }

  function closePaletteModal() {
    if (!modal) return;
    modal.style.display = 'none';
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('no-scroll');
  }

  // attach modal close handlers (if modal exists)
  if (modal) {
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closePaletteModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closePaletteModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePaletteModal(); });
    // swipe left/right on modal image (for touch)
    if (modalImg) {
      let startX = null;
      modalImg.addEventListener('touchstart', (ev) => { if (ev.touches && ev.touches.length) startX = ev.touches[0].clientX; }, {passive:true});
      modalImg.addEventListener('touchend', (ev) => {
        if (startX === null) return;
        const dx = (ev.changedTouches[0].clientX - startX);
        if (Math.abs(dx) > 60) {
          // nothing to cycle in palette modal (single image), but keep handler placeholder
        }
        startX = null;
      }, {passive:true});
    }
  }

  // run render on DOMContentLoaded (if already loaded, run immediately)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPalette);
  } else {
    renderPalette();
  }

})();
