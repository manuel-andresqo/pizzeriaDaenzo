/* =========================================================
   DA ENZO — CAPA DE DATOS DE DEMOSTRACIÓN (compartida)
   La usan la web pública y el panel de control (/admin).

   · Almacén: localStorage 'daenzo.demo.db.v1' del navegador.
   · Sincronización: BroadcastChannel + evento 'storage' entre pestañas
     del MISMO navegador. No hay sincronización entre dispositivos:
     para eso hace falta un backend (ver admin/LEEME-PANEL.md).
   · Interfaz asíncrona (Promesas) para poder sustituir este adaptador
     por uno que use la API real (fetch) sin reescribir las pantallas.
   · Ningún dato aquí está verificado por un servidor: es una demo.
   ========================================================= */
(function(){
  var KEY = 'daenzo.demo.db.v1', CH = 'daenzo-demo', MAX_EVENTS = 300;
  var TAB = Math.random().toString(36).slice(2, 10);      // identifica la pestaña que hizo el cambio

  /* ---------- Estados ---------- */
  var STATUS = {
    nuevo:          { label:'Nuevo',            tone:'new' },
    confirmado:     { label:'Confirmado',       tone:'confirmed' },
    en_preparacion: { label:'En preparación',   tone:'cooking' },
    listo:          { label:'Listo',            tone:'ready' },
    en_camino:      { label:'En camino',        tone:'route' },
    entregado:      { label:'Entregado',        tone:'done' },
    finalizado:     { label:'Finalizado',       tone:'done' },
    cancelado:      { label:'Cancelado',        tone:'cancel' }
  };
  /* «Listo» se muestra como «Listo para servir» (local) o «Listo para entregar» (delivery) */
  function statusLabel(st, mode){ if (st === 'listo') return mode === 'delivery' ? 'Listo para entregar' : 'Listo para servir'; return (STATUS[st] || {}).label || st; }
  var FLOW = {
    local:    ['nuevo','confirmado','en_preparacion','listo','finalizado'],
    delivery: ['nuevo','confirmado','en_preparacion','listo','en_camino','entregado']
  };
  var FINAL = { finalizado:1, entregado:1, cancelado:1 };
  /* Transiciones permitidas: el siguiente paso del flujo o cancelar (si no es final) */
  function nextStates(o){
    if (FINAL[o.status]) return [];
    var f = FLOW[o.mode] || FLOW.local, i = f.indexOf(o.status), out = [];
    if (i >= 0 && i < f.length - 1) out.push(f[i + 1]);
    out.push('cancelado');
    return out;
  }
  var PAYMENT = {
    pendiente:   { label:'Pago pendiente',       tone:'warn' },
    comprobante: { label:'Comprobante recibido', tone:'info' },
    confirmado:  { label:'Pago confirmado',      tone:'ok' },
    rechazado:   { label:'Pago rechazado',       tone:'bad' },
    devuelto:    { label:'Pago devuelto',        tone:'muted' }
  };
  function paymentOptions(o){
    var p = o.payment.status, all = ['pendiente','comprobante','confirmado','rechazado'];
    if (p === 'confirmado') all.push('devuelto');
    return all.filter(function(x){ return x !== p; });
  }
  var REQUEST = {
    mesero:    { label:'Llamar al mesero',   icon:'bell' },
    cuenta:    { label:'Solicitar la cuenta', icon:'receipt' },
    agua:      { label:'Pedir agua',          icon:'drop' },
    cubiertos: { label:'Solicitar cubiertos', icon:'fork' },
    ayuda:     { label:'Pedir ayuda',         icon:'help' }
  };

  /* ---------- Almacén ---------- */
  function empty(){ return { version:1, rev:0, seq:{ order:1000, request:0, event:0 }, orders:[], requests:[], events:[], overrides:{} }; }
  function read(){
    var d = null; try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){}
    if (!d || d.version !== 1 || !Array.isArray(d.orders)) d = empty();
    d.overrides = d.overrides || {}; d.requests = d.requests || []; d.events = d.events || [];
    return d;
  }
  var lastRev = 0;
  var bc = null; try { bc = new BroadcastChannel(CH); } catch(e){}
  var subs = [];
  function notify(d, change){ subs.forEach(function(fn){ try { fn(d, change); } catch(e){ setTimeout(function(){ throw e; }); } }); }
  /* Lee-modifica-escribe en un solo paso (las pestañas del mismo navegador no escriben a la vez) */
  function write(mut){
    var d = read(), res = mut(d);
    d.rev++; lastRev = d.rev;
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch(e){ return Promise.reject(new Error('No se pudo guardar en este navegador (almacenamiento lleno o bloqueado).')); }
    var change = { rev: d.rev, tab: TAB, local: true };
    if (bc) try { bc.postMessage({ rev: d.rev, tab: TAB }); } catch(e){}
    notify(d, change);
    return Promise.resolve(res);
  }
  lastRev = read().rev;
  function remote(){ var d = read(); if (d.rev === lastRev) return; lastRev = d.rev; notify(d, { rev: d.rev, local: false }); }
  if (bc) bc.onmessage = function(m){ if (m.data && m.data.tab !== TAB) remote(); };
  addEventListener('storage', function(e){ if (e.key === KEY) remote(); });
  /* En el teléfono, la pestaña que queda en segundo plano se congela y puede perder
     los avisos: al volver a ella (o cada 2 s mientras está visible) se revisa si hay cambios. */
  ['visibilitychange','focus','pageshow'].forEach(function(ev){ addEventListener(ev, function(){ if (!document.hidden) remote(); }); });
  setInterval(function(){ if (!document.hidden) remote(); }, 2000);
  function emit(d, type, data){
    d.seq.event++;
    d.events.push({ id: d.seq.event, at: new Date().toISOString(), type: type, tab: TAB, data: data });
    if (d.events.length > MAX_EVENTS) d.events.splice(0, d.events.length - MAX_EVENTS);
  }
  function now(){ return new Date().toISOString(); }
  function clone(x){ return JSON.parse(JSON.stringify(x)); }

  /* ---------- Cálculo del total: siempre desde productos, cantidades y extras ---------- */
  function lineUnit(i){ return (i.basePrice || 0) + (i.extras || []).reduce(function(a, x){ return a + (x.price || 0); }, 0); }
  function totals(o){
    var sub = (o.items || []).reduce(function(a, i){ return a + lineUnit(i) * i.qty; }, 0);
    var fee = o.mode === 'delivery' && typeof o.deliveryFee === 'number' ? o.deliveryFee : 0;
    return { subtotal: sub, fee: fee, feePending: o.mode === 'delivery' && typeof o.deliveryFee !== 'number', total: sub + fee, units: (o.items || []).reduce(function(a, i){ return a + i.qty; }, 0) };
  }

  /* ---------- Pedidos ---------- */
  function createOrder(input){
    return write(function(d){
      if (input.ref){ var dup = d.orders.filter(function(o){ return o.ref === input.ref; })[0]; if (dup) return clone(dup); }   // sin duplicados
      d.seq.order++;
      var o = {
        id: 'DE-' + d.seq.order, ref: input.ref || null, source: input.source || 'web',
        mode: input.mode === 'delivery' ? 'delivery' : 'local',
        table: input.mode === 'delivery' ? null : (input.table || null),        // nunca se inventa la mesa
        customer: input.customer || null, note: input.note || '',
        items: (input.items || []).map(function(i){ return { productId:i.productId, name:i.name, category:i.category, categoryLabel:i.categoryLabel, variant:i.variant || null,
          basePrice:i.basePrice, extras:(i.extras || []).map(function(x){ return { id:x.id, label:x.label, price:x.price || 0 }; }), qty:i.qty, note:i.note || '' }; }),
        deliveryFee: typeof input.deliveryFee === 'number' ? input.deliveryFee : null,
        delivery: input.mode === 'delivery' ? input.delivery || null : null,
        status: 'nuevo', payment: { status: 'pendiente' },
        createdAt: input.createdAt || now(), updatedAt: input.createdAt || now(),
        history: [{ at: input.createdAt || now(), type:'created', to:'nuevo', by: input.source === 'ejemplo' ? 'Datos de ejemplo' : input.source === 'simulado' ? 'Simulación del panel' : 'Web' }]
      };
      d.orders.push(o);
      emit(d, 'order_new', { orderId: o.id, mode: o.mode, table: o.table, total: totals(o).total });
      return clone(o);
    });
  }
  function find(d, id){ return d.orders.filter(function(o){ return o.id === id; })[0]; }
  function updateStatus(id, to, opts){
    opts = opts || {};
    return write(function(d){
      var o = find(d, id); if (!o) throw new Error('Pedido no encontrado.');
      if (nextStates(o).indexOf(to) < 0) throw new Error('Esa acción no está permitida en el estado «' + statusLabel(o.status, o.mode) + '».');
      if (to === 'cancelado' && !String(opts.reason || '').trim()) throw new Error('Indica el motivo de la cancelación.');
      var from = o.status; o.status = to; o.updatedAt = now();
      if (to === 'cancelado') o.cancelReason = String(opts.reason).trim();
      o.history.push({ at: o.updatedAt, type:'status', from: from, to: to, by: opts.by || 'Personal', reason: o.cancelReason && to === 'cancelado' ? o.cancelReason : undefined });
      emit(d, to === 'cancelado' ? 'order_cancel' : 'order_status', { orderId: o.id, from: from, to: to, mode: o.mode });
      return clone(o);
    });
  }
  function updatePayment(id, to, opts){
    opts = opts || {};
    return write(function(d){
      var o = find(d, id); if (!o) throw new Error('Pedido no encontrado.');
      if (!PAYMENT[to]) throw new Error('Estado de pago desconocido.');
      if (paymentOptions(o).indexOf(to) < 0) throw new Error('Ese cambio de pago no está permitido.');
      var from = o.payment.status; o.payment.status = to; o.payment.updatedAt = o.updatedAt = now();
      o.history.push({ at: o.updatedAt, type:'payment', from: from, to: to, by: opts.by || 'Personal' });
      emit(d, 'payment', { orderId: o.id, from: from, to: to });
      return clone(o);
    });
  }

  /* ---------- Solicitudes de mesa ---------- */
  function createRequest(input){
    return write(function(d){
      if (!REQUEST[input.type]) throw new Error('Tipo de solicitud desconocido.');
      var table = input.table || null;
      /* misma mesa + mismo tipo aún pendiente → no se duplica */
      var dup = d.requests.filter(function(r){ return r.status === 'pendiente' && r.type === input.type && r.table === table; })[0];
      if (dup) return clone(dup);
      d.seq.request++;
      var active = d.orders.filter(function(o){ return o.mode === 'local' && table && o.table === table && o.status !== 'cancelado' && o.status !== 'finalizado'; }).map(function(o){ return o.id; });
      var r = { id: 'S-' + String(d.seq.request).padStart(3, '0'), table: table, type: input.type, status: 'pendiente', source: input.source || 'web',
                createdAt: input.createdAt || now(), orders: active, history: [{ at: input.createdAt || now(), to:'pendiente' }] };
      d.requests.push(r);
      emit(d, 'request_new', { requestId: r.id, table: table, type: r.type });
      return clone(r);
    });
  }
  function updateRequest(id, to){
    return write(function(d){
      var r = d.requests.filter(function(x){ return x.id === id; })[0]; if (!r) throw new Error('Solicitud no encontrada.');
      var ok = { pendiente:['atendida','resuelta'], atendida:['resuelta'], resuelta:[] }[r.status] || [];
      if (ok.indexOf(to) < 0) throw new Error('Esa acción no está permitida.');
      r.status = to; r[to + 'At'] = now(); r.history.push({ at: now(), to: to });
      emit(d, 'request_update', { requestId: r.id, table: r.table, type: r.type, to: to });
      return clone(r);
    });
  }

  /* ---------- Catálogo: cambios hechos desde el panel ---------- */
  function setOverride(productId, patch){
    return write(function(d){
      var cur = d.overrides[productId] || {};
      Object.keys(patch).forEach(function(k){ if (patch[k] === undefined) delete cur[k]; else cur[k] = patch[k]; });
      if (Object.keys(cur).length) d.overrides[productId] = cur; else delete d.overrides[productId];
      emit(d, 'catalog', { productId: productId });
      return clone(cur);
    });
  }
  function resetOverrides(){ return write(function(d){ d.overrides = {}; emit(d, 'catalog', { all: true }); }); }

  /* ---------- Demo ---------- */
  function reset(){ return write(function(d){ var e = empty(); Object.keys(e).forEach(function(k){ d[k] = e[k]; }); d.rev = Math.max(d.rev, 1); emit(d, 'reset', {}); }); }
  function replaceAll(data){ return write(function(d){ ['seq','orders','requests','events'].forEach(function(k){ d[k] = data[k]; }); emit(d, 'seed', { orders: data.orders.length }); }); }

  window.DaEnzoDB = {
    adapter: 'demo-local',                       // con backend: 'api'
    tab: TAB,
    STATUS: STATUS, PAYMENT: PAYMENT, REQUEST: REQUEST, FLOW: FLOW,
    statusLabel: statusLabel, nextStates: nextStates, paymentOptions: paymentOptions, isFinal: function(s){ return !!FINAL[s]; },
    totals: totals, lineUnit: lineUnit,
    snapshot: function(){ return Promise.resolve(read()); },
    peek: read,                                    // lectura síncrona (solo adaptador local)
    subscribe: function(fn){ subs.push(fn); return function(){ subs = subs.filter(function(x){ return x !== fn; }); }; },
    createOrder: createOrder, updateStatus: updateStatus, updatePayment: updatePayment,
    createRequest: createRequest, updateRequest: updateRequest,
    setOverride: setOverride, resetOverrides: resetOverrides,
    reset: reset, replaceAll: replaceAll
  };
})();
