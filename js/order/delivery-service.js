/* =========================================================
   DELIVERY — CAPA DE SERVICIO (sin interfaz)
   Separa claramente lo que YA funciona de lo que depende del backend:

   · Modalidad de pedido compartida (local / delivery) → sessionStorage.
   · Modelo de datos del pedido de Delivery (schema 'daenzo.order.v1'),
     listo para que el futuro panel de control lo reciba y clasifique.
   · Validación de los datos de entrega (frontend; el servidor deberá
     validarlos de nuevo: esta validación NO es una protección).
   · API del futuro backend (DAENZO_CONFIG.orders). Con apiBase vacío NO hay
     conexión: no se envía nada, no se simula ninguna respuesta del servidor
     y nada se marca como «recibido».
   · Consulta del estado real del pedido (solo con backend). Sin temporizadores
     que cambien estados por su cuenta.
   · Enlaces de WhatsApp (abrir WhatsApp ≠ enviar automáticamente).

   Datos personales (dirección, teléfono): solo en sessionStorage de esta
   pestaña (se borran al cerrarla), nunca en registros de consola, nunca a
   terceros sin una integración definida.
   ========================================================= */
(function(){
  var M = window.DAENZO_MENU, O = window.DaEnzoOrder, cart = O.cart;
  var C = window.DAENZO_CONFIG || {}, API = C.orders || {};
  var S = window.sessionStorage;

  function sGet(k){ try { return JSON.parse(S.getItem(k) || 'null'); } catch(e){ return null; } }
  function sSet(k, v){ try { if (v == null) S.removeItem(k); else S.setItem(k, JSON.stringify(v)); } catch(e){} }

  /* ---------- Modalidad compartida ---------- */
  var MODE_KEY = 'daenzo.orderMode';
  var mode = sGet(MODE_KEY) === 'delivery' ? 'delivery' : 'local', modeFns = [];
  O.orderMode = {
    get: function(){ return mode; },
    is: function(m){ return mode === m; },
    set: function(m){ m = m === 'delivery' ? 'delivery' : 'local'; if (m === mode) return; mode = m; sSet(MODE_KEY, m); modeFns.forEach(function(f){ f(m); }); },
    onChange: function(f){ modeFns.push(f); }
  };

  /* ---------- Estados del pedido ----------
     Solo el backend / panel de control puede cambiarlos. */
  var STATUSES = [
    { id:'recibido',               label:'Pedido recibido' },
    { id:'pendiente_confirmacion', label:'Pendiente de confirmación' },
    { id:'pendiente_pago',         label:'Pendiente de pago' },
    { id:'confirmado',             label:'Pedido confirmado' },
    { id:'en_preparacion',         label:'En preparación' },
    { id:'listo',                  label:'Listo para entregar' },
    { id:'en_camino',              label:'En camino' },
    { id:'entregado',              label:'Entregado' },
    { id:'cancelado',              label:'Cancelado' }
  ];
  var byStatus = {}; STATUSES.forEach(function(s){ byStatus[s.id] = s; });

  /* ---------- Envío ----------
     fee null → no hay tarifa real: «se confirmará», no se suma al total. */
  function totals(){
    var t = cart.totals(), fee = M.delivery && typeof M.delivery.fee === 'number' ? M.delivery.fee : null;
    return { units: t.units, lines: t.lines, subtotal: t.subtotal, fee: fee, feePending: fee === null, total: t.subtotal + (fee || 0) };
  }

  /* ---------- Validación de los datos de entrega ---------- */
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
  /* Teléfono: admite +, espacios, guiones, puntos, paréntesis y barras; de 7 a 15 dígitos (E.164) */
  function validPhone(v){
    v = clean(v);
    if (!/^\+?[\d\s().\-\/]+$/.test(v)) return false;
    var d = v.replace(/\D/g, '');
    return d.length >= 7 && d.length <= 15;
  }
  /* Google Maps: acepta el texto que comparte la app («… https://maps.app.goo.gl/xxx») */
  function extractUrl(v){ var m = clean(v).match(/https?:\/\/\S+/i); return m ? m[0].replace(/[),.;]+$/, '') : clean(v); }
  function validMaps(v){
    var u; try { u = new URL(extractUrl(v)); } catch(e){ return false; }
    if (!/^https?:$/.test(u.protocol)) return false;
    var h = u.hostname.toLowerCase();
    if (h === 'maps.app.goo.gl' || h === 'goo.gl' || h === 'g.co') return u.pathname.length > 1;
    if (/^(www\.|maps\.)?google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(h)) return h.indexOf('maps.') === 0 || u.pathname.indexOf('/maps') === 0;
    return false;
  }
  function validate(d){
    var e = {};
    if (!clean(d.address)) e.address = 'Escribe la dirección donde deseas recibir tu pedido.';
    else if (clean(d.address).length < 6) e.address = 'La dirección parece incompleta. Añade calle, número o sector.';
    if (!clean(d.phone)) e.phone = 'Necesitamos un número para contactarte.';
    else if (!validPhone(d.phone)) e.phone = 'Revisa el número: usa solo dígitos y, si quieres, el prefijo internacional (p. ej. +58 414 123 4567).';
    if (clean(d.mapsUrl) && !validMaps(d.mapsUrl)) e.mapsUrl = 'Ese enlace no parece de Google Maps. Puedes dejar este campo vacío.';
    return e;
  }

  /* ---------- Borrador del formulario (solo esta pestaña) ---------- */
  var DRAFT_KEY = 'daenzo.deliveryDraft.v1';
  var draft = {
    get: function(){ return sGet(DRAFT_KEY) || {}; },
    save: function(d){ sSet(DRAFT_KEY, { address: d.address || '', phone: d.phone || '', reference: d.reference || '', mapsUrl: d.mapsUrl || '' }); },
    clear: function(){ sSet(DRAFT_KEY, null); }
  };

  /* ---------- Modelo de datos del pedido ---------- */
  function uid(){
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function buildOrder(d){
    var t = totals();
    var info = { address: clean(d.address), phone: clean(d.phone) };
    if (clean(d.reference)) info.reference = clean(d.reference);
    if (clean(d.mapsUrl)) info.mapsUrl = extractUrl(d.mapsUrl);
    return {
      schema: 'daenzo.order.v1',
      clientRef: uid(),                 // clave de idempotencia: evita pedidos duplicados en el servidor
      id: null,                         // lo asigna el backend
      mode: 'delivery',
      status: 'pendiente_confirmacion', // estado inicial propuesto; el oficial lo fija el servidor
      createdAtClient: new Date().toISOString(),
      currency: M.currency || 'USD',
      items: cart.lines().map(function(l){
        var p = O.product(l.productId), v = O.variantOf(p, l.variantId), im = p.images ? p.images[0] : p.cartImage;
        return {
          productId: p.id, name: p.name, category: p.category, categoryLabel: O.category(p.category).label,
          variantId: v ? v.id : null, variant: v && (p.variants || []).length > 1 ? v.label : null,
          extras: (l.extras || []).map(function(x){ return { id: x, label: M.extras[x].label, price: M.extras[x].price }; }),
          qty: l.qty, unitPrice: O.unitPrice(l.productId, l.variantId, l.extras), lineTotal: cart.lineTotal(l),
          img: im ? im.src : null, imgPos: im ? im.pos : null           // solo para la interfaz
        };
      }),
      amounts: { subtotal: t.subtotal, deliveryFee: t.fee, deliveryFeePending: t.feePending, total: t.total },
      delivery: info,
      demoPricing: !!M.isDemoPricing
    };
  }

  /* ---------- API del futuro backend ---------- */
  function connected(){ return !!API.apiBase; }
  function url(path, id){ return API.apiBase.replace(/\/$/, '') + String(path).replace('{id}', encodeURIComponent(id || '')); }
  function request(method, path, id, body, token){
    var h = { 'Accept':'application/json' };
    if (body) h['Content-Type'] = 'application/json';
    if (body && body.clientRef) h['Idempotency-Key'] = body.clientRef;
    if (token) h.Authorization = 'Bearer ' + token;   // token por pedido: impide consultar pedidos ajenos cambiando el id
    return fetch(url(path, id), { method: method, headers: h, body: body ? JSON.stringify(body) : undefined, credentials: 'omit' })
      .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  /* Pedido → modelo del panel (productos con precio base y extras: el panel recalcula el total) */
  function panelInput(order){
    return { ref: order.clientRef, source: 'web', mode: 'delivery', deliveryFee: order.amounts.deliveryFee,
      delivery: order.delivery, customer: order.customer || null,
      items: order.items.map(function(i){ return { productId: i.productId, name: i.name, category: i.category, categoryLabel: i.categoryLabel, variant: i.variant,
        basePrice: i.unitPrice - i.extras.reduce(function(a, x){ return a + (x.price || 0); }, 0), extras: i.extras, qty: i.qty }; }) };
  }
  /* Crea el pedido en el servidor.
     Sin backend: si existe el panel de DEMOSTRACIÓN (DaEnzoDB, mismo navegador) se registra
     allí → { connected:false, demoPanel:true, id }. Si no, { connected:false } (no se envía nada). */
  function createOrder(order){
    if (!connected()){
      if (window.DaEnzoDB) return window.DaEnzoDB.createOrder(panelInput(order)).then(function(o){ return { connected: false, demoPanel: true, id: o.id }; });
      return Promise.resolve({ connected: false });
    }
    var body = Object.assign({}, order, { items: order.items.map(function(i){ var c = Object.assign({}, i); delete c.img; delete c.imgPos; return c; }) });
    return request('POST', API.createPath, null, body).then(function(res){
      if (!res || !res.id) throw new Error('Respuesta sin identificador');
      return { connected: true, id: res.id, status: byStatus[res.status] ? res.status : 'recibido', createdAt: res.createdAt || null, accessToken: res.accessToken || null };
    });
  }
  /* Pide al servidor que notifique a la pizzería (WhatsApp Business u otro proveedor).
     Las credenciales viven SOLO en el servidor. Sin backend no hace nada. */
  function notifyRestaurant(orderId, token){
    if (!connected() || !orderId || !API.notifyPath) return Promise.resolve({ connected: false, notified: false });
    return request('POST', API.notifyPath, orderId, null, token).then(function(r){ return { connected: true, notified: !!(r && r.notified) }; });
  }
  /* Estado real del pedido: consulta periódica (sustituible por WebSocket / SSE).
     Sin backend devuelve una función vacía: el estado de la demo nunca cambia solo. */
  /* Estados del panel de demostración → estados que ve el cliente */
  var FROM_PANEL = { nuevo:'pendiente_confirmacion', confirmado:'confirmado', en_preparacion:'en_preparacion', listo:'listo', en_camino:'en_camino', entregado:'entregado', finalizado:'entregado', cancelado:'cancelado' };
  function watchStatus(entry, cb){
    if (!connected() && entry && entry.demoId && window.DaEnzoDB){
      var DB = window.DaEnzoDB;
      var check = function(d){ var o = d.orders.filter(function(x){ return x.id === entry.demoId; })[0]; if (o && o.status !== 'nuevo' && FROM_PANEL[o.status]) cb({ status: FROM_PANEL[o.status], updatedAt: o.updatedAt, source: 'panel-demo', payment: o.payment.status }); };
      check(DB.peek());
      return DB.subscribe(check);
    }
    if (!connected() || !entry || !entry.server || !entry.server.id) return function(){};
    var stop = false, timer = null;
    function tick(){
      if (stop) return;
      request('GET', API.statusPath, entry.server.id, null, entry.server.accessToken).then(function(r){
        if (!stop && r && byStatus[r.status]) cb({ status: r.status, updatedAt: r.updatedAt || null, source: 'server' });
      }).catch(function(){}).then(function(){ if (!stop) timer = setTimeout(tick, API.pollMs || 20000); });
    }
    function vis(){ if (!document.hidden){ clearTimeout(timer); tick(); } }
    document.addEventListener('visibilitychange', vis);
    tick();
    return function(){ stop = true; clearTimeout(timer); document.removeEventListener('visibilitychange', vis); };
  }

  /* ---------- Pedidos de Delivery de esta pestaña ----------
     Copia local para mostrar el seguimiento y «Ver mi pedido». NO es una
     confirmación del restaurante: con backend, la información oficial se
     recupera del servidor (watchStatus). */
  var ORDERS_KEY = 'daenzo.deliveryOrders.v1';
  var store = {
    all: function(){ var a = sGet(ORDERS_KEY); return Array.isArray(a) ? a : []; },
    last: function(){ var a = store.all(); return a[a.length - 1] || null; },
    add: function(entry){ var a = store.all(); entry.n = a.length + 1; a.push(entry); sSet(ORDERS_KEY, a); return entry; },
    update: function(ref, patch){ var a = store.all(); a.forEach(function(e){ if (e.order.clientRef === ref) Object.assign(e, patch); }); sSet(ORDERS_KEY, a); },
    clear: function(){ sSet(ORDERS_KEY, null); }
  };

  /* ---------- WhatsApp ---------- */
  var WA = (C.whatsapp && C.whatsapp.url) || '';
  function waLink(text){ return WA ? WA + (WA.indexOf('?') < 0 ? '?' : '&') + 'text=' + encodeURIComponent(text) : ''; }
  var M$ = function(c){ return O.money(c); };
  function orderText(e){
    var o = e.order, d = o.delivery, L = [];
    L.push('Hola, Da Enzo. Quiero hacer este pedido a domicilio:');
    L.push('');
    o.items.forEach(function(i){
      L.push('• ' + i.qty + ' × ' + i.name + (i.variant ? ' (' + i.variant + ')' : '') + ' — ' + M$(i.lineTotal));
      if (i.extras.length) L.push('   Extras: ' + i.extras.map(function(x){ return x.label + (x.price ? ' +' + M$(x.price) : ''); }).join(', '));
    });
    L.push('');
    L.push('Subtotal: ' + M$(o.amounts.subtotal));
    L.push('Envío: ' + (o.amounts.deliveryFeePending ? 'por confirmar' : M$(o.amounts.deliveryFee)));
    L.push('Total' + (o.amounts.deliveryFeePending ? ' (sin envío)' : '') + ': ' + M$(o.amounts.total));
    L.push('');
    L.push('Dirección: ' + d.address);
    if (d.reference) L.push('Referencia: ' + d.reference);
    if (d.mapsUrl) L.push('Ubicación: ' + d.mapsUrl);
    L.push('Teléfono: ' + d.phone);
    if (e.server && e.server.id) L.push('Pedido n.º ' + e.server.id);
    return L.join('\n');
  }

  O.deliveryService = {
    STATUSES: STATUSES, status: function(id){ return byStatus[id] || null; },
    totals: totals, validate: validate, validPhone: validPhone, validMaps: validMaps,
    draft: draft, buildOrder: buildOrder,
    connected: connected, createOrder: createOrder, notifyRestaurant: notifyRestaurant, watchStatus: watchStatus,
    store: store,
    waLink: waLink, orderText: orderText,
    questionText: 'Hola, estoy realizando un pedido de Delivery en Da Enzo Pizzería y tengo una consulta.'
  };
})();
