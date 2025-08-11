document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modal-img");
  const description = document.getElementById("description");
  const colorButtons = document.getElementById("color-buttons");
  const ozonLink = document.getElementById("ozon-link");

  document.querySelectorAll(".gallery-item").forEach(img => {
    img.addEventListener("click", () => {
      const key = img.dataset.key;
      const item = items[key];

      if (!item) return;

      modalImg.src = item.images[0];
      modalImg.alt = item.name;
      description.textContent = item.desc || "";

      // Кнопки выбора цвета
      colorButtons.innerHTML = "";
      if (item.colors) {
        item.colors.forEach(c => {
          const btn = document.createElement("button");
          btn.style.background = c.color;
          btn.title = c.name;
          btn.addEventListener("click", () => {
            modalImg.src = c.img;
          });
          colorButtons.appendChild(btn);
        });
      }

      // Кнопка Ozon — скрыть если нет ссылки
      if (item.ozon) {
        ozonLink.href = item.ozon;
        ozonLink.style.display = "inline-block";
      } else {
        ozonLink.style.display = "none";
      }

      modal.setAttribute("aria-hidden", "false");
      modal.style.display = "flex";
    });
  });

  // Закрытие модалки
  document.querySelector(".modal-close").addEventListener("click", () => {
    modal.setAttribute("aria-hidden", "true");
    modal.style.display = "none";
  });

  // Закрытие по клику вне панели
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.setAttribute("aria-hidden", "true");
      modal.style.display = "none";
    }
  });
});
