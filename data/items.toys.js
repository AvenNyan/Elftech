// data/items.toys.js
window.itemsData = {
  "t010": {
    name: "Лягушка",
    group: "Лягушки",
    // variants: пустой суффикc = базовая, "-m" = с магнитом
    variants: [
      {
        suffix: "",           // filenames: images/t010-G01.jpg
        label: "Без магнита",
        description: "Модель без магнита, подходит для полок и декора.",
        ozon: ""
      },
      {
        suffix: "-m",         // filenames: images/t010-m-G01.jpg
        label: "С магнитом",
        description: "Модель с встроенным магнитом. Крепится к металлическим поверхностям.",
        ozon: ""
      }
    ],
    contacts: { telegram: "@AvenNyan", whatsapp: "+79818522194" },
    colors: [
      {
        code: "B01",
        // prices per variant suffix ("" or "-m")
        prices: { "": "200 ₽", "-m": "250 ₽" },
        // optional per-color-per-variant ozon overrides (can be string or object)
        ozon: { "": "https://ozon.ru/product/t010?color=G01", "-m": "https://ozon.ru/product/t010-m?color=G01" }
      },
      { code: "B04", prices: { "": "200 ₽", "-m": "250 ₽" }, ozon: "" },
      { code: "B12", prices: { "": "200 ₽", "-m": "250 ₽" }, ozon: "" },
      { code: "B14", prices: { "": "200 ₽", "-m": "250 ₽" }, ozon: "" },
      { code: "G01", prices: { "": "250 ₽", "-m": "300 ₽" }, ozon: "" },
      { code: "G04", prices: { "": "200 ₽", "-m": "250 ₽" }, ozon: "" },
      { code: "G05", prices: { "": "200 ₽", "-m": "250 ₽" }, ozon: "" },
      { code: "M01", prices: { "": "250 ₽", "-m": "300 ₽" }, ozon: "" },
      { code: "M02", prices: { "": "250 ₽", "-m": "300 ₽" }, ozon: "" },
      { code: "M03", prices: { "": "250 ₽", "-m": "300 ₽" }, ozon: "" },
      { code: "M08", prices: { "": "250 ₽", "-m": "300 ₽" }, ozon: "" },
      { code: "R01", prices: { "": "200 ₽", "-m": "250 ₽" }, ozon: "" },
      { code: "S01", prices: { "": "250 ₽", "-m": "300 ₽" }, ozon: "" },
      { code: "S02", prices: { "": "250 ₽", "-m": "300 ₽" }, ozon: "" },
      { code: "S03", prices: { "": "250 ₽", "-m": "300 ₽" }, ozon: "" },
      { code: "S04", prices: { "": "250 ₽", "-m": "300 ₽" }, ozon: "" },
      { code: "W01", prices: { "": "200 ₽", "-m": "250 ₽" }, ozon: "" },
      { code: "Y01", prices: { "": "200 ₽", "-m": "250 ₽" }, ozon: "" },
      { code: "Y02", prices: { "": "200 ₽", "-m": "250 ₽" }, ozon: "" }
    ]
  },

  "d001": {
    name: "Дракон большой",
    group: "Драконы",
    variants: [
      { suffix: "", label: "Базовая", description: "Большой 45 см дракон", ozon: "" },
      { suffix: "-m", label: "С магнитом", description: "Большой 45 см дракон с магнитами", ozon: "" }
    ],
    contacts: { telegram: "@AvenNyan", whatsapp: "+79818522194" },
    colors: [
      { code: "R01", prices: { "": "500 ₽", "-m": "600 ₽" }, ozon: "" },
      { code: "M01", prices: { "": "500 ₽", "-m": "600 ₽" } ozon: "" },
      { code: "M02", prices: { "": "500 ₽", "-m": "600 ₽" } ozon: "" },
      { code: "M03", prices: { "": "500 ₽", "-m": "600 ₽" } ozon: "" }
    ]
  }

  // добавляй новые товары по этой же схеме;
  // если хочешь указать явный путь к картинке, добавь color.img = "images/t010-G01.jpg"
};
