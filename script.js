// site script: modal, active nav, year insertion, gallery hookup
document.addEventListener('DOMContentLoaded', () => {
  // year
  const y = new Date().getFullYear();
  document.querySelectorAll('#year, #year-toys, #year-vases, #year-repair, #year-resin').forEach(el => {
    if (el) el.textContent = y;
  });

  // highlight navs
  const path = location.pathname.split('/').pop() || 'index.html';
  const map = {
    'index.html':'index',
    '': 'index',
    'toys.html':'toys',
    'vases.html':'vases',
    'repair.html':'repair',
    'resin.html':'resin'
  };
  const key = map[path] || 'index';
  // top
  document.querySelectorAll('.top-nav .nav-link').forEach(a => a.classList.remove('active'));
  const topActive = document.querySelector('.top-nav .nav-link[href$="' + (key==='index'?'index.html': key + '.html') + '"]');
  if (topActive) topActive.classList.add('active');
  // bottom
  document.querySelectorAll('.bn-item').forEach(a => a.classList.remove('active'));
  const bottom = document.getElementById('bn-' + key);
  if (bottom) bottom.classList.add('active');

  // gallery click handlers
  document.querySelectorAll('.gallery-item').forEach(img => {
    img.addEventListener('click', () => {
      const k = img.getAttribute('data-key');
      openModalByKey(k);
    });
  });

  // modal close on backdrop
  const modal = document.getElementById('modal');
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal();
    });
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
  }
});

// open modal by key using data/items.js
function openModalByKey(key) {
  if (!window.data || !data[key]) return;
  const item = data[key];
  const modal = document.getElementById('modal');
  if (!modal) return;
  const img = document.getElementById('modal-img');
  const desc = document.getElementById('description');
  const cb = document.getElementById('color-buttons');
  const oz = document.getElementById('ozon-link');

  // use first color
  const first = Object.keys(item.colors)[0];
  img.src = item.colors[first].img;
  img.alt = item.name || '';
  desc.textContent = (item.name? item.name + ' — ' : '') + (item.description || '');
  if (oz) oz.href = item.colors[first].ozon || '#';

  // colors
  if (cb) {
    cb.innerHTML = '';
    Object.keys(item.colors).forEach(colorKey => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = colorKey;
      b.addEventListener('click', () => {
        img.src = item.colors[colorKey].img;
        if (oz) oz.href = item.colors[colorKey].ozon || '#';
      });
      cb.appendChild(b);
    });
  }

  // show
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden','false');
}

// close modal
function closeModal(){
  const modal = document.getElementById('modal');
  if (!modal) return;
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden','true');
}
