document.addEventListener("DOMContentLoaded", () => {
  const modal = document.createElement("div");
  modal.classList.add("modal");
  modal.innerHTML = `
    <div class="modal-content">
      <span class="modal-close">&times;</span>
      <img class="modal-image" src="" alt="">
      <h2 class="modal-title"></h2>
      <p class="modal-color"></p>
      <div class="modal-links">
        <a class="modal-ozon" href="#" target="_blank">Купить на Ozon</a>
        <a class="modal-contact" href="https://t.me/AvenNyan" target="_blank">Написать в Telegram</a>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const modalImage = modal.querySelector(".modal-image");
  const modalTitle = modal.querySelector(".modal-title");
  const modalColor = modal.querySelector(".modal-color");
  const modalOzon = modal.querySelector(".modal-ozon");
  const closeModal = modal.querySelector(".modal-close");

  function openModal(data) {
    modalImage.src = data.image;
    modalTitle.textContent = data.name;
    modalColor.textContent = data.color ? `Цвет: ${data.color}` : "";
    modalOzon.href = data.ozon || "#";
    modal.classList.add("open");
  }

  closeModal.addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });

  document.querySelectorAll(".product-item").forEach((item) => {
    item.addEventListener("click", () => {
      const data = {
        name: item.dataset.name,
        image: item.querySelector("img").src,
        color: item.dataset.color,
        ozon: item.dataset.ozon
      };
      openModal(data);
    });
  });
});
