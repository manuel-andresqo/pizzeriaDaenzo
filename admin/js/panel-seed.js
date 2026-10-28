/* =========================================================
   DATOS DE EJEMPLO Y SIMULACIONES (solo demostración)
   · Todo lo que se genera aquí lleva source 'ejemplo' o 'simulado' y se
     muestra con su etiqueta: nunca se presenta como venta real de Da Enzo.
   · Productos, precios y extras salen del MISMO catálogo que usa la web.
   · Nombres, teléfonos y direcciones son ficticios.
   ========================================================= */
(function(){
  var PV = window.DaEnzoPanel, DB = window.DaEnzoDB, M = window.DAENZO_MENU;

  /* generador pseudoaleatorio con semilla: mismos datos cada vez que se cargan */
  function rng(seed){ return function(){ seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
  var NAMES = ['María G.','Carlos R.','Andreína P.','Luis M.','Valentina S.','José A.','Daniela T.','Miguel Á.','Gabriela L.','Rafael C.','Isabel F.','Jorge V.'];
  var STREETS = ['Av. Las Américas','Av. Los Próceres','Calle 26, Belén','Av. 4 Bolívar','Urb. La Mara','Av. Andrés Bello','Sector Santa Juana','Urb. Las Tapias'];
  var REFS = ['Frente a la farmacia','Portón verde','Edificio de la esquina','Al lado de la panadería','Casa con rejas blancas',''];
  var NOTES = ['', '', '', 'Sin cebolla, por favor', 'Bien tostada', 'Cortar en 8 porciones', ''];

  function pick(r, a){ return a[Math.floor(r() * a.length)]; }
  function items(r){
    var ps = M.products, n = 1 + Math.floor(r() * 3.2), out = [];
    var pizzas = ps.filter(function(p){ return p.category === 'pizzas'; });
    for (var k = 0; k < n; k++){
      var p = k === 0 || r() < .4 ? pick(r, pizzas) : pick(r, ps);
      if (out.some(function(i){ return i.productId === p.id; })) continue;
      var vs = p.variants || [], v = vs.length ? (r() < .55 ? vs[0] : pick(r, vs)) : null;
      var ex = [];
      if ((p.extras || []).length && r() < .35){ var e1 = pick(r, p.extras); ex.push(e1); if (r() < .3){ var e2 = pick(r, p.extras); if (e2 !== e1) ex.push(e2); } }
      out.push({ productId: p.id, name: p.name, category: p.category, categoryLabel: PV.category(p.category).label,
        variant: v && vs.length > 1 ? v.label : null, basePrice: p.price + (v ? v.delta : 0), qty: p.category === 'bebidas' ? 1 + Math.floor(r() * 3) : r() < .2 ? 2 : 1,
        extras: ex.map(function(x){ return { id: x, label: M.extras[x].label, price: M.extras[x].price }; }) });
    }
    return out;
  }
  function deliveryInfo(r, i){
    var info = { address: pick(r, STREETS) + ', casa ' + (10 + Math.floor(r() * 80)) + ' (dirección de ejemplo)', phone: '+58 414-000-00' + String(10 + i % 90) };
    var ref = pick(r, REFS); if (ref) info.reference = ref;
    if (r() < .4) info.mapsUrl = 'https://maps.app.goo.gl/ejemplo' + i;
    return info;
  }

  /* Construye pedidos, solicitudes y su historial para los últimos 7 días */
  function build(){
    var r = rng(1989), orders = [], requests = [], events = [], seq = { order: 1000, request: 0, event: 0 };
    var now = new Date(), today0 = new Date(now); today0.setHours(0, 0, 0, 0);
    function at(dayOffset, minutes){ var d = new Date(today0); d.setDate(d.getDate() - dayOffset); d.setMinutes(minutes); return d; }
    function push(o){ orders.push(o); }
    function mk(createdAt, mode, finalStatus, payStatus, i){
      seq.order++;
      var o = { id: 'DE-' + seq.order, ref: null, source: 'ejemplo', mode: mode,
        table: mode === 'local' ? (r() < .9 ? String(1 + Math.floor(r() * 12)) : null) : null,
        customer: mode === 'delivery' ? { name: pick(r, NAMES) } : null, note: pick(r, NOTES),
        items: items(r), deliveryFee: null, delivery: mode === 'delivery' ? deliveryInfo(r, seq.order) : null,
        status: 'nuevo', payment: { status: 'pendiente' }, createdAt: createdAt.toISOString(), updatedAt: createdAt.toISOString(),
        history: [{ at: createdAt.toISOString(), type:'created', to:'nuevo', by:'Datos de ejemplo' }] };
      /* avanza por el flujo real hasta el estado final indicado */
      var flow = DB.FLOW[mode], t = createdAt.getTime(), target = finalStatus;
      if (target === 'cancelado'){
        var stopAt = 1 + Math.floor(r() * 2);
        for (var s = 1; s < stopAt; s++){ t += (4 + r() * 8) * 60000; o.history.push({ at: new Date(t).toISOString(), type:'status', from: flow[s - 1], to: flow[s], by:'Datos de ejemplo' }); o.status = flow[s]; }
        t += (3 + r() * 6) * 60000; o.cancelReason = pick(r, ['El cliente lo canceló','Producto agotado','Pedido duplicado']);
        o.history.push({ at: new Date(t).toISOString(), type:'status', from: o.status, to:'cancelado', by:'Datos de ejemplo', reason: o.cancelReason }); o.status = 'cancelado';
      } else {
        for (var k = 1; k <= flow.indexOf(target); k++){
          t += (k === 2 ? 12 + r() * 10 : 3 + r() * 7) * 60000;
          if (t > now.getTime()) t = now.getTime() - (flow.indexOf(target) - k + 1) * 30000;
          o.history.push({ at: new Date(t).toISOString(), type:'status', from: flow[k - 1], to: flow[k], by:'Datos de ejemplo' }); o.status = flow[k];
        }
      }
      if (payStatus && payStatus !== 'pendiente'){
        var pt = Math.min(now.getTime() - 10000, t + 5 * 60000);
        if (payStatus === 'devuelto') o.history.push({ at: new Date(pt - 60000).toISOString(), type:'payment', from:'pendiente', to:'confirmado', by:'Datos de ejemplo' });
        o.history.push({ at: new Date(pt).toISOString(), type:'payment', from: payStatus === 'devuelto' ? 'confirmado' : 'pendiente', to: payStatus, by:'Datos de ejemplo' });
        o.payment.status = payStatus; t = Math.max(t, pt);
      }
      o.updatedAt = new Date(Math.min(t, now.getTime())).toISOString();
      return o;
    }
    /* Días anteriores: pedidos ya terminados (algunos cancelados) */
    for (var d = 6; d >= 1; d--){
      var n = 6 + Math.floor(r() * 6);
      for (var i = 0; i < n; i++){
        var mode = r() < .58 ? 'local' : 'delivery', cancel = r() < .09;
        var o = mk(at(d, 12 * 60 + Math.floor(r() * 600)), mode, cancel ? 'cancelado' : mode === 'local' ? 'finalizado' : 'entregado', cancel ? (r() < .3 ? 'devuelto' : 'pendiente') : (r() < .93 ? 'confirmado' : 'pendiente'), i);
        push(o);
      }
    }
    /* Hoy: pedidos en todos los estados (repartidos en las últimas horas) */
    var mins = Math.max(90, now.getHours() * 60 + now.getMinutes() - 5), start = Math.max(0, mins - 300);
    var plan = [
      ['local','finalizado','confirmado'], ['delivery','entregado','confirmado'], ['local','finalizado','confirmado'], ['delivery','cancelado','pendiente'],
      ['local','finalizado','pendiente'], ['delivery','en_camino','comprobante'], ['local','listo','pendiente'], ['delivery','listo','confirmado'],
      ['local','en_preparacion','pendiente'], ['delivery','en_preparacion','pendiente'], ['local','confirmado','pendiente'], ['delivery','nuevo','pendiente'], ['local','nuevo','pendiente']
    ];
    plan.forEach(function(pl, k){ push(mk(at(0, start + Math.round((mins - start) * (k + 1) / (plan.length + 1))), pl[0], pl[1], pl[2], k)); });
    orders.sort(function(a, b){ return a.createdAt < b.createdAt ? -1 : 1; });
    /* renumera por orden de llegada: los identificadores siguen la cronología */
    orders.forEach(function(o, k){ o.id = 'DE-' + (1001 + k); }); seq.order = 1000 + orders.length;

    /* Solicitudes de mesa de hoy */
    var active = orders.filter(function(o){ return o.mode === 'local' && o.table && PV.isToday(o.createdAt) && !DB.isFinal(o.status); });
    [['mesero', 7, 'pendiente'], ['cuenta', 3, 'pendiente'], ['agua', 18, 'atendida'], ['cubiertos', 40, 'resuelta']].forEach(function(q, k){
      var tb = active[k % Math.max(1, active.length)]; seq.request++;
      var c = new Date(now.getTime() - q[1] * 60000);
      var req = { id: 'S-' + String(seq.request).padStart(3, '0'), table: tb ? tb.table : String(3 + k), type: q[0], status: q[2], source:'ejemplo', createdAt: c.toISOString(),
                  orders: tb ? [tb.id] : [], history: [{ at: c.toISOString(), to:'pendiente' }] };
      if (q[2] !== 'pendiente'){ req.atendidaAt = new Date(c.getTime() + 3 * 60000).toISOString(); req.history.push({ at: req.atendidaAt, to:'atendida' }); }
      if (q[2] === 'resuelta'){ req.resueltaAt = new Date(c.getTime() + 8 * 60000).toISOString(); req.history.push({ at: req.resueltaAt, to:'resuelta' }); }
      requests.push(req);
    });
    /* Actividad reciente a partir del historial (marcada como ya vista: no genera avisos) */
    var evs = [];
    orders.forEach(function(o){ o.history.forEach(function(h){ evs.push({ at: h.at, type: h.type === 'created' ? 'order_new' : h.type === 'payment' ? 'payment' : h.to === 'cancelado' ? 'order_cancel' : 'order_status', data: { orderId: o.id, from: h.from, to: h.to, mode: o.mode, table: o.table } }); }); });
    requests.forEach(function(q){ evs.push({ at: q.createdAt, type:'request_new', data: { requestId: q.id, table: q.table, type: q.type } }); });
    evs.sort(function(a, b){ return a.at < b.at ? -1 : 1; });
    evs.slice(-120).forEach(function(e){ seq.event++; e.id = seq.event; e.tab = 'seed'; e.seed = true; events.push(e); });
    return { seq: seq, orders: orders, requests: requests, events: events };
  }

  PV.seed = {
    load: function(){ return DB.replaceAll(build()); },
    /* Simula lo que haría un cliente desde la web (para presentar con un solo dispositivo) */
    order: function(mode){
      var r = rng(Date.now() % 100000), m = mode || (r() < .5 ? 'local' : 'delivery');
      return DB.createOrder({ source:'simulado', mode: m, items: items(r), table: m === 'local' ? String(1 + Math.floor(r() * 12)) : null,
        customer: m === 'delivery' ? { name: pick(r, NAMES) + ' (simulado)' } : null, note: pick(r, NOTES),
        delivery: m === 'delivery' ? deliveryInfo(r, Math.floor(r() * 90)) : null, ref: 'SIM-' + Date.now() });
    },
    request: function(){
      var r = rng(Date.now() % 100000), types = Object.keys(DB.REQUEST);
      return DB.createRequest({ source:'simulado', table: String(1 + Math.floor(r() * 12)), type: pick(r, types) });
    }
  };
})();
