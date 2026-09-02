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
    body: JSON.stringify({
      action: "saveInventory",
      products
    })
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }
}

async function loadDB() {
  const res = await fetch(API);

  if (!res.ok) {
    products = [];
    return;
  }

  products = await res.json();
}

async function uploadImage(file) {
  const base64 = await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  });

  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "uploadImage",
      name: file.name,
      image: base64
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Error al subir la imagen");
  }

  return data.url;
}

async function deleteImage(url) {

  const nombre = decodeURIComponent(
    url.split("/images/")[1]
  );

  await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "deleteImage",
      name: nombre
    })
  });
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

${
  (p.fields && p.fields.length)
    ? `
      <div class="customFields">
        ${p.fields.map(f => `
          <div class="fieldRow">
            <div class="fieldName">${f.name}</div>
            <div class="fieldValue">${f.value}</div>
          </div>
        `).join("")}
      </div>
    `
    : ""
}

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
  if (e.target === bg) {
    bg.remove();
  }
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
  gallery: [],
  fields: []
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

    <label>Campos personalizados</label>

<div id="fieldsContainer"></div>

<button type="button" class="btn sec" id="addField" style="margin:10px 0">
  + Añadir campo
</button>

<label>Fotos</label>
<input id="ePhotos" type="file" accept="image/*" multiple>

<div id="galleryPreview" class="gallery"></div>
<div id="cropper" class="cropper" style="display:none">
  <canvas id="cropCanvas"></canvas>
 <div class="row" style="margin-top:12px">
  <button class="btn sec" id="rotateBtn">↻ Girar</button>
  <button class="btn sec" id="bgBtn">🖼 Fondo</button>
</div>

 <div id="bgPanel" style="display:none;margin-top:10px">
  <div class="row" style="align-items:center">
    <button class="colorPreset" data-color="#FFFFFF" style="background:#FFFFFF;width:34px;height:34px;border-radius:50%;border:1px solid #888"></button>

    <button class="colorPreset" data-color="#F5F1E8" style="background:#F5F1E8;width:34px;height:34px;border-radius:50%;border:1px solid #888"></button>

    <button class="colorPreset" data-color="#1F2937" style="background:#1F2937;width:34px;height:34px;border-radius:50%;border:1px solid #888"></button>

    <input type="color" id="customColor" value="#ffffff" style="width:42px;height:34px;padding:0;border:none;background:none">
  </div>
</div>

<div class="row" style="margin-top:12px">
  <button class="btn sec" id="cancelCrop">Cancelar</button>
  <button class="btn pri" id="useCrop">Usar</button>
</div>
</div>

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
  const fieldsContainer = bg.querySelector("#fieldsContainer");
  const addFieldBtn = bg.querySelector("#addField");
  const btnSave = bg.querySelector("#save");
  const btnCancel = bg.querySelector("#cancel");

 let gallery = [p.photo, ...(p.gallery || [])].filter(Boolean);
  let newFiles = [];
  let fields = [...(p.fields || [])];

  function drawFields() {

  fieldsContainer.innerHTML = "";

  fields.forEach((field, i) => {

    const div = document.createElement("div");

    div.className = "row";

    div.style.marginBottom = "8px";

    div.innerHTML = `
      <input class="fName" placeholder="Campo" value="${field.name}" style="flex:1">
      <input class="fValue" placeholder="Valor" value="${field.value}" style="flex:1">
      <button class="btn sec remove">✕</button>
    `;

    div.querySelector(".fName").oninput = e => fields[i].name = e.target.value;
    div.querySelector(".fValue").oninput = e => fields[i].value = e.target.value;

    div.querySelector(".remove").onclick = () => {
      fields.splice(i,1);
      drawFields();
    };

    fieldsContainer.appendChild(div);

  });

}
  
const drawPreview = () => {

  preview.innerHTML = "";

  const fotos = [
  ...gallery.map(item => ({
    file: item instanceof File ? item : null,
    url: item instanceof File ? URL.createObjectURL(item) : item,
    existing: true
  })),
  ...newFiles.map(file => ({
    file,
    url: URL.createObjectURL(file),
    existing: false
  }))
];

  fotos.forEach((foto, i) => {

    const card = document.createElement("div");
    card.className = "photoCard";

    card.innerHTML = `
      <img src="${foto.url}">
      <button class="editPhoto">✏️</button>
      <button class="deletePhoto">🗑️</button>
    `;

    // BORRAR
    card.querySelector(".deletePhoto").onclick = () => {

    if (foto.existing) {
  const item = gallery[i];

  if (item instanceof File) {
    newFiles = newFiles.filter(f => f !== item);
  }

  gallery.splice(i, 1);
} else {
  newFiles.splice(i - gallery.length, 1);
}

      drawPreview();
    };

    // EDITAR
    card.querySelector(".editPhoto").onclick = () => {
      openCropper(i, foto);
    };

    preview.appendChild(card);

  });

};
  
function openCropper(index, foto){

  let backgroundColor = null; // null = transparente
  const cropBox = bg.querySelector("#cropper");
  const canvas = bg.querySelector("#cropCanvas");
  canvas.style.touchAction = "none";
  const ctx = canvas.getContext("2d");

const bgBtn = bg.querySelector("#bgBtn");
const bgPanel = bg.querySelector("#bgPanel");
const customColor = bg.querySelector("#customColor");
const rotateBtn = bg.querySelector("#rotateBtn");
const cancelCrop = bg.querySelector("#cancelCrop");
const useCrop = bg.querySelector("#useCrop");
const img = new Image();

let scale = 1;
let rotation = 0;
let imgX = 0;
let imgY = 0;

  canvas.width = 340;
  canvas.height = 420;

  const crop = {
    x:30,
    y:50,
    w:280,
    h:280
  };

  const HANDLE = 18;

  img.onload = () => {

  // ABRIR
  cropBox.style.display = "flex";
  cropBox.classList.add("show");

  scale = Math.min(
    crop.w / img.width,
    crop.h / img.height
  );

  imgX = canvas.width / 2;
  imgY = canvas.height / 2;

  draw();
};

  img.src = foto.url;

  function draw(){

    ctx.clearRect(0,0,340,420);

    ctx.fillStyle = backgroundColor || "#111";
    ctx.fillRect(0,0,340,420);

    ctx.save();

    ctx.translate(imgX,imgY);
    ctx.rotate(rotation*Math.PI/180);
    ctx.scale(scale,scale);

    ctx.drawImage(img,-img.width/2,-img.height/2);

    ctx.restore();

    ctx.fillStyle="rgba(0,0,0,.55)";
    ctx.fillRect(0,0,340,crop.y);
    ctx.fillRect(0,crop.y,crop.x,crop.h);
    ctx.fillRect(crop.x+crop.w,crop.y,340,crop.h);
    ctx.fillRect(0,crop.y+crop.h,340,420);

    ctx.strokeStyle="#fff";
    ctx.lineWidth=2;
    ctx.strokeRect(crop.x,crop.y,crop.w,crop.h);

    // Esquinas
    drawHandle(crop.x, crop.y);
    drawHandle(crop.x + crop.w, crop.y);
    drawHandle(crop.x, crop.y + crop.h);
    drawHandle(crop.x + crop.w, crop.y + crop.h);

    // Laterales
    drawHandle(crop.x + crop.w/2, crop.y);
    drawHandle(crop.x + crop.w/2, crop.y + crop.h);
    drawHandle(crop.x, crop.y + crop.h/2);
    drawHandle(crop.x + crop.w, crop.y + crop.h/2);
  }

  function drawHandle(x,y){
    ctx.fillStyle="#fff";
    ctx.beginPath();
    ctx.arc(x,y,6,0,Math.PI*2);
    ctx.fill();
  }

  function dist(ax,ay,bx,by){
    return Math.hypot(ax-bx, ay-by);
  }

  let mode = null;
  let start = {};

  canvas.onpointerdown = e => {

    const r = canvas.getBoundingClientRect();
    const x = (e.clientX-r.left)*(340/r.width);
    const y = (e.clientY-r.top)*(420/r.height);

    start = {x,y,crop:{...crop}};

    const mx = crop.x + crop.w/2;
    const my = crop.y + crop.h/2;

    if (dist(x,y,crop.x,crop.y)<HANDLE) mode="tl";
    else if (dist(x,y,crop.x+crop.w,crop.y)<HANDLE) mode="tr";
    else if (dist(x,y,crop.x,crop.y+crop.h)<HANDLE) mode="bl";
    else if (dist(x,y,crop.x+crop.w,crop.y+crop.h)<HANDLE) mode="br";
    else if (dist(x,y,mx,crop.y)<HANDLE) mode="top";
    else if (dist(x,y,mx,crop.y+crop.h)<HANDLE) mode="bottom";
    else if (dist(x,y,crop.x,my)<HANDLE) mode="left";
    else if (dist(x,y,crop.x+crop.w,my)<HANDLE) mode="right";
    else if (x>crop.x && x<crop.x+crop.w && y>crop.y && y<crop.y+crop.h) mode="move";

    if(mode) canvas.setPointerCapture(e.pointerId);
  };

  canvas.onpointermove = e => {

    if(!mode) return;

    const r = canvas.getBoundingClientRect();
    const x = (e.clientX-r.left)*(340/r.width);
    const y = (e.clientY-r.top)*(420/r.height);

    const dx = x-start.x;
    const dy = y-start.y;

    if(mode==="move"){
      imgX += dx;
      imgY += dy;
      start.x = x;
      start.y = y;
    }

    if(mode==="tl"){
      crop.x=Math.min(start.crop.x+dx,start.crop.x+start.crop.w-60);
      crop.y=Math.min(start.crop.y+dy,start.crop.y+start.crop.h-60);
      crop.w=start.crop.w-(crop.x-start.crop.x);
      crop.h=start.crop.h-(crop.y-start.crop.y);
    }

    if(mode==="tr"){
      crop.y=Math.min(start.crop.y+dy,start.crop.y+start.crop.h-60);
      crop.w=Math.max(60,start.crop.w+dx);
      crop.h=start.crop.h-(crop.y-start.crop.y);
    }

    if(mode==="bl"){
      crop.x=Math.min(start.crop.x+dx,start.crop.x+start.crop.w-60);
      crop.w=start.crop.w-(crop.x-start.crop.x);
      crop.h=Math.max(60,start.crop.h+dy);
    }

    if(mode==="br"){
      crop.w=Math.max(60,start.crop.w+dx);
      crop.h=Math.max(60,start.crop.h+dy);
    }

    if(mode==="top"){
      crop.y=Math.min(start.crop.y+dy,start.crop.y+start.crop.h-60);
      crop.h=start.crop.h-(crop.y-start.crop.y);
    }

    if(mode==="bottom"){
      crop.h=Math.max(60,start.crop.h+dy);
    }

    if(mode==="left"){
      crop.x=Math.min(start.crop.x+dx,start.crop.x+start.crop.w-60);
      crop.w=start.crop.w-(crop.x-start.crop.x);
    }

    if(mode==="right"){
      crop.w=Math.max(60,start.crop.w+dx);
    }

    draw();
  };

canvas.onpointerup = e => {
  mode = null;

  try{
    if(canvas.hasPointerCapture(e.pointerId)){
      canvas.releasePointerCapture(e.pointerId);
    }
  }catch{}
};

canvas.onpointerleave = () => {
  mode = null;
};

canvas.onpointercancel = e => {
  mode = null;

  try{
    if(canvas.hasPointerCapture(e.pointerId)){
      canvas.releasePointerCapture(e.pointerId);
    }
  }catch{}
};

  canvas.onwheel = e => {
    e.preventDefault();
    scale *= e.deltaY>0 ? 0.95 : 1.05;
    draw();
  };

  let pinchStart = null;

canvas.ontouchstart = e => {
  if (e.touches.length === 2) {
    const a = e.touches[0];
    const b = e.touches[1];
    pinchStart = Math.hypot(
      a.clientX - b.clientX,
      a.clientY - b.clientY
    );
  }
};

canvas.ontouchmove = e => {
  if (e.touches.length !== 2 || !pinchStart) return;

  e.preventDefault();

  const a = e.touches[0];
  const b = e.touches[1];

  const d = Math.hypot(
    a.clientX - b.clientX,
    a.clientY - b.clientY
  );

  scale *= d / pinchStart;
  pinchStart = d;

  draw();
};

canvas.ontouchend = () => pinchStart = null;
canvas.ontouchcancel = () => pinchStart = null;

  rotateBtn.onclick = () => {
    rotation=(rotation+90)%360;
    draw();
  };

bgBtn.onclick = () => {
  bgPanel.style.display =
    bgPanel.style.display === "none" ? "block" : "none";
};

bg.querySelectorAll(".colorPreset").forEach(btn => {
  btn.onclick = () => {
    backgroundColor = btn.dataset.color;
    customColor.value = backgroundColor;
    draw();
  };
});

customColor.oninput = e => {
  backgroundColor = e.target.value;
  draw();
};
  
  cancelCrop.onclick = () => {
  cropBox.classList.remove("show");
  cropBox.style.display = "none";
};

  const applyCrop = () => {
  const out = document.createElement("canvas");
  const ratio = img.naturalWidth / (img.width * scale);

out.width = Math.round(crop.w * ratio);
out.height = Math.round(crop.h * ratio);

  const o = out.getContext("2d");

  const isPNG =
    foto.file?.type === "image/png" ||
    foto.url.toLowerCase().endsWith(".png");

  if (backgroundColor) {
  o.fillStyle = backgroundColor;
  o.fillRect(0, 0, out.width, out.height);
}

// 👇 AÑADE ESTA LÍNEA JUSTO AQUÍ
o.scale(ratio, ratio);

o.translate(-crop.x, -crop.y);
o.translate(imgX, imgY);
o.rotate(rotation * Math.PI / 180);
o.scale(scale, scale);

o.drawImage(img, -img.width / 2, -img.height / 2);

  out.toBlob((blob) => {
    if (!blob) {
      alert("Error al recortar");
      return;
    }

  const transparent = !backgroundColor;

const type = transparent ? "image/png" : "image/jpeg";
const ext = transparent ? "png" : "jpg";

    const file = new File(
      [blob],
      `foto_${Date.now()}.${ext}`,
      { type }
    );

    if (foto.existing) gallery[index] = file;
    else newFiles[index - gallery.length] = file;

    cropBox.classList.remove("show");
    cropBox.style.display = "none";

    drawPreview();
  }, transparent ? "image/png" : "image/jpeg", 0.92);
};

// FORZAR QUE EL BOTÓN FUNCIONE
useCrop.type = "button";

useCrop.onclick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  applyCrop();
};

}
  
drawFields();
drawPreview();


addFieldBtn.onclick = () => {
  fields.push({ name: "", value: "" });
  drawFields();
};

ePhotos.onchange = () => {
  const files = [...ePhotos.files];
  newFiles.push(...files);
  drawPreview();
  ePhotos.value = "";
};

btnCancel.onclick = () => bg.remove();

btnSave.onclick = async () => {
  try {
    btnSave.disabled = true;
    btnSave.textContent = "Subiendo...";

  // Subir las fotos editadas y borrar las antiguas de GitHub
for (let i = 0; i < gallery.length; i++) {
  if (gallery[i] instanceof File) {
    const antigua = [p.photo, ...(p.gallery || [])][i];

    if (antigua) {
      await deleteImage(antigua);
    }

    gallery[i] = await uploadImage(gallery[i]);
  }
}

    // Subir las fotos nuevas
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
      gallery: allPhotos.slice(1),
      fields
    };

    if (editIndex >= 0) products[editIndex] = obj;
    else products.unshift(obj);

    await saveDB();
    bg.remove();
    drawProducts();

 } catch (err) {
  console.error(err);
  btnSave.disabled = false;
  btnSave.textContent = "Guardar";
  alert(err.message);
 }
};

bg.onclick = e => {
  const cropper = bg.querySelector("#cropper");

  if (cropper && cropper.classList.contains("show")) return;

  if (e.target === bg) {
    bg.remove();
  }
};

}
  
(async () => {
  await loadDB();
  render();
})();
