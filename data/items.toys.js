// data/items.toys.js
window.itemsData = {
  // пример: обычная лягушка (без магнита)
  "t010": {
    name: "Лягушка базовая",
    description: "Милая лягушка для декора, ~10 см.",
    ozon: "https://ozon.ru/product/t010", // fallback товарная ссылка
    contacts: { telegram: "@AvenNyan", whatsapp: "+79818522194" },
    colors: [
      { code: "G01", img: "images/t010-G01.jpg", ozon: "https://ozon.ru/product/t010?color=G01" },
      { code: "G02", img: "images/t010-G02.jpg" },
      { code: "G03", img: "images/t010-G03.jpg" }
    ]
  },

  // версия с магнитами — ключ включает -m
  "t011-m": {
    name: "Лягушка с магнитом",
    description: "Лягушка с встроенным магнитом, крепится на поверхность.",
    ozon: "",
    contacts: { telegram: "@AvenNyan", whatsapp: "+79818522194" },
    colors: [
      { code: "G01", img: "images/t011-m-G01.jpg" },
      { code: "G02", img: "images/t011-m-G02.jpg" },
      { code: "G03", img: "images/t011-m-G03.jpg" }
    ]
  },

  // дракон
  "d001": {
    name: "Дракон малый",
    description: "Дракон с детальной текстурой.",
    ozon: "https://ozon.ru/product/d001",
    contacts: { telegram: "@AvenNyan", whatsapp: "+79818522194" },
    colors: [
      { code: "R01", img: "images/d001-R01.jpg", ozon: "https://ozon.ru/product/d001?color=R01" },
      { code: "B01", img: "images/d001-B01.jpg" },
      { code: "K01", img: "images/d001-K01.jpg" }
    ]
  }

  // ... добавляй далее свои товары точно по схеме
};
