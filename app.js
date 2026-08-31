const GITHUB = {
  owner: "JoanAida",
  repo: "Inventario",
  branch: "main"
};

const API = "https://inventario-api.joanvalenzuelabusquets.workers.dev";

const CATS = ["Todos", "Camping", "Pesca", "Tecnología"];
let filter = "Todos";
let editIndex = -1;

let products = [];

const app = document.getElementById("app");

async function saveDB() {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ products })
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }
}

async function loadDB() {
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/${GITHUB.owner}/${GITHUB.repo}/${GITHUB.branch}/inventario.json?v=${Date.now()}`
    );

    products = res.ok ? await res.json() : [];

  } catch {
    products = [];
  }
}

async function uploadImage(file) {
  const fileName = file.name;

  const base64 = await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  });

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/images/${encodeURIComponent(fileName)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB.token}`,
        Accept: "application/vnd.github+json"
      },
      body: JSON.stringify({
        message: `Subir ${fileName}`,
        content: base64,
        branch: GITHUB.branch
      })
    }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error(data);
    throw new Error(data.message);
  }

  return `https://cdn.jsdelivr.net/gh/${GITHUB.owner}/${GITHUB.repo}@${GITHUB.branch}/images/${encodeURIComponent(fileName)}`;
}

async function deleteImage(url) {
  const path = url.split("/images/")[1];

  // Obtener el SHA del archivo
  const info = await fetch(
    `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/images/${path}?ref=${GITHUB.branch}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB.token}`,
        Accept: "application/vnd.github+json"
      }
    }
  ).then(r => r.json());

  // Eliminar el archivo
  await fetch(
    `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/images/${path}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${GITHUB.token}`,
        Accept: "application/vnd.github+json"
      },
      body: JSON.stringify({
        message: `Eliminar ${path}`,
        sha: info.sha,
        branch: GITHUB.branch
      })
    }
  );
}

function render() {
  app.innerHTML = `
    <header>
      <h1>Inventario</h1>
      <button class="gear" id="gear">⚙️</button>
    </header>

    <div class="search">
      <input id="search" placeholder="Buscar producto...">
    </div>

    <div class="cats" id="cats"></div>
    <div class="grid" id="grid"></div>

    <button class="fab" id="add">+</button>

<div class="overlay" id="settings">
  <div class="sheet">
    <h2>Ajustes</h2>

    <label>Apariencia</label>

    <div class="row">
  <button class="btn sec" id="dark">🌙 Oscuro</button>
  <button class="btn pri" id="light">☀️ Claro</button>
</div>

<button class="btn sec" id="closeSettings" style="margin-top:12px">
  Cerrar
</button>
  </div>
</div>
`;

  drawCategories();
  drawProducts();

  document.getElementById("search").oninput = drawProducts;
  add.onclick = () => openEditor();
  gear.onclick = () => settings.classList.add("show");

closeSettings.onclick = () => settings.classList.remove("show");

dark.onclick = () => {
  document.body.classList.remove("light");
};

light.onclick = () => {
  document.body.classList.add("light");
};

}

function drawCategories() {
  cats.innerHTML = "";

  CATS.forEach(c => {
    const chip = document.createElement("div");
    chip.className = "chip" + (filter === c ? " active" : "");
    chip.textContent = c;

    chip.onclick = () => {
      filter = c;
      drawCategories();
      drawProducts();
    };

    cats.appendChild(chip);
  });
}

function drawProducts() {
  grid.innerHTML = "";

  const txt = document
  .getElementById("search")
  .value.toLowerCase();

  products
    .filter(p =>
      (filter === "Todos" || p.cat === filter) &&
      p.name.toLowerCase().includes(txt)
    )
    .forEach(p => {
      const realIndex = products.indexOf(p);

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <div class="cover">
  ${p.photo ? `<img src="${p.photo}" style="width:100%;height:100%;object-fit:contain;padding:8px">` : p.emoji}
</div>
        <div class="info">
          <div class="name">${p.name}</div>
          <div class="muted">${p.cat}</div>
          <div>${p.price.toFixed(2)} €</div>
        </div>
      `;

      card.onclick = () => openViewer(realIndex);

      grid.appendChild(card);
    });
}

function openViewer(index) {
  const p = products[index];

  const bg = document.createElement("div");
  bg.className = "overlay show";

  bg.innerHTML = `
    <div class="sheet">
      <button id="closeView">✕</button>

<div class="carousel">
  <div class="track" id="track">
    ${
      [p.photo, ...(p.gallery || [])]
        .filter(Boolean)
        .map(img => `
          <div class="slide">
            <img src="${img}">
          </div>
        `).join("")
    }
  </div>

  <button class="nav prev" id="prev">‹</button>
  <button class="nav next" id="next">›</button>
</div>

      <h2>${p.name}</h2>
      <div class="muted">${p.cat}</div>
      <h3>${p.price.toFixed(2)} €</h3>

      <p>${p.desc || "Sin descripción"}</p>

      <div class="row" style="margin-top:20px">
        <button class="btn pri" id="edit">Editar</button>
        <button class="btn sec" id="del">Borrar</button>
      </div>
    </div>
  `;

  document.body.appendChild(bg);
  
  let current = 0;
const total = [p.photo, ...(p.gallery || [])].filter(Boolean).length;

function updateCarousel() {
  track.style.transform = `translateX(-${current * 100}%)`;
}

if (total > 1) {
  next.onclick = () => {
    current = Math.min(current + 1, total - 1);
    updateCarousel();
  };

  prev.onclick = () => {
    current = Math.max(current - 1, 0);
    updateCarousel();
  };
}

  closeView.onclick = () => bg.remove();

  edit.onclick = () => {
    bg.remove();
    openEditor(index);
  };

 del.onclick = async () => {
  if (!confirm("¿Borrar este producto?")) return;

  const fotos = [p.photo, ...(p.gallery || [])].filter(Boolean);

  try {
    for (const url of fotos) {
      await deleteImage(url);
    }

    products.splice(index, 1);
await saveDB();
bg.remove();
drawProducts();

  } catch (err) {
    console.error(err);
    alert("Error al borrar las fotos de GitHub");
  }
};

  bg.onclick = e => {
    if (e.target === bg) bg.remove();
  };
}

function openEditor(index = -1) {
  editIndex = index;

const p = index >= 0 ? products[index] : {
  name: "",
  cat: "Camping",
  price: "",
  desc: "",
  photo: "",
  gallery: []
};

  const bg = document.createElement("div");
  bg.className = "overlay show";

  bg.innerHTML = `
    <div class="sheet">
      <h2>${index >= 0 ? "Editar" : "Nuevo"} producto</h2>

      <label>Nombre</label>
      <input id="eName" value="${p.name}">

      <div class="row">
        <div style="flex:1">
          <label>Precio</label>
          <input id="ePrice" type="number" value="${p.price}">
        </div>

        <div style="flex:1">
          <label>Categoría</label>
          <select id="eCat">
            ${CATS.slice(1).map(c=>`<option ${c===p.cat?"selected":""}>${c}</option>`).join("")}
          </select>
        </div>
      </div>

      <label>Descripción</label>
      <textarea id="eDesc">${p.desc}</textarea>

      <label>Fotos</label>
      <input id="ePhotos" type="file" accept="image/*" multiple>

      <div id="galleryPreview" class="gallery"></div>

      <div class="row" style="margin-top:18px">
        <button class="btn sec" id="cancel">Cancelar</button>
        <button class="btn pri" id="save">Guardar</button>
      </div>
    </div>
  `;

  document.body.appendChild(bg);

  const eName = bg.querySelector("#eName");
  const ePrice = bg.querySelector("#ePrice");
  const eCat = bg.querySelector("#eCat");
  const eDesc = bg.querySelector("#eDesc");
  const ePhotos = bg.querySelector("#ePhotos");
  const preview = bg.querySelector("#galleryPreview");
  const btnSave = bg.querySelector("#save");
  const btnCancel = bg.querySelector("#cancel");

  let gallery = [...(p.gallery || [])];
let newFiles = [];

const drawPreview = () => {
  preview.innerHTML = "";

  gallery.forEach(url => {
    preview.innerHTML += `<img src="${url}">`;
  });

  newFiles.forEach(file => {
    preview.innerHTML += `<img src="${URL.createObjectURL(file)}">`;
  });
};

drawPreview();

ePhotos.onchange = () => {
  newFiles = [...ePhotos.files];
  drawPreview();
};

  btnCancel.onclick = ()=>bg.remove();

btnSave.onclick = async () => {
  try {
    btnSave.disabled = true;
    btnSave.textContent = "Subiendo...";

    const uploaded = [];

    for (const file of newFiles) {
      uploaded.push(await uploadImage(file));
    }

    const allPhotos = [...gallery, ...uploaded];

    const obj = {
      name: eName.value,
      cat: eCat.value,
      price: Number(ePrice.value || 0),
      desc: eDesc.value,
      photo: allPhotos[0] || "",
      gallery: allPhotos.slice(1)
    };

    if (editIndex >= 0) products[editIndex] = obj;
else products.unshift(obj);

await saveDB();
bg.remove();
drawProducts();
alert("Guardado");

  } 
  catch (err) {
    console.error(err);
    alert(err.message);
  }
};

  bg.onclick=e=>{
    if(e.target===bg) bg.remove();
  };
}

(async () => {
  await loadDB();
  render();
})();
