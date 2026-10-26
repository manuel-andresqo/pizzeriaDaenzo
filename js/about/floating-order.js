/* =========================================================
   BOTÓN FLOTANTE «ORDENAR MI PEDIDO» (arrastrable)
   · Se puede mover a cualquier punto visible; nunca sale de la pantalla.
   · Diferencia arrastre (≥ 8 px) de toque/clic: un toque siempre lo pulsa.
   · Teclado: Enter/Espacio lo pulsa; Alt + flechas lo mueve.
   · Recuerda la posición en este navegador (localStorage, dato no sensible:
     solo coordenadas relativas). Si el almacenamiento falla, vuelve a la esquina.
   · Al pulsarlo usa la ruta configurada (DaEnzo.routes[orderRoute]);
     si aún no existe, muestra «La experiencia de pedidos estará disponible próximamente».
   ========================================================= */
(function(){
  var NS = window.DaEnzoAbout = window.DaEnzoAbout || {};
  var KEY = 'daenzo.orderButton.pos';
  var MARGIN = 12, THRESHOLD = 8;

  NS.FloatingOrder = function(btn, area, onActivate, opts){
    var pos = null, drag = null, moved = false;
    var key = (opts && opts.storageKey) || KEY;   // cada botón flotante recuerda su propia posición

    function bounds(){
      var a = area.getBoundingClientRect(), b = btn.getBoundingClientRect();
      var safeB = parseFloat(getComputedStyle(btn).getPropertyValue('--safe-b')) || 0;
      return { w: a.width, h: a.height, bw: b.width, bh: b.height, minX: MARGIN, minY: MARGIN + 70, maxX: a.width - b.width - MARGIN, maxY: a.height - b.height - MARGIN - safeB };
    }
    function clamp(p){
      var B = bounds();
      return { x: Math.min(Math.max(p.x, B.minX), Math.max(B.minX, B.maxX)), y: Math.min(Math.max(p.y, B.minY), Math.max(B.minY, B.maxY)) };
    }
    /* Zonas prohibidas (p. ej. el carrito o la barra inferior): opts.avoid() devuelve elementos.
       Si el botón queda encima de una, se desplaza al lado libre más cercano. */
    function zones(){
      var a = area.getBoundingClientRect();
      return ((opts && opts.avoid && opts.avoid()) || []).map(function(el){
        if (!el || el === btn || el.hidden || el.offsetParent === null) return null;
        var r = el.getBoundingClientRect(); if (!r.width || !r.height) return null;
        return { l: r.left - a.left - 10, t: r.top - a.top - 10, r: r.right - a.left + 10, b: r.bottom - a.top + 10 };
      }).filter(Boolean);
    }
    function avoid(p){
      var B = bounds();
      for (var pass = 0; pass < 3; pass++){
        var hit = zones().filter(function(z){ return p.x < z.r && p.x + B.bw > z.l && p.y < z.b && p.y + B.bh > z.t; })[0];
        if (!hit) break;
        var opts2 = [ { x: hit.l - B.bw, y: p.y }, { x: hit.r, y: p.y }, { x: p.x, y: hit.t - B.bh }, { x: p.x, y: hit.b } ]
          .filter(function(c){ return c.x >= B.minX && c.x <= B.maxX && c.y >= B.minY && c.y <= B.maxY; })
          .sort(function(m, n){ return Math.hypot(m.x - p.x, m.y - p.y) - Math.hypot(n.x - p.x, n.y - p.y); });
        if (!opts2.length) break;
        p = opts2[0];
      }
      return p;
    }
    function apply(p, save, free){
      pos = clamp(p);
      if (!free) pos = clamp(avoid(pos));
      btn.style.left = pos.x + 'px'; btn.style.top = pos.y + 'px';
      btn.style.right = 'auto'; btn.style.bottom = 'auto';
      btn.classList.add('is-placed');
      if (save){
        var B = bounds();
        try { localStorage.setItem(key, JSON.stringify({ fx: pos.x / Math.max(1, B.w - B.bw), fy: pos.y / Math.max(1, B.h - B.bh) })); } catch(e){}
      }
    }
    function restore(){
      var s = null;
      try { s = JSON.parse(localStorage.getItem(key) || 'null'); } catch(e){}
      if (!s || typeof s.fx !== 'number') return;
      var B = bounds();
      apply({ x: s.fx * (B.w - B.bw), y: s.fy * (B.h - B.bh) }, false);
    }

    btn.addEventListener('pointerdown', function(e){
      if (e.button !== 0) return;
      var r = btn.getBoundingClientRect(), a = area.getBoundingClientRect();
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: r.left - a.left, oy: r.top - a.top };
      moved = false;
    });
    /* el seguimiento se hace en la ventana: el puntero puede salir del botón antes de superar el umbral */
    window.addEventListener('pointermove', function(e){
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!moved && Math.hypot(dx, dy) < THRESHOLD) return;      // aún es un toque
      if (!moved){ moved = true; try { btn.setPointerCapture(e.pointerId); } catch(err){} btn.classList.add('is-dragging'); }
      e.preventDefault();
      apply({ x: drag.ox + dx, y: drag.oy + dy }, false, true);   // libre mientras se arrastra
    });
    function end(e){
      if (!drag || (e && e.pointerId !== drag.id)) return;
      if (moved){ btn.classList.remove('is-dragging'); apply(pos, true); }
      drag = null;
    }
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    btn.addEventListener('click', function(e){
      if (moved){ e.preventDefault(); moved = false; return; }   // el arrastre no cuenta como pulsación
      onActivate(btn);
    });
    btn.addEventListener('keydown', function(e){
      if (!e.altKey) return;
      var step = e.shiftKey ? 60 : 24, r = btn.getBoundingClientRect(), a = area.getBoundingClientRect();
      var p = { x: r.left - a.left, y: r.top - a.top };
      if (e.key === 'ArrowLeft') p.x -= step; else if (e.key === 'ArrowRight') p.x += step;
      else if (e.key === 'ArrowUp') p.y -= step; else if (e.key === 'ArrowDown') p.y += step; else return;
      e.preventDefault(); apply(p, true);
    });
    window.addEventListener('resize', function(){ if (pos) apply(pos, false); });

    function settle(){
      if (drag && moved) return;
      var r = btn.getBoundingClientRect(), a = area.getBoundingClientRect();
      if (!r.width) return;
      var cur = { x: r.left - a.left, y: r.top - a.top }, nxt = avoid(cur);
      if (nxt.x !== cur.x || nxt.y !== cur.y) apply(nxt, false);
    }
    return {
      show: function(){ requestAnimationFrame(function(){ restore(); settle(); }); },
      /* vuelve a comprobar las zonas prohibidas (al desplazarse o cambiar el carrito) */
      refresh: settle,
      reset: function(){ try { localStorage.removeItem(key); } catch(e){} pos = null; btn.removeAttribute('style'); btn.classList.remove('is-placed'); }
    };
  };
})();
