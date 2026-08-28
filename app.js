const K='inventario-db';let items=JSON.parse(localStorage.getItem(K)||'null')||[
{name:'Tienda Airseconds 4.1',cat:'Camping',price:199.99,e:'⛺'},
{name:'Mueble cocina Quechua',cat:'Camping',price:59.99,e:'🗄️'},
{name:'Mesa + 4 taburetes',cat:'Camping',price:39.99,e:'🪑'}];
const g=document.getElementById('grid');function saveDB(){localStorage.setItem(K,JSON.stringify(items))}
function render(){const q=document.getElementById('q').value.toLowerCase();g.innerHTML=items.filter(i=>i.name.toLowerCase().includes(q)).map(i=>`<div class=card><div class=e>${i.e||'📦'}</div><b>${i.name}</b><div>${i.cat}</div><div style='color:#0f766e'>${i.price.toFixed(2).replace('.',',')} €</div></div>`).join('')}
q.oninput=render;add.onclick=()=>dlg.showModal();save.onclick=e=>{e.preventDefault();items.unshift({name:n.value,cat:c.value,price:Number(p.value)||0,e:'📦'});saveDB();dlg.close();n.value=p.value='';render()};render();