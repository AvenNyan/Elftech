// script.js — универсальный обработчик галерей и модалки
(function () {
  // state for gallery navigation
  let currentGallery = [];
  let currentIndex = -1;

  document.addEventListener('DOMContentLoaded', () => {
    insertYears();
    highlightNavs();
    hookupGalleryClicks();
    setupModalCloseHandlers();
  });

  function insertYears() {
    const y = new Date().getFullYear();
    document.querySelectorAll('#year, #year-toys, #year-vases, #year-repair, #year-resin').forEach(el => {
      if (el) el.textContent = y;
    });
  }

  function highlightNavs() {
    const path = location.pathname.split('/').pop() || 'index.html';
    const map = { 'index.html':'index', '': 'index', 'toys.html':'toys','vases.html':'vases','repair.html':'repair','resin.html':'resin' };
    const key = map[path] || 'index';

    // top nav
    document.querySelectorAll('.top-nav .nav-link').forEach(a => {
      const href = a.getAttribute('href') || '';
      const target = (key === 'index') ? 'index.html' : (key + '.html');
      a.classList.toggle('active', href.endsWith(target));
    });

    // bottom nav
    document.querySelectorAll('.bn-item').forEach(a => a.classList.remove('active'));
    const bottom = document.getElementById('bn-' + key);
    if (bottom) bottom.classList.add('active');
  }

  function hookupGalleryClicks() {
    // robust selector for images in galleries
    const imgs = Array.from(document.querySelectorAll('.gallery img, .gallery-item, img[data-key]'));
    imgs.forEach(img => {
      img.style.cursor = 'pointer';
      // avoid double-binding
      if (img.__elftechBound) return;
      img.__elftechBound = true;

      img.addEventListener('click', () => {
        // determine gallery container
        const gallery = img.closest('.gallery') || img.parentElement;
        currentGallery = gallery ? Array.from(gallery.querySelectorAll('img')) : imgs;
        currentIndex = currentGallery.indexOf(img);

        // try data-key first
        const explicitKey = img.dataset.key;
        if (explicitKey && window.itemsData && itemsData[explicitKey]) {
          openModalByKey(explicitKey, findColorKeyByImage(itemsData[explicitKey], img.getAttribute('src')));
          return;
        }

        // try matching filename in itemsData
        if (window.itemsData) {
          const filename = img.getAttribute('src')?.split('/').pop();
          if (filename) {
            for (const k in itemsData) {
              const colors = itemsData[k].colors || [];
              for (const c of colors) {
                const p = (c.img || '').split('/').pop();
                if (p === filename) {
                  openModalByKey(k, c.name);
                  return;
                }
              }
            }
          }
        }

        // fallback: show raw image in modal without itemsData
        openRawImageInModal(img);
      });
    });
  }

  function findColorKeyByImage(item, src) {
    if (!item || !item.colors) return null;
    const name = src?.split('/').pop();
    for (const c of item.colors) {
      if ((c.img || '').split('/').pop() === name) return c.name;
    }
    return null;
  }

  // open raw image (no itemsData) — minimal modal
  function openRawImageInModal(img) {
    const modal = getModal();
    if (!modal) return;
    const imgEl = modal.querySelector('#modal-img');
    const descEl = modal.querySelector('#description');
    const cb = modal.querySelector('#color-buttons');
    const oz = modal.querySelector('#ozon-link');
    const contactsContainer = getContactsContainer(modal);

    if (imgEl) imgEl.src = img.src;
    if (descEl) descEl.textContent = img.alt || '';
    if (cb) cb.innerHTML = '';
    if (oz) { oz.style.display = 'none'; oz.href = '#'; }
    if (contactsContainer) contactsContainer.innerHTML = '';

    showModal();
  }

  // get modal element
  function getModal() {
    return document.getElementById('modal');
  }

  // get (or create) contacts container inside modal
  function getContactsContainer(modal) {
    if (!modal) return null;
    let c = modal.querySelector('#modal-contacts');
    if (c) return c;
    // try find element after ozon-link
    const oz = modal.querySelector('#ozon-link');
    if (oz && oz.nextElementSibling) {
      // use existing node (likely static contacts div)
      oz.nextElementSibling.id = 'modal-contacts';
      return oz.nextElementSibling;
    }
    // else create and append
    c = document.createElement('div');
    c.id = 'modal-contacts';
    c.style.marginTop = '10px';
    c.style.color = '#666';
    if (oz && oz.parentNode) oz.parentNode.appendChild(c);
    else modal.querySelector('.modal-panel')?.appendChild(c);
    return c;
  }

  // open modal by item key (itemsData structure)
  function openModalByKey(key, colorName) {
    if (!window.itemsData || !itemsData[key]) return;
    const item = itemsData[key];
    const modal = getModal();
    if (!modal) return;

    const imgEl = modal.querySelector('#modal-img');
    const descEl = modal.querySelector('#description');
    const cb = modal.querySelector('#color-buttons');
    const oz = modal.querySelector('#ozon-link');
    const contactsContainer = getContactsContainer(modal);

    // choose color (by name) or default first
    const colors = item.colors || [];
    let chosen = null;
    if (colorName) chosen = colors.find(c => c.name === colorName) || colors[0];
    else chosen = colors[0] || null;

    if (imgEl && chosen) { imgEl.src = chosen.img; imgEl.alt = item.name || ''; }
    if (descEl) descEl.textContent = (item.name ? item.name + '. ' : '') + (item.description || '');

    // Ozon link visibility
    if (oz) {
      if (item.ozon) { oz.href = item.ozon; oz.style.display = ''; }
      else { oz.href = '#'; oz.style.display = 'none'; }
    }

    // build color buttons
    if (cb) {
      cb.innerHTML = '';
      colors.forEach((c) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = c.name;
        b.className = 'color-btn';
        if (chosen && c.img === chosen.img) b.classList.add('active');
        b.addEventListener('click', () => {
          if (imgEl) imgEl.src = c.img;
          if (oz && item.ozon) oz.href = item.ozon;
          cb.querySelectorAll('button').forEach(x => x.classList.remove('active'));
          b.classList.add('active');
        });
        cb.appendChild(b);
      });
    }

    // contacts: clickable links + copy-friendly text + copy button
    if (contactsContainer) {
      contactsContainer.innerHTML = '';
      const tel = item.contacts?.telegram || '';
      const wa = item.contacts?.whatsapp || '';

      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.flexDirection = 'column';
      row.style.gap = '6px';
      // clickable links
      const links = document.createElement('div');
      links.innerHTML = `
        <a href="https://t.me/${tel.replace(/^@/, '')}" target="_blank" rel="noopener">Telegram: ${tel}</a>
        <span style="margin:0 6px"> | </span>
        <a href="https://wa.me/${wa.replace(/\D/g, '')}" target="_blank" rel="noopener">WhatsApp: ${wa}</a>
      `;
      row.appendChild(links);

      // copy inputs
      const copyRow = document.createElement('div');
      copyRow.style.display = 'flex';
      copyRow.style.gap = '8px';
      copyRow.style.alignItems = 'center';
      copyRow.style.flexWrap = 'wrap';

      if (tel) {
        const wrap = document.createElement('div');
        wrap.style.display = 'flex'; wrap.style.gap = '6px'; wrap.style.alignItems = 'center';
        const input = document.createElement('input');
        input.type = 'text'; input.readOnly = true; input.value = tel;
        input.style.border = '1px solid #e6e6e6'; input.style.padding = '6px'; input.style.borderRadius = '6px';
        input.style.fontSize = '0.9rem';
        const btn = document.createElement('button');
        btn.type = 'button'; btn.textContent = 'Копировать';
        btn.className = 'copy-btn';
        btn.addEventListener('click', () => copyToClipboard(tel, btn));
        wrap.appendChild(input); wrap.appendChild(btn);
        copyRow.appendChild(wrap);
      }
      if (wa) {
        const wrap = document.createElement('div');
        wrap.style.display = 'flex'; wrap.style.gap = '6px'; wrap.style.alignItems = 'center';
        const input = document.createElement('input');
        input.type = 'text'; input.readOnly = true; input.value = wa;
        input.style.border = '1px solid #e6e6e6'; input.style.padding = '6px'; input.style.borderRadius = '6px';
        input.style.fontSize = '0.9rem';
        const btn = document.createElement('button');
        btn.type = 'button'; btn.textContent = 'Копировать';
        btn.className = 'copy-btn';
        btn.addEventListener('click', () => copyToClipboard(wa, btn));
        wrap.appendChild(input); wrap.appendChild(btn);
        copyRow.appendChild(wrap);
      }
      row.appendChild(copyRow);
      contactsContainer.appendChild(row);
    }

    showModal();

    // enable keyboard navigation (left/right/esc)
    document.addEventListener('keydown', keyboardHandler);
  }

  function copyToClipboard(text, btn) {
    if (!navigator.clipboard) {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); showCopyFeedback(btn); } catch(e) {}
      ta.remove();
      return;
    }
    navigator.clipboard.writeText(text).then(() => showCopyFeedback(btn));
  }
  function showCopyFeedback(btn) {
    const orig = btn.textContent;
    btn.textContent = 'Скопировано';
    setTimeout(() => btn.textContent = orig, 1200);
  }

  function showModal() {
    const modal = getModal();
    if (!modal) return;
    modal.classList.add('open');
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // add navigation arrows if gallery length > 1
    drawNavArrows(modal);
  }

  function drawNavArrows(modal) {
    // remove existing arrows
    const oldPrev = modal.querySelector('.modal-prev');
    const oldNext = modal.querySelector('.modal-next');
    if (oldPrev) oldPrev.remove();
    if (oldNext) oldNext.remove();

    if (!currentGallery || currentGallery.length < 2) return;

    const prev = document.createElement('button');
    prev.className = 'modal-prev';
    prev.title = 'Предыдущее';
    prev.innerHTML = '&#10094;'; // ‹
    prev.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateGallery(-1);
    });
    const next = document.createElement('button');
    next.className = 'modal-next';
    next.title = 'Следующее';
    next.innerHTML = '&#10095;'; // ›
    next.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateGallery(1);
    });

    modal.appendChild(prev);
    modal.appendChild(next);
  }

  function navigateGallery(dir) {
    if (!currentGallery || currentGallery.length === 0) return;
    currentIndex = (currentIndex + dir + currentGallery.length) % currentGallery.length;
    const img = currentGallery[currentIndex];
    if (!img) return;
    // try to open by key if exists in itemsData
    const key = img.dataset.key;
    if (key && window.itemsData && itemsData[key]) {
      openModalByKey(key, findColorKeyByImage(itemsData[key], img.getAttribute('src')));
    } else {
      // fallback: set modal image src and description
      const modal = getModal();
      if (!modal) return;
      const imgEl = modal.querySelector('#modal-img');
      const descEl = modal.querySelector('#description');
      if (imgEl) imgEl.src = img.src;
      if (descEl) descEl.textContent = img.alt || '';
    }
  }

  function keyboardHandler(e) {
    if (e.key === 'Escape') { closeModal(); }
    else if (e.key === 'ArrowLeft') { navigateGallery(-1); }
    else if (e.key === 'ArrowRight') { navigateGallery(1); }
  }

  function setupModalCloseHandlers() {
    const modal = getModal();
    if (!modal) return;
    // close button
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    // click on backdrop
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  function closeModal() {
    const modal = getModal();
    if (!modal) return;
    modal.classList.remove('open');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // remove keyboard handler
    document.removeEventListener('keydown', keyboardHandler);
    // remove arrows
    const oldPrev = modal.querySelector('.modal-prev');
    const oldNext = modal.querySelector('.modal-next');
    if (oldPrev) oldPrev.remove();
    if (oldNext) oldNext.remove();
  }
})();
