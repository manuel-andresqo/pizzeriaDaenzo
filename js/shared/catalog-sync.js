/* =========================================================
   CATÁLOGO — cambios del panel aplicados a la web (demo)
   El panel guarda precio, descripción y disponibilidad en la capa de
   datos compartida (DaEnzoDB.overrides). Aquí se aplican sobre el
   catálogo de menu-data.js antes de que la web lo use, y se vuelven a
   aplicar si el panel los cambia mientras la web está abierta
   (solo en el mismo navegador: con backend vendrían del servidor).
   ========================================================= */
(function(){
  var M = window.DAENZO_MENU, DB = window.DaEnzoDB; if (!M || !DB) return;
  var orig = {}; M.products.forEach(function(p){ orig[p.id] = { price: p.price, short: p.short, description: p.description }; });
  var last = '';
  function apply(ov){
    var sig = JSON.stringify(ov || {}); if (sig === last) return false; last = sig;
    M.products.forEach(function(p){
      var o = (ov || {})[p.id] || {}, b = orig[p.id];
      p.price = typeof o.price === 'number' ? o.price : b.price;
      p.short = typeof o.short === 'string' ? o.short : b.short;
      p.description = typeof o.description === 'string' ? o.description : b.description;
      p.available = o.available !== false;
    });
    return true;
  }
  apply(DB.peek().overrides);
  DB.subscribe(function(d){ if (apply(d.overrides)) document.dispatchEvent(new CustomEvent('daenzo:catalog')); });
})();
