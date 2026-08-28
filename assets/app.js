
const DB='inv31';const SET='inv31set';
let settings=JSON.parse(localStorage.getItem(SET)||'{"theme":"dark"}');
let items=JSON.parse(localStorage.getItem(DB)||'null')||[
 {name:"Tienda Airseconds",cat:"Camping",price:199.99,emoji:"⛺",desc:"",imgs:[]},
 {name:"Mueble cocina",cat:"Camping",price:59.99,emoji:"🗄️",desc:"",imgs:[]},
 {name:"Mesa + 4",cat:"Camping",price:39.99,emoji:"🪑",desc:"",imgs:[]}
];
let view='home',filter='Todos',current=-1;
const cats=['Todos','Camping','Pesca','Tecnología'];
const app=document.getElementById('app');
function save(){localStorage.setItem(DB,JSON.stringify(items))}
function render(){
 if(view==='settings'){
 app.innerHTML=`<header><h1>⚙️ Ajustes</h1></header><div class=row><div><b>Tema</b><div>${settings.theme}</div></div><button id=th>🌙</button></div><div class=row><div><b>Versión</b><div>3.1</div></div></div>`;
 document.getElementById('th').onclick=()=>alert('El tema oscuro ya está activo');
 } else {
 app.innerHTML=`<header><h1>📦 Inventario</h1><input id=q class=search placeholder='Buscar...'></header><div id=cats class=cats></div><div id=grid class=grid></div><button id=add class=fab>+</button><input id=file type=file accept='image/*' hidden><div id=sheet class=sheet><div class=panel><button id=close>✕</button><div id=hero class=hero></div><h2 id=title></h2><div id=price></div><textarea id=desc style="width:100%;background:#323640;color:white;border:none;border-radius:10px;padding:10px"></textarea><div id=gal class=gallery></div><button id=addp>Añadir foto</button><button id=savep>Guardar</button><input id=pick type=file accept='image/*' multiple hidden></div></div>`;
 const ce=document.getElementById('cats');cats.forEach(c=>{const d=document.createElement('div');d.className='chip'+(c===filter?' on':'');d.textContent=c;d.onclick=()=>{filter=c;render()};ce.appendChild(d)});
 const grid=document.getElementById('grid');
 const draw=()=>{const q=document.getElementById('q').value.toLowerCase();grid.innerHTML='';items.filter(i=>(filter==='Todos'||i.cat===filter)&&i.name.toLowerCase().includes(q)).forEach((it,idx)=>{const c=document.createElement('div');c.className='card';c.innerHTML=`<div class=thumb>${it.imgs[0]?`<img src="${it.imgs[0]}">`:it.emoji}</div><div class=info><b>${it.name}</b><div>${it.cat}</div><div class=price>${it.price.toFixed(2)} €</div></div>`;c.onclick=()=>open(items.indexOf(it));grid.appendChild(c)})};
 document.getElementById('q').oninput=draw;draw();
 document.getElementById('add').onclick=()=>document.getElementById('file').click();
 document.getElementById('file').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=x=>{items.unshift({name:f.name.replace(/\.[^.]+$/,''),cat:'Camping',price:0,emoji:'📦',desc:'',imgs:[x.target.result]});save();render()};r.readAsDataURL(f)};
 }
 app.insertAdjacentHTML('beforeend',`<div class=bar><button id=home>🏠</button><button id=settings>⚙️</button></div>`);
 document.getElementById('home').onclick=()=>{view='home';render()};
 document.getElementById('settings').onclick=()=>{view='settings';render()};
}
function open(i){current=i;const p=items[i];sheet.style.display='flex';hero.innerHTML=p.imgs[0]?`<img src="${p.imgs[0]}" style="width:100%;height:100%;object-fit:cover;border-radius:18px">`:p.emoji;title.textContent=p.name;price.textContent=p.price.toFixed(2)+' €';desc.value=p.desc;drawGal();close.onclick=()=>sheet.style.display='none';addp.onclick=()=>pick.click();pick.onchange=e=>{[...e.target.files].forEach(f=>{const r=new FileReader();r.onload=x=>{p.imgs.push(x.target.result);save();drawGal();render()};r.readAsDataURL(f)})};savep.onclick=()=>{p.desc=desc.value;save();sheet.style.display='none';render()}}
function drawGal(){gal.innerHTML='';items[current].imgs.forEach((s,idx)=>{const w=document.createElement('div');w.innerHTML=`<img src="${s}"><button>🗑️</button>`;w.querySelector('button').onclick=()=>{items[current].imgs.splice(idx,1);save();drawGal();render()};gal.appendChild(w)})}
render();
