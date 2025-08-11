document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modal-img");
  const description = document.getElementById("description");
  const ozonLink = document.getElementById("ozon-link");
  const colorButtons = document.getElementById("color-buttons");
  const closeBtn = document.querySelector(".modal-close");

  // Загружаем данные
  if (typeof itemsData !== "undefined") {
    document.querySelectorAll(".gallery-item").forEach(img => {
      img.addEventListener("click", () => {
        const key = img.dataset.key;
        const item = itemsData[key];
        if (!item) return;

        modalImg.src = item.images[0];
        modalImg.alt = item.name;
        description.textContent = item.description || "";

        // Если ссылки нет — скрываем кнопку
        if (item.ozon && item.ozon.trim() !== "") {
          ozonLink.href = item.ozon;
          ozonLink.style.display = "inline-block";
        } else {
          ozonLink.style.display = "none";
        }

        // Генерируем кнопки выбора цвета
        colorButtons.innerHTML = "";
        if (item.images.length > 1) {
          item.colors.forEach((colorName, index) => {
            const btn = document.createElement("button");
            btn.textContent = colorName;
            btn.addEventListener("click", () => {
              modalImg.src = item.images[index];
            });
            colorButtons.appendChild(btn);
          });
        }

        modal.style.display = "flex";
      });
    });
  }

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Автоматическая установка года
  document.querySelectorAll("#year-toys, #year-vases, #year-repair, #year-resin")
    .forEach(el => el.textContent = new Date().getFullYear());
});
