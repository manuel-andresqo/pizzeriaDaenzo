/* =========================================================
   IDENTIFICACIÓN DE MESA (preparado para QR / NFC)
   Cada mesa tendrá un QR o etiqueta NFC que abrirá una URL como
     index.html?mesa=12   o   index.html#ordenar?mesa=12
   Aquí solo se lee y se valida el FORMATO. No existe registro de mesas:
   el número se muestra como «sin verificar (demo)» y nunca se da por
   registrado. Con backend, conectar DAENZO_MENU.tables.registry.
   Se guarda en sessionStorage (dura lo que la pestaña).
   ========================================================= */
(function(){
  var O = window.DaEnzoOrder, T = window.DAENZO_MENU.tables, KEY = 'daenzo.table';

  function fromUrl(){
    var q = new URLSearchParams(location.search).get(T.param);
    if (!q && location.hash.indexOf('?') >= 0) q = new URLSearchParams(location.hash.split('?')[1]).get(T.param);
    return q;
  }
  function validate(id){
    if (id == null) return null;
    id = String(id).trim();
    if (!T.pattern.test(id) || +id < 1) return null;
    var verified = false;
    if (Array.isArray(T.registry)) { if (T.registry.indexOf(id) < 0) return null; verified = true; }
    return { id: id, verified: verified };
  }

  var table = validate(fromUrl());
  if (table){ try { sessionStorage.setItem(KEY, JSON.stringify(table)); } catch(e){} }
  else { try { table = validate((JSON.parse(sessionStorage.getItem(KEY) || 'null') || {}).id); } catch(e){ table = null; } }

  O.table = {
    get: function(){ return table; },
    label: function(){ return table ? 'Mesa ' + table.id + (table.verified ? '' : ' · demo') : 'Mesa sin asignar · demo'; }
  };
})();
