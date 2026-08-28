
const settings=JSON.parse(localStorage.getItem('inv-settings')||'{"theme":"light"}');
if(settings.theme==='dark')document.body.classList.add('dark');
let view='home';
const items=[{n:'Tienda Airseconds',c:'Camping',e:'⛺',p:199.99},{n:'Mueble cocina',c:'Camping',e:'🗄️',p:59.99},{n:'Mesa + 4',c:'Camping',e:'🪑',p:39.99}];
const app=document.getElementById('app');
function render(){
 if(view==='settings'){app.innerHTML=`<header><h1>⚙️ Ajustes</h1></header><div class=settings>
 <div class=row><div><b>Tema</b><div>${settings.theme==='dark'?'Oscuro':'Claro'}</div></div><button id=theme>${settings.theme==='dark'?'🌙':'☀️'}</button></div>
 <div class=row><div><b>Copia de seguridad</b><div>Próximamente</div></div></div>
 <div class=row><div><b>Versión</b><div>V3 Preview</div></div></div></div>`;theme.onclick=()=>{settings.theme=settings.theme==='dark'?'light':'dark';localStorage.setItem('inv-settings',JSON.stringify(settings));location.reload()};}
 else{app.innerHTML=`<header><h1>📦 Inventario</h1><input class=search placeholder='Buscar...'></header><div class=cats><div class='chip on'>Camping</div><div class=chip>Pesca</div><div class=chip>Tecnología</div></div><div class=grid>${items.map(i=>`<div class=card><div class=img>${i.e}</div><div class=info><b>${i.n}</b><div>${i.c}</div><div class=price>${i.p.toFixed(2)} €</div></div></div>`).join('')}</div><button class=fab>+</button>`;}
 document.body.querySelector('.bar')?.remove();const bar=document.createElement('div');bar.className='bar';bar.innerHTML=`<button id=h>🏠<br>Inicio</button><button id=s>⚙️<br>Ajustes</button>`;document.body.appendChild(bar);h.onclick=()=>{view='home';render()};s.onclick=()=>{view='settings';render()};}
render();
