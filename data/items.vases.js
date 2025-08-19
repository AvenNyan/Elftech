// data/items.vases.js
window.itemsData = {
  "V501": {
    name: "Ваза с сердечками",
    description: "Прямая ваза-стакан с сердечками",
    // миниатюра для карточки (если не указан - берётся изображение первого цвета)
    image: "",
    variants: [
      { suffix: "-12", label: "12 см", description: "Прямая ваза-стакан с сердечками, высота 12 см.", ozon: "" },
      { suffix: "-16", label: "16 см", description: "Прямая ваза-стакан с сердечками, высота 16 см.", ozon: "" },
      { suffix: "-20", label: "20 см", description: "Прямая ваза-стакан с сердечками, высота 20 см.", ozon: "" }
    ],
    contacts: { telegram: "@AvenNyan", whatsapp: "+79818522194" },
    colors: [
      // тут для каждого цвета мы прямо указываем путь к файлу — 
      // этот файл будет использоваться для ВСЕХ подвидов (suffix) этого товара
      { code: "B13", img: "images/t010-B13.jpg", prices: { "-12": "100 ₽", "-16": "160 ₽", "-20": "250 ₽"}, ozon: "" },
      { code: "B14", img: "images/t010-B14.jpg", prices: { "-12": "100 ₽", "-16": "160 ₽", "-20": "250 ₽"}, ozon: "" },
      { code: "G11", img: "images/t010-G11.jpg", prices: { "-12": "100 ₽", "-16": "160 ₽", "-20": "250 ₽"}, ozon: "" },
      { code: "P06", img: "images/t010-P06.jpg", prices: { "-12": "100 ₽", "-16": "160 ₽", "-20": "250 ₽"}, ozon: "" },
      { code: "R02", img: "images/t010-R02.jpg", prices: { "-12": "100 ₽", "-16": "160 ₽", "-20": "250 ₽"}, ozon: "" },
      { code: "R04", img: "images/t010-R04.jpg", prices: { "-12": "100 ₽", "-16": "160 ₽", "-20": "250 ₽"}, ozon: "" },
      { code: "V01", img: "images/t010-V01.jpg", prices: { "-12": "100 ₽", "-16": "160 ₽", "-20": "250 ₽"}, ozon: "" },
      { code: "W02", img: "images/t010-W02.jpg", prices: { "-12": "100 ₽", "-16": "160 ₽", "-20": "250 ₽"}, ozon: "" }
    ]
  },


  "v101": {
    name: "Ваза гео",
    description: "Геометрическая ваза для декора.",
    group: "Вазы",
    colors: [
      { code: "W01", img: "images/v101-W01.jpg" },
      { code: "W02", img: "images/v101-W02.jpg" }
    ]
  }
};
