const DB = "inventario-db";

let items = JSON.parse(localStorage.getItem(DB) || "null") || [
  {
    name: "Tienda Airseconds 4.1 F&B",
    cat: "Camping",
    price: 199.99,
    emoji: "⛺",
    desc: "Tienda hinchable Fresh & Black para 4 personas."
  },
  {
    name: "Mueble cocina Quechua",
    cat: "Camping",
    price: 59.99,
    emoji: "🗄️",
    desc: "Mueble plegable para camping."
  },
  {
    name: "Mesa + 4 taburetes",
    cat: "Camping",
    price: 39.99,
    emoji: "🪑",
    desc: "Mesa plegable tipo maletín."
  },
  {
    name: "Colchón Air Comfort 140",
    cat: "Camping",
    price: 34.99,
    emoji: "🛏️",
    desc: "Colchón hinchable 140×200 cm."
  },
  {
    name: "Lona impermeable 3×4",
    cat: "Camping",
    price: 12.99,
    emoji: "⬛",
    desc: "Lona de protección impermeable."
  },
  {
    name: "Martillo Quechua",
    cat: "Camping",
    price: 14.99,
    emoji: "🔨",
    desc: "Martillo con extractor de piquetas."
  },
  {
    name: "Hornillo Kemper 2200W",
    cat: "Camping",
    price: 22.95,
    emoji: "🔥",
    desc: "Hornillo portátil de un fogón."
  }
];

const grid = document.getElementById("grid");
const search = document.getElementById("search");

function guardar() {
  localStorage.setItem(DB, JSON.stringify(items));
}

function render() {
  const texto = search.value.toLowerCase();

  grid.innerHTML = "";

  items
    .filter(p => p.name.toLowerCase().includes(texto))
    .forEach(p => {

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <div class="img">${p.emoji}</div>
        <div class="info">
          <b>${p.name}</b>
          <div>${p.cat}</div>
          <div class="price">${p.price.toFixed(2)} €</div>
        </div>
      `;

      card.onclick = () => {
        alert(
          `${p.name}\n\n${p.desc}\n\nPrecio: ${p.price.toFixed(2)} €`
        );
      };

      grid.appendChild(card);

    });
}

search.addEventListener("input", render);

render();
