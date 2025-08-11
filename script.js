document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("itemModal");
    const modalImg = document.getElementById("modalImg");
    const modalDetails = document.getElementById("modalDetails");
    const modalClose = document.getElementsByClassName("close")[0];

    const items = document.querySelectorAll(".item");

    items.forEach(item => {
        item.addEventListener("click", function () {
            const title = this.dataset.title || '';
            const description = this.dataset.description || '';
            const image = this.dataset.image || '';
            const ozon = this.dataset.ozon || '';
            const gallery = this.dataset.gallery ? JSON.parse(this.dataset.gallery) : [];

            modalDetails.innerHTML = `
                <div class="modal-main-photo">
                    <img id="mainModalPhoto" src="${image}" alt="${title}">
                </div>

                <div class="modal-thumbnails">
                    ${gallery.length > 0
                        ? gallery.map(img => `<img src="${img}" alt="${title}">`).join('')
                        : ''
                    }
                </div>

                <div class="modal-description">
                    <h2>${title}</h2>
                    <p>${description}</p>
                </div>

                <div class="modal-contacts">
                    <div>
                        <a href="https://t.me/AvenNyan" target="_blank">Telegram</a> — <span>@AvenNyan</span>
                    </div>
                    <div>
                        <a href="https://wa.me/79818522194" target="_blank">WhatsApp</a> — <span>+7 981 852-21-94</span>
                    </div>
                    ${ozon ? `<div><a href="${ozon}" target="_blank" class="ozon-btn">Купить на Ozon</a></div>` : ''}
                </div>
            `;

            modal.style.display = "block";

            // Привязка клика к миниатюрам
            document.querySelectorAll(".modal-thumbnails img").forEach(thumb => {
                thumb.addEventListener("click", function () {
                    document.getElementById("mainModalPhoto").src = this.src;
                });
            });
        });
    });

    // Закрытие модалки
    modalClose.onclick = function () {
        modal.style.display = "none";
    };

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    // Автоматическое обновление года в футере
    document.getElementById("year").textContent = new Date().getFullYear();
});
