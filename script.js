document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  const description = document.getElementById('description');
  const ozonLink = document.getElementById('ozon-link');
  const closeBtn = document.querySelector('.modal-close');
  const thumbContainer = document.createElement('div');
  thumbContainer.classList.add('modal-thumbs');

  // Добавляем контейнер для миниатюр сразу в модалку под большим фото
  modalImg.insertAdjacentElement('afterend', thumbContainer);

  let currentImages = [];
  let currentIndex = 0;

  // Открытие модалки
  document.querySelectorAll('.gallery-item').forEach(img => {
    img.addEventListener('click', () => {
      const key = img.dataset.key;
      const item = items[key];

      if (!item) return;

      currentImages = item.images || [img.src];
      currentIndex = 0;

      renderMainImage();
      renderThumbnails();

      description.textContent = item.description || '';

      if (item.ozon) {
        ozonLink.href = item.ozon;
        ozonLink.style.display = 'inline-block';
      } else {
        ozonLink.style.display = 'none';
      }

      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
    });
  });

  function renderMainImage() {
    modalImg.src = currentImages[currentIndex];
    modalImg.alt = '';
  }

  function renderThumbnails() {
    thumbContainer.innerHTML = '';
    currentImages.forEach((src, index) => {
      const thumb = document.createElement('img');
      thumb.src = src;
      thumb.className = 'thumb';
      if (index === currentIndex) thumb.classList.add('active');
      thumb.addEventListener('click', () => {
        currentIndex = index;
        renderMainImage();
        renderThumbnails();
      });
      thumbContainer.appendChild(thumb);
    });
  }

  // Закрытие модалки
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  // Листание свайпом
  let startX = 0;
  modalImg.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  });
  modalImg.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].clientX - startX;
    if (diff > 50) prevImage();
    if (diff < -50) nextImage();
  });

  function nextImage() {
    if (currentIndex < currentImages.length - 1) {
      currentIndex++;
      renderMainImage();
      renderThumbnails();
    }
  }

  function prevImage() {
    if (currentIndex > 0) {
      currentIndex--;
      renderMainImage();
      renderThumbnails();
    }
  }

  // Обновление года в футере
  document.querySelectorAll('#year-toys').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
});
