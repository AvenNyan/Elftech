document.addEventListener("DOMContentLoaded", () => {
  const galleryItems = document.querySelectorAll(".gallery-item");
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modal-img");
  const colorButtons = document.getElementById("color-buttons");
  const description = document.getElementById("description");
  const ozonLink = document.getElementById("ozon-link");
  const closeBtn = document.querySelector(".modal-close");

  galleryItems.forEach(item => {
    item.addEventListener("click", () => {
      const key = item.dataset.key;
      const data = window.itemsData[key];

      if (!data) return;

      // Описание
      description.textContent = data.description || "";

      // Ссылка на Ozon
      ozonLink.href = data.ozon || "#";

      // Контакты
      const contactsBlock = document.createElement("div");
      contactsBlock.style.marginTop = "10px";
      contactsBlock.style.color = "#666";
      contactsBlock.innerHTML = `
        Контакты:
        <a href="https://t.me/${data.contacts.telegram.replace("@", "")}" target="_blank">Telegram: ${data.contacts.telegram}</a>,
        <a href="https://wa.me/${data.contacts.whatsapp.replace(/\D/g, "")}" target="_blank">WhatsApp: ${data.contacts.whatsapp}</a>
        <br>
        <small>Можно скопировать: ${data.contacts.telegram} | ${data.contacts.whatsapp}</small>
      `;

      // Очищаем контейнер перед вставкой
      description.insertAdjacentElement("afterend", contactsBlock);

      // Кнопки цветов
      colorButtons.innerHTML = "";
      if (data.colors && data.colors.length > 0) {
        data.colors.forEach((color, index) => {
          const btn = document.createElement("button");
          btn.textContent = color.name;
          btn.classList.add("color-btn");
          btn.addEventListener("click", () => {
            modalImg.src = color.img;
          });
          if (index === 0) {
            modalImg.src = color.img; // ставим первый цвет по умолчанию
          }
          colorButtons.appendChild(btn);
        });
      } else {
        modalImg.src = item.src;
      }

      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden"; // убираем скролл
    });
  });

  // Закрытие модалки
  closeBtn.addEventListener("click", () => {
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  });

  modal.addEventListener("click", e => {
    if (e.target === modal) {
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
  });

  // Год в футере
  const yearToys = document.getElementById("year-toys");
  if (yearToys) yearToys.textContent = new Date().getFullYear();
});
