// data/items.js
// Формат: window.itemsData = { key: { name, description, ozon, contacts, images, colors } }
// - key: короткий идентификатор (используется как data-key в img)
// - images: массив путей к картинкам (опционально, берутся как превью/варианты)
// - colors: массив вариантов/цветов { name, img, ozon?, hex? } (если указан — используется для per-color ozon)

window.itemsData = {
  /* ========= 6 лягушек (каждая — 3 цвета) ========= */
  frog1: {
    name: "Лягушка 1",
    description: "Милая лягушка для декора, ~10 см.",
    ozon: "https://ozon.ru/product/frog1", // fallback ссылка на товар
    contacts: { telegram: "@AvenNyan", whatsapp: "+79818522194" },
    images: [
      "images/frog1_green.jpg",
      "images/frog1_pink.jpg",
      "images/frog1_blue.jpg"
    ],
    colors: [
      { name: "Зелёный", img: "images/frog1_green.jpg", ozon: "https://ozon.ru/product/frog1?color=green", hex: "#3cb043" },
      { name: "Розовый", img: "images/frog1_pink.jpg", ozon: "https://ozon.ru/product/frog1?color=pink", hex: "#ff8cc6" },
      { name: "Синий", img: "images/frog1_blue.jpg", /* no ozon for this color */ hex: "#4a90e2" }
    ]
  },

  frog2: {
    name: "Лягушка 2",
    description: "Компактная лягушка-игрушка.",
    ozon: "", // нет общей ссылки
    contacts: { telegram: "@AvenNyan", whatsapp: "+79818522194" },
    images: [
      "images/frog2_green.jpg",
      "images/frog2_pink.jpg",
      "images/frog2_blue.jpg"
    ],
    colors: [
      { name: "Зелёный", img: "images/frog2_green.jpg", ozon: "" },
      { name: "Розовый", img: "images/frog2_pink.jpg", ozon: "" },
      { name: "Синий", img: "images/frog2_blue.jpg", ozon: "" }
    ]
  },

  frog3: {
    name: "Лягушка 3",
    description: "Мини-фигурка, приятная на ощупь.",
    ozon: "https://ozon.ru/product/frog3",
    contacts: { telegram: "@AvenNyan", whatsapp: "+79818522194" },
    images: [
      "images/frog3_green.jpg",
      "images/frog3_pink.jpg",
      "images/frog3_blue.jpg"
    ],
    colors: [
      { name: "Зелёный", img: "images/frog3_green.jpg", ozon: "https://ozon.ru/product/frog3?color=green" },
      { name: "Розовый", img: "images/frog3_pink.jpg", ozon: "https://ozon.ru/product/frog3?color=pink" },
      { name: "Синий", img: "images/frog3_blue.jpg", ozon: "https://ozon.ru/product/frog3?color=blue" }
    ]
  },

  frog4: {
    name: "Лягушка 4",
    description: "Стильная лягушка для полки.",
    ozon: "",
    contacts: { telegram: "@AvenNyan", whatsapp: "+79818522194" },
    images: [
      "images/frog4_green.jpg",
      "images/frog4_pink.jpg",
      "images/frog4_blue.jpg"
    ],
    colors: [
      { name: "Зелёный", img: "images/frog4_green.jpg" },
      { name: "Розовый", img: "images/frog4_pink.jpg" },
      { name: "Синий", img: "images/frog4_blue.jpg" }
    ]
  },

  frog5: {
    name: "Лягушка 5",
    description: "Декоративная фигурка с гладкой поверхностью.",
    ozon: "",
    contacts: { telegram: "@AvenNyan", whatsapp: "+79818522194" },
    images: [
      "images/frog5_green.jpg",
      "images/frog5_pink.jpg",
      "images/frog5_blue.jpg"
    ],
    colors: [
      { name: "Зелёный", img: "images/frog5_green.jpg" },
      { name: "Розовый", img: "images/frog5_pink.jpg" },
      { name: "Синий", img: "images/frog5_blue.jpg" }
    ]
  },

  frog6: {
    name: "Лягушка 6",
    description: "Коллекционная модель, печать высокого качества.",
    ozon: "https://ozon.ru/product/frog6",
    contacts: { telegram: "@AvenNyan", whatsapp: "+79818522194" },
    images: [
      "images/frog6_green.jpg",
      "images/frog6_pink.jpg",
      "images/frog6_blue.jpg"
    ],
    colors: [
      { name: "Зелёный", img: "images/frog6_green.jpg" },
      { name: "Розовый", img: "images/frog6_pink.jpg" },
      { name: "Синий", img: "images/frog6_blue.jpg" }
    ]
  },

  /* ========= 3 дракона (по 3 цвета) ========= */
  dragon1: {
    name: "Дракон 1",
    description: "Фигурка дракона, детализированная.",
    ozon: "",
    contacts: { telegram: "@AvenNyan", whatsapp: "+79818522194" },
    images: [
      "images/dragon1_red.jpg",
      "images/dragon1_black.jpg",
      "images/dragon1_gold.jpg"
    ],
    colors: [
      { name: "Красный", img: "images/dragon1_red.jpg" },
      { name: "Чёрный", img: "images/dragon1_black.jpg" },
      { name: "Золотой", img: "images/dragon1_gold.jpg" }
    ]
  },

  dragon2: {
    name: "Дракон 2",
    description: "Дракон в динамичной позе.",
    ozon: "https://ozon.ru/product/dragon2",
    contacts: { telegram: "@AvenNyan", whatsapp: "+79818522194" },
    images: [
      "images/dragon2_red.jpg",
      "images/dragon2_black.jpg",
      "images/dragon2_gold.jpg"
    ],
    colors: [
      { name: "Красный", img: "images/dragon2_red.jpg", ozon: "https://ozon.ru/product/dragon2?color=red" },
      { name: "Чёрный", img: "images/dragon2_black.jpg", ozon: "https://ozon.ru/product/dragon2?color=black" },
      { name: "Золотой", img: "images/dragon2_gold.jpg", ozon: "https://ozon.ru/product/dragon2?color=gold" }
    ]
  },

  dragon3: {
    name: "Дракон 3",
    description: "Мини-дракон для коллекции.",
    ozon: "",
    contacts: { telegram: "@AvenNyan", whatsapp: "+79818522194" },
    images: [
      "images/dragon3_red.jpg",
      "images/dragon3_black.jpg",
      "images/dragon3_gold.jpg"
    ],
    colors: [
      { name: "Красный", img: "images/dragon3_red.jpg" },
      { name: "Чёрный", img: "images/dragon3_black.jpg" },
      { name: "Золотой", img: "images/dragon3_gold.jpg" }
    ]
  }
};
