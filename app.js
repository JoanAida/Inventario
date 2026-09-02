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

  const cropBox = bg.querySelector("#cropper");
  const canvas = bg.querySelector("#cropCanvas");
  const ctx = canvas.getContext("2d");

  const rotateBtn = bg.querySelector("#rotateBtn");
  const cancelCrop = bg.querySelector("#cancelCrop");
  const useCrop = bg.querySelector("#useCrop");

  const img = new Image();

  const FRAME = 280;

  let scale = 1;
  let rotation = 0;
  let x = 0;
  let y = 0;

  let pointers = new Map();
  let startDist = 0;
  let startScale = 1;
  let lastX = 0;
  let lastY = 0;

  img.onload = () => {

    cropBox.style.display = "flex";

    const size = Math.min(window.innerWidth, 420);

    canvas.width = size;
    canvas.height = size + 70;

    scale = FRAME / Math.max(img.width, img.height);
    x = canvas.width / 2;
    y = FRAME / 2 + 20;

    draw();

  };

  img.src = foto.url;

  function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle = "#111";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.save();

    ctx.translate(x,y);
    ctx.rotate(rotation*Math.PI/180);
    ctx.scale(scale,scale);

    ctx.drawImage(img,-img.width/2,-img.height/2);

    ctx.restore();

    const fx=(canvas.width-FRAME)/2;
    const fy=20;

    ctx.fillStyle="rgba(0,0,0,.55)";
    ctx.fillRect(0,0,canvas.width,fy);
    ctx.fillRect(0,fy,fx,FRAME);
    ctx.fillRect(fx+FRAME,fy,canvas.width,FRAME);
    ctx.fillRect(0,fy+FRAME,canvas.width,canvas.height);

    ctx.strokeStyle="#fff";
    ctx.lineWidth=2;
    ctx.strokeRect(fx,fy,FRAME,FRAME);
  }

  function distance(a,b){
    return Math.hypot(a.x-b.x,a.y-b.y);
  }

  canvas.onpointerdown=e=>{
    canvas.setPointerCapture(e.pointerId);

    pointers.set(e.pointerId,{x:e.offsetX,y:e.offsetY});

    if(pointers.size===1){
      lastX=e.offsetX;
      lastY=e.offsetY;
    }

    if(pointers.size===2){
      const pts=[...pointers.values()];
      startDist=distance(pts[0],pts[1]);
      startScale=scale;
    }
  };

  canvas.onpointermove=e=>{

    if(!pointers.has(e.pointerId)) return;

    pointers.set(e.pointerId,{x:e.offsetX,y:e.offsetY});

    if(pointers.size===1){

      x+=e.offsetX-lastX;
      y+=e.offsetY-lastY;

      lastX=e.offsetX;
      lastY=e.offsetY;

      draw();
    }

    if(pointers.size===2){

      const pts=[...pointers.values()];
      const d=distance(pts[0],pts[1]);

      scale=startScale*(d/startDist);
      scale=Math.max(0.2,Math.min(scale,5));

      draw();
    }
  };

  function endPointer(e){
    pointers.delete(e.pointerId);

    if(pointers.size===1){
      const p=[...pointers.values()][0];
      lastX=p.x;
      lastY=p.y;
    }
  }

  canvas.onpointerup=endPointer;
  canvas.onpointercancel=endPointer;

  canvas.onwheel=e=>{
    e.preventDefault();

    scale*=e.deltaY>0?0.95:1.05;
    scale=Math.max(0.2,Math.min(scale,5));

    draw();
  };

  rotateBtn.onclick=()=>{
    rotation=(rotation+90)%360;
    draw();
  };

  cancelCrop.onclick=()=>{
    cropBox.style.display="none";
  };

  useCrop.onclick=()=>{

    const out=document.createElement("canvas");
    out.width=FRAME;
    out.height=FRAME;

    const o=out.getContext("2d");

    o.translate(FRAME/2,FRAME/2);
    o.rotate(rotation*Math.PI/180);
    o.scale(scale,scale);

    const fx=(canvas.width-FRAME)/2;
    const fy=20;

    o.drawImage(
      img,
      -(x-fx-FRAME/2)/scale-img.width/2,
      -(y-fy-FRAME/2)/scale-img.height/2
    );

    const esPNG=foto.file?.type==="image/png" || foto.url.endsWith(".png");
    const mime=esPNG?"image/png":"image/jpeg";
    const ext=esPNG?"png":"jpg";

    out.toBlob(blob=>{

      const file=new File(
        [blob],
        `foto_${Date.now()}.${ext}`,
        {type:mime}
      );

      if(foto.existing){
        gallery[index]=file;
      }else{
        newFiles[index-gallery.length]=file;
      }

      cropBox.style.display="none";
      drawPreview();

    },mime,esPNG?undefined:0.92);

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
  if (e.target === bg) bg.remove();
};

}
  
(async () => {
  await loadDB();
  render();
})();
