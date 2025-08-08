// helper: set year in footers
document.addEventListener('DOMContentLoaded', () => {
  const y = new Date().getFullYear();
  document.querySelectorAll('#year, #year-toys, #year-vases, #year-repair, #year-resin').forEach(el => {
    if (el) el.textContent = y;
  });

  // highlight top nav and bottom nav based on pathname
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
  const topActive = document.querySelector(`.top-nav .nav-link[href$="${key === 'index' ? 'index.html' : key + '.html'}"]`);
  if (topActive) topActive.classList.add('active');
  // bottom
  document.querySelectorAll('.bn-item').forEach(a => a.classList.remove('active'));
  const bottom = document.getElementById('bn-' + key);
  if (bottom) bottom.classList.add('active');

  // gallery items -> modal open
  document.querySelectorAll('.gallery-item').forEach(img => {
    img.addEventListener('click', () => {
      const k = img.getAttribute('data-key');
      openModalByKey(k);
    });
  });

  // If modal exists, setup listeners
  const modal = document.getElementById('modal');
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal();
    });
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
  }
});

// Open modal by data key using data/items.js
function openModalByKey(key) {
  if (!window.data || !data[key]) return;
  const item = data[key];
  const modal = document.getElementById('modal');
  const img = document.getElementById('modal-img');
  const desc = document.getElementById('description');
  const cb = document.getElementById('color-buttons');
  const oz = document.getElementById('ozon-link');

  // default to first color
  const firstColor = Object.keys(item.colors)[0];
  img.src = item.colors[firstColor].img;
  desc.textContent = item.description || item.name || '';
  oz.href = item.colors[firstColor].ozon || '#';

  // color buttons
  cb.innerHTML = '';
  Object.keys(item.colors).forEach(colorKey => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = colorKey;
    b.addEventListener('click', () => {
      img.src = item.colors[colorKey].img;
      oz.href = item.colors[colorKey].ozon || '#';
    });
    cb.appendChild(b);
  });

  // show modal
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
