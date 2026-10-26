/* =========================================================
   CARRITO — lógica pura (sin interfaz)
   · Importes en céntimos enteros: sin errores de redondeo.
   · Una línea = producto + variante + extras. Personalizaciones
     distintas nunca se mezclan; idénticas se suman.
   · Persistencia local (localStorage 'daenzo.cart.v1'): solo ids y
     cantidades, ningún dato personal. Al restaurar se valida contra
     el catálogo (productos, variantes o extras que ya no existan se descartan).
   · Estados: 'draft' (en preparación) → 'reviewed' (revisado) →
     'confirmed' (confirmación DE DEMOSTRACIÓN, no enviada a ningún sistema).
   ========================================================= */
(function(){
  var M = window.DAENZO_MENU;
  var O = window.DaEnzoOrder = window.DaEnzoOrder || {};
  var KEY = 'daenzo.cart.v1', MAX_QTY = 20;

  var byId = {};
  M.products.forEach(function(p){ byId[p.id] = p; });

  /* ---------- Dinero ---------- */
  O.money = function(cents){
    var neg = cents < 0; cents = Math.abs(Math.round(cents));
    var s = Math.floor(cents / 100).toLocaleString('es-VE') + ',' + String(cents % 100).padStart(2, '0');
    return (neg ? '−' : '') + '$' + s;
  };
  O.product = function(id){ return byId[id]; };
  O.variantOf = function(p, vid){ var v = p.variants || []; return v.filter(function(x){ return x.id === vid; })[0] || v[0] || null; };

  /* Precio unitario de una configuración */
  O.unitPrice = function(productId, variantId, extras){
    var p = byId[productId]; if (!p) return 0;
    var v = O.variantOf(p, variantId);
    var x = (extras || []).reduce(function(sum, e){ var d = M.extras[e]; return sum + (d ? d.price : 0); }, 0);
    return p.price + (v ? v.delta : 0) + x;
  };
  function keyOf(pid, vid, extras){ return pid + '|' + (vid || '') + '|' + (extras || []).slice().sort().join(','); }

  /* ---------- Estado ---------- */
  var state = { lines: [], stage: 'draft', confirmedAt: null, changedAfterConfirm: false };
  var listeners = [];

  function sanitize(raw){
    var out = { lines: [], stage: 'draft', confirmedAt: null, changedAfterConfirm: false };
    if (!raw || !Array.isArray(raw.lines)) return out;
    raw.lines.forEach(function(l){
      var p = byId[l && l.productId]; if (!p) return;
      var v = O.variantOf(p, l.variantId);
      var extras = (Array.isArray(l.extras) ? l.extras : []).filter(function(e){ return M.extras[e] && (p.extras || []).indexOf(e) >= 0; });
      var qty = Math.max(1, Math.min(MAX_QTY, parseInt(l.qty, 10) || 1));
      var k = keyOf(p.id, v && v.id, extras);
      var dup = out.lines.filter(function(x){ return x.key === k; })[0];
      if (dup) dup.qty = Math.min(MAX_QTY, dup.qty + qty);
      else out.lines.push({ key:k, productId:p.id, variantId: v ? v.id : null, extras:extras, qty:qty });
    });
    if (['draft','reviewed','confirmed'].indexOf(raw.stage) >= 0 && out.lines.length) out.stage = raw.stage;
    out.confirmedAt = out.stage === 'confirmed' ? raw.confirmedAt || null : null;
    out.changedAfterConfirm = !!raw.changedAfterConfirm && out.lines.length > 0;
    return out;
  }
  function load(){ try { state = sanitize(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch(e){ state = sanitize(null); } }
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e){} }
  function emit(info){ save(); listeners.forEach(function(fn){ fn(info || {}); }); }
  function touched(){
    if (state.stage === 'confirmed') state.changedAfterConfirm = true;
    state.stage = 'draft';
  }

  O.cart = {
    onChange: function(fn){ listeners.push(fn); },
    lines: function(){ return state.lines.slice(); },
    stage: function(){ return state.stage; },
    changedAfterConfirm: function(){ return state.changedAfterConfirm; },
    isEmpty: function(){ return !state.lines.length; },
    has: function(pid){ return state.lines.some(function(l){ return l.productId === pid; }); },
    line: function(key){ return state.lines.filter(function(l){ return l.key === key; })[0]; },
    lineTotal: function(l){ return O.unitPrice(l.productId, l.variantId, l.extras) * l.qty; },
    totals: function(){
      var units = 0, subtotal = 0;
      state.lines.forEach(function(l){ units += l.qty; subtotal += O.cart.lineTotal(l); });
      return { lines: state.lines.length, units: units, subtotal: subtotal, total: subtotal };   // sin cargos adicionales configurados
    },

    /* Añade una configuración (o suma si es idéntica a una línea existente) */
    add: function(pid, vid, extras, qty){
      var p = byId[pid]; if (!p) return null;
      var v = O.variantOf(p, vid); extras = (extras || []).filter(function(e){ return (p.extras || []).indexOf(e) >= 0; });
      qty = Math.max(1, Math.min(MAX_QTY, qty || 1));
      var k = keyOf(pid, v && v.id, extras), l = O.cart.line(k);
      if (l) l.qty = Math.min(MAX_QTY, l.qty + qty);
      else { l = { key:k, productId:pid, variantId: v ? v.id : null, extras:extras, qty:qty }; state.lines.push(l); }
      touched(); emit({ type:'add', key:k }); return k;
    },
    /* Sustituye una línea editada; si la nueva configuración ya existe en otra línea, se combinan */
    replace: function(oldKey, vid, extras, qty){
      var old = O.cart.line(oldKey); if (!old) return null;
      var p = byId[old.productId], v = O.variantOf(p, vid);
      extras = (extras || []).filter(function(e){ return (p.extras || []).indexOf(e) >= 0; });
      var k = keyOf(p.id, v && v.id, extras);
      qty = Math.max(1, Math.min(MAX_QTY, qty || 1));
      if (k === oldKey){ old.qty = qty; }
      else {
        var other = O.cart.line(k);
        if (other){ other.qty = Math.min(MAX_QTY, other.qty + qty); state.lines = state.lines.filter(function(l){ return l.key !== oldKey; }); }
        else { old.key = k; old.variantId = v ? v.id : null; old.extras = extras; old.qty = qty; }
      }
      touched(); emit({ type:'update', key:k }); return k;
    },
    setQty: function(key, qty){
      var l = O.cart.line(key); if (!l) return;
      if (qty < 1) return O.cart.remove(key);
      l.qty = Math.min(MAX_QTY, qty); touched(); emit({ type:'qty', key:key });
    },
    remove: function(key){ state.lines = state.lines.filter(function(l){ return l.key !== key; }); if (!state.lines.length){ state.stage = 'draft'; state.changedAfterConfirm = false; } else touched(); emit({ type:'remove', key:key }); },
    clear: function(){ state = sanitize(null); emit({ type:'clear' }); },
    markReviewed: function(){ if (state.lines.length){ state.stage = 'reviewed'; emit({ type:'stage' }); } },
    markConfirmed: function(){ if (state.lines.length){ state.stage = 'confirmed'; state.confirmedAt = new Date().toISOString(); state.changedAfterConfirm = false; emit({ type:'stage' }); } },
    MAX_QTY: MAX_QTY
  };

  load();
  /* otra pestaña cambió el carrito → sincronizar */
  window.addEventListener('storage', function(e){ if (e.key === KEY){ load(); listeners.forEach(function(fn){ fn({ type:'sync' }); }); } });
})();
