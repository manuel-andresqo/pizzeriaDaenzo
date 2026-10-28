/* =========================================================
   SOLICITUDES DE MESA (pedido en el local)
   «Llamar al mesero» abre esta ventana: mesero, cuenta, agua,
   cubiertos o ayuda. Cada solicitud llega al panel de control de
   DEMOSTRACIÓN de este navegador (DaEnzoDB). Pedir la cuenta solo
   avisa al personal: nunca cobra nada.
   La mesa viene del QR/NFC (?mesa=…); si no hay, «Mesa no identificada».
   ========================================================= */
(function(){
  var O = window.DaEnzoOrder, DE = window.DaEnzo, DB = window.DaEnzoDB, esc = O.esc;
  var win = document.getElementById('win-mesa'); if (!win || !DB) return;
  var body = win.querySelector('.win-body');
  var IC = {
    mesero:'<path d="M6 15a6 6 0 0 1 12 0M4 15h16M12 9V7M10 7h4M8 19h8"/>',
    cuenta:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3"/>',
    agua:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    cubiertos:'<path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M16 3c-1.7 1.5-2.5 4-2.5 7H17V3zM16 13v8"/>',
    ayuda:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.5V14M12 17.2v.1"/>'
  };
  function icon(t){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[t] + '</svg>'; }
  function table(){ var t = O.table.get(); return t ? t.id : null; }
  var SHORT = { mesero:'Llamar al mesero', cuenta:'Pedir la cuenta', agua:'Pedir agua', cubiertos:'Cubiertos', ayuda:'Necesito ayuda' };
  var LBL = { pendiente:'Enviada · esperando al personal', atendida:'El personal ya va en camino', resuelta:'Atendida' };

  function mine(d){ var t = table(); return d.requests.filter(function(r){ return r.table === t && r.source === 'web'; }).slice(-5).reverse(); }
  function render(){
    var d = DB.peek(), t = table(), pend = {};
    mine(d).forEach(function(r){ if (r.status === 'pendiente') pend[r.type] = 1; });
    win.querySelector('.win-eyebrow').textContent = t ? 'Mesa ' + t + ' · demo' : 'Mesa no identificada · demo';
    body.innerHTML =
      (t ? '' : '<p class="tq-warn">No sabemos en qué mesa estás: escanea el código QR de tu mesa para que el personal te encuentre. Puedes enviar la solicitud igualmente.</p>') +
      '<div class="tq-grid">' + Object.keys(SHORT).map(function(k){
        return '<button type="button" class="tq-opt' + (pend[k] ? ' is-sent' : '') + '" data-req="' + k + '"' + (pend[k] ? ' aria-disabled="true"' : '') + '>' + icon(k) +
          '<b>' + SHORT[k] + '</b><small>' + (pend[k] ? 'Enviada' : k === 'cuenta' ? 'Te la traemos a la mesa' : 'Avisar al personal') + '</small></button>';
      }).join('') + '</div>' +
      (mine(d).length ? '<div class="tq-list"><p class="op-label">Tus solicitudes</p><ul>' + mine(d).map(function(r){
        return '<li class="tq-' + r.status + '">' + icon(r.type) + '<span><b>' + esc(DB.REQUEST[r.type].label) + '</b><small>' + LBL[r.status] + '</small></span><time>' + new Date(r.createdAt).toLocaleTimeString('es-VE', { hour:'numeric', minute:'2-digit' }) + '</time></li>';
      }).join('') + '</ul></div>' : '') +
      '<p class="oo-demo tq-demo"><span><b>Demostración:</b> la solicitud llega al panel de control de demostración de este navegador. En el restaurante real llegará al dispositivo del personal. Pedir la cuenta no realiza ningún cobro.</span></p>';
  }
  body.addEventListener('click', function(e){
    var b = e.target.closest('[data-req]'); if (!b || b.getAttribute('aria-disabled') === 'true') return;
    DB.createRequest({ table: table(), type: b.dataset.req, source: 'web' }).then(function(){
      render(); DE.toast(b.dataset.req === 'cuenta' ? 'Avisamos al personal: te llevarán la cuenta a la mesa.' : 'Listo, avisamos al personal.');
    }, function(err){ DE.toast(err.message); });
  });
  DB.subscribe(function(){ if (win.classList.contains('open')) render(); });
  O.tableRequests = { open: function(opener){ render(); DE.openWindow('mesa', opener); } };
})();
