document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modal-img");
  const description = document.getElementById("description");
  const colorButtonsContainer = document.getElementById("color-buttons");
  const ozonLink = document.getElementById("ozon-link");

  // Клик по картинке
  document.querySelectorAll(".gallery-item").forEach(item => {
    item.addEventListener("click", () => {
      const key = item.dataset.key;
      const product = items[key];

      if (!product) return;

      modalImg.src = product.images[0];
      modalImg.alt = product.name;
      description.textContent = product.description;

      // Кнопки выбора цвета
      colorButtonsContainer.innerHTML = "";
      if (product.colors) {
        product.colors.forEach(color => {
          const btn = document.createElement("button");
          btn.style.background = color.hex;
          btn.title = color.name;
          btn.addEventListener("click", () => {
            modalImg.src = color.image;
          });
          colorButtonsContainer.appendChild(btn);
        });
      }

      // Кнопка Ozon
      if (product.ozon) {
        ozonLink.href = product.ozon;
        ozonLink.style.display = "inline-block";
      } else {
        ozonLink.style.display = "none";
      }

      modal.classList.add("show");
    });
  });

  // Закрытие модалки
  document.querySelector(".modal-close").addEventListener("click", () => {
    modal.classList.remove("show");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
    }
  });

  // Год в футере
  document.querySelectorAll("[id^=year]").forEach(el => {
    el.textContent = new Date().getFullYear();
  });
});
