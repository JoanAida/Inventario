const WORKER_URL = "https://inventario-api.paco-cf.workers.dev";
let items = [];
let categories = [];
let activeCat = "Todas";
let currentSlide = 0;
let editIndex = -1;

const colModes = ["auto", "1", "2", "3", "4", "5"];
let colIndex = colModes.indexOf(localStorage.getItem("inv_cols") || "auto");
if (colIndex === -1) colIndex = 0;

let cropState = {
  img: null,
  canvas: null,
  ctx: null,
  rotation: 0,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  startX: 0,
  startY: 0,
  onDone: null
};

document.addEventListener("DOMContentLoaded", () => {
  initUI();
  applyColMode();
  loadData();
});

function initUI() {
  const isLight = localStorage.getItem("inv_theme") === "light";
  if (isLight) document.body.classList.add("light");

  const app = document.getElementById("app");
  app.innerHTML = `
    <header>
      <h1>Inventario</h1>
      <div class="header-actions">
        <button class="cols-btn" id="colsBtn" onclick="toggleCols()"></button>
        <button class="gear" onclick="openSettings()">⚙️</button>
      </div>
    </header>

    <div class="search">
      <input type="text" id="searchInput" placeholder="Buscar por nombre, nota o campo..." oninput="renderGrid()">
    </div>

    <div class="cats" id="catsBar"></div>
    <div class="grid" id="grid"></div>

    <button class="fab" onclick="openForm()">+</button>

    <div class="overlay" id="formOverlay">
      <div class="sheet">
        <h2 id="formTitle" style="margin-top:0">Nuevo Producto</h2>
        
        <label>Nombre</label>
        <input type="text" id="fName" placeholder="Ej. Tienda de campaña">

        <label>Categoría</label>
        <select id="fCat"></select>

        <label>Notas / Descripción</label>
        <textarea id="fNotes" placeholder="Detalles, estado, ubicación..."></textarea>

        <label>Imágenes (puedes subir varias)</label>
        <input type="file" id="fPhotos" multiple accept="image/*" onchange="handlePhotosSelect(event)">
        <div class="gallery" id="fGallery"></div>

        <div id="fCustomFields"></div>
        <button class="btn sec" style="margin-top:10px; width:100%" onclick="addCustomFieldRow()">+ Añadir campo personalizado</button>

        <div class="row" style="margin-top:20px">
          <button class="btn sec" onclick="closeForm()">Cancelar</button>
          <button class="btn pri" onclick="saveProduct()">Guardar</button>
        </div>
      </div>
    </div>

    <div class="overlay" id="viewerOverlay">
      <div class="sheet">
        <div class="carousel" id="vCarousel">
          <div class="track" id="vTrack"></div>
          <button class="nav prev" onclick="prevSlide()">‹</button>
          <button class="nav next" onclick="nextSlide()">›</button>
        </div>
        
        <h2 id="vName" style="margin:0 0 6px 0"></h2>
        <div id="vCat" class="muted" style="margin-bottom:12px"></div>
        <div id="vNotes" style="white-space:pre-line; margin-bottom:16px"></div>
        
        <div class="customFields" id="vCustomFields"></div>

        <div class="row" style="margin-top:20px">
          <button class="btn sec" onclick="closeViewer()">Cerrar</button>
          <button class="btn sec" onclick="editCurrentProduct()">Editar</button>
          <button class="btn sec" style="color:#ef4444" onclick="deleteCurrentProduct()">Borrar</button>
        </div>
      </div>
    </div>

    <div class="overlay" id="settingsOverlay">
      <div class="sheet">
        <h2 style="margin-top:0">Ajustes</h2>
        
        <label>Tema de color</label>
        <div class="row">
          <button class="btn sec" onclick="setTheme('dark')">🌙 Oscuro</button>
          <button class="btn sec" onclick="setTheme('light')">☀️ Claro</button>
        </div>

        <label>Categorías (separadas por coma)</label>
        <input type="text" id="sCats">

        <div class="row" style="margin-top:20px">
          <button class="btn sec" onclick="closeSettings()">Cancelar</button>
          <button class="btn pri" onclick="saveSettings()">Guardar Ajustes</button>
        </div>
      </div>
    </div>

    <div class="cropper" id="cropperOverlay">
      <canvas id="cropCanvas"></canvas>
      <div class="row" style="margin-top:14px; gap:8px">
        <button class="btn sec" id="rotateBtn" onclick="rotateCropper()">🔄 Rotar</button>
        <button class="btn sec" id="cancelCrop" onclick="closeCropper()">Cancelar</button>
        <button class="btn pri" id="useCrop" onclick="confirmCrop()">Aceptar</button>
      </div>
    </div>
  `;
}

function toggleCols() {
  colIndex = (colIndex + 1) % colModes.length;
  const mode = colModes[colIndex];
  localStorage.setItem("inv_cols", mode);
  applyColMode();
}

function applyColMode() {
  const mode = colModes[colIndex];
  const btn = document.getElementById("colsBtn");
  const root = document.documentElement;

  if (btn) {
    btn.textContent = mode === "auto" ? "📐 Auto" : `📐 ${mode} col`;
  }

  if (mode === "auto") {
    root.style.setProperty("--cols", "auto-fill");
    root.style.setProperty("--min-col-width", "140px");
  } else {
    root.style.setProperty("--cols", mode);
    root.style.setProperty("--min-col-width", "0px");
  }
}

function setTheme(theme) {
  if (theme === "light") {
    document.body.classList.add("light");
    localStorage.setItem("inv_theme", "light");
  } else {
    document.body.classList.remove("light");
    localStorage.setItem("inv_theme", "dark");
  }
  closeSettings();
}

async function loadData() {
  try {
    const res = await fetch(`${WORKER_URL}/get`);
    const data = await res.json();
    items = data.items || [];
    categories = data.categories || ["General", "Camping", "Pesca", "Tecnología"];
    renderCats();
    renderGrid();
  } catch (e) {
    console.error("Error cargando datos:", e);
  }
}

function renderCats() {
  const bar = document.getElementById("catsBar");
  const list = ["Todas", ...categories];
  bar.innerHTML = list.map(c => `
    <div class="chip ${c === activeCat ? 'active' : ''}" onclick="selectCat('${c}')">${c}</div>
  `).join("");
}

function selectCat(cat) {
  activeCat = cat;
  renderCats();
  renderGrid();
}

function renderGrid() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  const grid = document.getElementById("grid");
  
  const filtered = items.filter(item => {
    const matchCat = activeCat === "Todas" || item.category === activeCat;
    const matchQ = !q || 
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q)) ||
      (item.customFields && JSON.stringify(item.customFields).toLowerCase().includes(q));
    return matchCat && matchQ;
  });

  grid.innerHTML = filtered.map((item, idx) => {
    const originalIndex = items.indexOf(item);
    const coverImg = item.images && item.images.length > 0 ? 
      `<img src="${item.images[0]}" loading="lazy">` : `📦`;

    return `
      <div class="card" onclick="openViewer(${originalIndex})">
        <div class="cover">${coverImg}</div>
        <div class="info">
          <div class="name">${item.name || "Sin nombre"}</div>
          <div class="muted">${item.category || "General"}</div>
        </div>
      </div>
    `;
  }).join("");
}

function openForm(index = -1) {
  editIndex = index;
  document.getElementById("formTitle").textContent = index >= 0 ? "Editar Producto" : "Nuevo Producto";
  
  const selCat = document.getElementById("fCat");
  selCat.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join("");

  if (index >= 0) {
    const item = items[index];
    document.getElementById("fName").value = item.name || "";
    document.getElementById("fCat").value = item.category || categories[0];
    document.getElementById("fNotes").value = item.notes || "";
    renderFormGallery(item.images || []);
    renderCustomFieldInputs(item.customFields || []);
  } else {
    document.getElementById("fName").value = "";
    document.getElementById("fCat").value = categories[0] || "General";
    document.getElementById("fNotes").value = "";
    renderFormGallery([]);
    renderCustomFieldInputs([]);
  }

  document.getElementById("formOverlay").classList.add("show");
}

function closeForm() {
  document.getElementById("formOverlay").classList.remove("show");
}

let tempImages = [];

function renderFormGallery(imgs) {
  tempImages = [...imgs];
  const gal = document.getElementById("fGallery");
  gal.innerHTML = tempImages.map((src, i) => `
    <div style="position:relative; display:inline-block">
      <img src="${src}" style="width:70px; height:70px; object-fit:cover; border-radius:8px">
      <button onclick="removeTempImg(${i})" style="position:absolute; top:-6px; right:-6px; background:#ef4444; color:#fff; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer">×</button>
    </div>
  `).join("");
}

function removeTempImg(i) {
  tempImages.splice(i, 1);
  renderFormGallery(tempImages);
}

function handlePhotosSelect(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  let fileIndex = 0;
  function processNext() {
    if (fileIndex >= files.length) return;
    const file = files[fileIndex++];
    openCropper(file, base64 => {
      tempImages.push(base64);
      renderFormGallery(tempImages);
      processNext();
    });
  }
  processNext();
}

function renderCustomFieldInputs(fields) {
  const container = document.getElementById("fCustomFields");
  container.innerHTML = fields.map((f, i) => `
    <div class="row" style="margin-top:8px">
      <input type="text" placeholder="Nombre (ej. Precio)" value="${f.name || ''}" class="fKey">
      <input type="text" placeholder="Valor (ej. 25€)" value="${f.value || ''}" class="fVal">
      <button class="btn sec" style="width:44px; color:#ef4444" onclick="this.parentElement.remove()">×</button>
    </div>
  `).join("");
}

function addCustomFieldRow() {
  const container = document.getElementById("fCustomFields");
  const div = document.createElement("div");
  div.className = "row";
  div.style.marginTop = "8px";
  div.innerHTML = `
    <input type="text" placeholder="Nombre (ej. Precio)" class="fKey">
    <input type="text" placeholder="Valor (ej. 25€)" class="fVal">
    <button class="btn sec" style="width:44px; color:#ef4444" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(div);
}

async function saveProduct() {
  const name = document.getElementById("fName").value.trim();
  const category = document.getElementById("fCat").value;
  const notes = document.getElementById("fNotes").value.trim();

  const keys = Array.from(document.querySelectorAll(".fKey"));
  const vals = Array.from(document.querySelectorAll(".fVal"));
  const customFields = keys.map((k, i) => ({
    name: k.value.trim(),
    value: vals[i].value.trim()
  })).filter(f => f.name);

  const product = { name, category, notes, images: tempImages, customFields };

  if (editIndex >= 0) {
    items[editIndex] = product;
  } else {
    items.unshift(product);
  }

  closeForm();
  renderGrid();
  await syncWithWorker();
}

let activeViewerIndex = -1;

function openViewer(index) {
  activeViewerIndex = index;
  const item = items[index];
  currentSlide = 0;

  document.getElementById("vName").textContent = item.name || "Sin nombre";
  document.getElementById("vCat").textContent = item.category || "General";
  document.getElementById("vNotes").textContent = item.notes || "";

  const track = document.getElementById("vTrack");
  if (item.images && item.images.length > 0) {
    track.innerHTML = item.images.map(img => `
      <div class="slide"><img src="${img}"></div>
    `).join("");
  } else {
    track.innerHTML = `<div class="slide" style="font-size:80px">📦</div>`;
  }
  updateCarousel();

  const customFieldsDiv = document.getElementById("vCustomFields");
  if (item.customFields && item.customFields.length > 0) {
    customFieldsDiv.innerHTML = item.customFields.map(f => `
      <div class="fieldRow">
        <span class="fieldName">${f.name}</span>
        <span class="fieldValue">${f.value}</span>
      </div>
    `).join("");
  } else {
    customFieldsDiv.innerHTML = "";
  }

  document.getElementById("viewerOverlay").classList.add("show");
}

function closeViewer() {
  document.getElementById("viewerOverlay").classList.remove("show");
}

function updateCarousel() {
  const track = document.getElementById("vTrack");
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function prevSlide() {
  const item = items[activeViewerIndex];
  const total = item.images ? item.images.length : 1;
  currentSlide = (currentSlide - 1 + total) % total;
  updateCarousel();
}

function nextSlide() {
  const item = items[activeViewerIndex];
  const total = item.images ? item.images.length : 1;
  currentSlide = (currentSlide + 1) % total;
  updateCarousel();
}

function editCurrentProduct() {
  closeViewer();
  openForm(activeViewerIndex);
}

async function deleteCurrentProduct() {
  if (!confirm("¿Seguro que quieres borrar este producto?")) return;
  items.splice(activeViewerIndex, 1);
  closeViewer();
  renderGrid();
  await syncWithWorker();
}

function openSettings() {
  document.getElementById("sCats").value = categories.join(", ");
  document.getElementById("settingsOverlay").classList.add("show");
}

function closeSettings() {
  document.getElementById("settingsOverlay").classList.remove("show");
}

async function saveSettings() {
  const raw = document.getElementById("sCats").value;
  categories = raw.split(",").map(c => c.trim()).filter(Boolean);
  if (!categories.length) categories = ["General"];
  
  closeSettings();
  renderCats();
  renderGrid();
  await syncWithWorker();
}

async function syncWithWorker() {
  try {
    await fetch(`${WORKER_URL}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, categories })
    });
  } catch (e) {
    console.error("Error guardando datos:", e);
  }
}

/* RECORTADOR DE IMÁGENES */
function openCropper(file, onDone) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      cropState.img = img;
      cropState.rotation = 0;
      cropState.scale = 1;
      cropState.offsetX = 0;
      cropState.offsetY = 0;
      cropState.onDone = onDone;
      
      const overlay = document.getElementById("cropperOverlay");
      overlay.classList.add("show");
      
      cropState.canvas = document.getElementById("cropCanvas");
      cropState.ctx = cropState.canvas.getContext("2d");
      cropState.canvas.width = 320;
      cropState.canvas.height = 320;
      
      drawCropper();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function drawCropper() {
  const { ctx, canvas, img, rotation } = cropState;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  
  const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
  ctx.drawImage(img, - (img.width * scale) / 2, - (img.height * scale) / 2, img.width * scale, img.height * scale);
  ctx.restore();
}

function rotateCropper() {
  cropState.rotation = (cropState.rotation + 90) % 360;
  drawCropper();
}

function closeCropper() {
  document.getElementById("cropperOverlay").classList.remove("show");
}

function confirmCrop() {
  const canvas = cropState.canvas;
  const base64 = canvas.toDataURL("image/jpeg", 0.85);
  closeCropper();
  if (cropState.onDone) cropState.onDone(base64);
}
