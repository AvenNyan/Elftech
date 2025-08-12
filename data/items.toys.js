// data/items.toys.js
window.itemsData = {
  "t010": {
    name: "Лягушка",
    group: "Лягушки",
    // variants: пустой суффикc = базовая, "-m" = с магнитом
    variants: [
      {
        suffix: "",           // results in filenames like images/t010-G01.jpg
        label: "Без магнита",
        description: "Модель без магнита, подходит для полок и декора.",
        ozon: "https://ozon.ru/product/t010", // общая ссылка для варианта
        price: "950 ₽"
      },
      {
        suffix: "-m",         // results in filenames like images/t010-m-G01.jpg
        label: "С магнитом",
        description: "Модель с встроенным магнитом. Крепится к металлическим поверхностям.",
        ozon: "https://ozon.ru/product/t010-m",
        price: "1150 ₽"
      }
    ],
    contacts: { telegram: "@AvenNyan", whatsapp: "+79818522194" },
    colors: [
      { code: "G01" }, // images/t010-G01.jpg and images/t010-m-G01.jpg
      { code: "G02" },
      { code: "G03" }
    ]
  },

  // пример другого товара (дракон) с базовой и магнитной версиями
  "d001": {
    name: "Дракон малый",
    group: "Драконы",
    variants: [
      { suffix: "", label: "Базовая", description: "Дракон малый, детализированный.", ozon: "https://ozon.ru/product/d001", price: "1200 ₽" },
      { suffix: "-m", label: "С магнитом", description: "Дракон с магнитом.", ozon: "", price: "1400 ₽" }
    ],
    contacts: { telegram: "@AvenNyan", whatsapp: "+79818522194" },
    colors: [
      { code: "R01" },
      { code: "B01" },
      { code: "K01" }
    ]
  },

  // добавь другие товары по той же схеме
};
