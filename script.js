const data = {
  frog1: {
    name: 'Лягушка 1',
    colors: {
      pink: { img: 'images/frog1_pink.jpg', ozon: '#' },
      green: { img: 'images/frog1_green.jpg', ozon: '#' },
    },
    description: 'Очаровательная лягушка с короткими лапками и широкой улыбкой.'
  },
  frog2: {
    name: 'Лягушка 2',
    colors: {
      pink: { img: 'images/frog2_pink.jpg', ozon: '#' },
      blue: { img: 'images/frog2_blue.jpg', ozon: '#' },
    },
    description: 'Модель с чуть более длинным туловищем и интересными глазами.'
  }
};

function showSection(id) {
  // Обновление верхней панели (десктоп)
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  const topBtn = document.querySelector(`nav button[onclick="showSection('${id}')"]`);
  if (topBtn) topBtn.classList.add('active');

  // Обновление секций
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  // Обновление нижней панели (мобильная)
  document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
  const bottomBtn = document.getElementById('nav-' + id);
  if (bottomBtn) bottomBtn.classList.add('active');
}

function openModal(name, key, colorList, defaultColor) {
  const item = data[key];
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  const colorButtons = document.getElementById('color-buttons');
  const description = document.getElementById('description');
  const ozonLink = document.getElementById('ozon-link');

  function setColor(c) {
    modalImg.src = item.colors[c].img;
    ozonLink.href = item.colors[c].ozon;
  }

  setColor(defaultColor);
  description.innerText = item.description;
  colorButtons.innerHTML = '';

  colorList.forEach(c => {
    const btn = document.createElement('button');
    btn.innerText = c;
    btn.onclick = () => setColor(c);
    colorButtons.appendChild(btn);
  });

  modal.style.display = 'flex';
}

function closeModal(e) {
  if (e.target.id === 'modal') {
    e.target.style.display = 'none';
  }
}
