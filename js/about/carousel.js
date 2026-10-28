/* =========================================================
   CARRUSEL REUTILIZABLE (logos y galerías de los locales)
   · Rotación automática (por defecto cada 5 s) con fundido.
   · Flechas, puntos y contador; teclado ← →.
   · Se pausa al pasar el cursor, al enfocar, fuera de pantalla
     y al cambiar manualmente (espera antes de seguir).
   · Con movimiento reducido no rota solo.
   · Carga diferida: solo descarga la foto activa y la siguiente.
   ========================================================= */
(function(){
  var NS = window.DaEnzoAbout = window.DaEnzoAbout || {};
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ARROW_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  var ARROW_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); }

  NS.Carousel = function(root, items, opts){
    opts = opts || {};
    var interval = opts.interval || 5000, pauseAfter = opts.pauseAfter || 12000;
    var idx = 0, timer = null, running = false, hover = false, focused = false, inView = true, holdUntil = 0;
    var label = opts.label || 'Galería';

    root.classList.add('cs');
    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'carrusel');
    root.setAttribute('aria-label', label);
    root.innerHTML =
      '<div class="cs-stage">' + items.map(function(it, i){
        return '<figure class="cs-slide' + (i === 0 ? ' is-active' : '') + '" role="group" aria-roledescription="diapositiva" aria-label="' + (i + 1) + ' de ' + items.length + '"' + (i === 0 ? '' : ' aria-hidden="true"') + '>' +
               '<img ' + (i < 2 ? 'src' : 'data-src') + '="' + esc(it.src) + '" alt="' + esc(it.alt) + '"' + (it.width ? ' width="' + it.width + '" height="' + it.height + '"' : '') + ' decoding="async" loading="lazy">' +
               (opts.blurFill ? '<span class="cs-fill" aria-hidden="true" style="background-image:url(\'' + esc(it.src) + '\')"></span>' : '') +
               '</figure>';
      }).join('') + '</div>' +
      '<div class="cs-bar">' +
        '<button type="button" class="cs-btn cs-prev" aria-label="Anterior">' + ARROW_L + '</button>' +
        '<div class="cs-dots" role="group" aria-label="Elegir imagen">' + items.map(function(it, i){
          return '<button type="button" class="cs-dot" data-i="' + i + '" aria-label="Ver ' + esc(it.label || ('imagen ' + (i + 1))) + '"' + (i === 0 ? ' aria-current="true"' : '') + '></button>';
        }).join('') + '</div>' +
        '<span class="cs-count" aria-hidden="true">1 / ' + items.length + '</span>' +
        '<button type="button" class="cs-btn cs-next" aria-label="Siguiente">' + ARROW_R + '</button>' +
      '</div>' +
      '<p class="sr-only cs-live" aria-live="polite"></p>';

    var slides = root.querySelectorAll('.cs-slide'), dots = root.querySelectorAll('.cs-dot');
    var count = root.querySelector('.cs-count'), live = root.querySelector('.cs-live');

    function ensureLoaded(i){
      var img = slides[i] && slides[i].querySelector('img[data-src]');
      if (img){ img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); }
    }

    function go(i, manual){
      i = (i + items.length) % items.length;
      if (i === idx) return;
      ensureLoaded(i); ensureLoaded((i + 1) % items.length);
      slides[idx].classList.remove('is-active'); slides[idx].setAttribute('aria-hidden', 'true');
      dots[idx].removeAttribute('aria-current');
      idx = i;
      slides[idx].classList.add('is-active'); slides[idx].removeAttribute('aria-hidden');
      dots[idx].setAttribute('aria-current', 'true');
      count.textContent = (idx + 1) + ' / ' + items.length;
      if (manual){ holdUntil = Date.now() + pauseAfter; live.textContent = (items[idx].label || items[idx].caption || items[idx].alt) + ' (' + (idx + 1) + ' de ' + items.length + ')'; }
      if (opts.onChange) opts.onChange(idx, items[idx], manual);
      schedule();
    }

    function canAuto(){ return running && !reduced && !hover && !focused && inView && !document.hidden && items.length > 1; }
    function schedule(){
      clearTimeout(timer); timer = null;
      if (!running || reduced) return;
      var wait = Math.max(interval, holdUntil - Date.now());
      timer = setTimeout(function tick(){
        timer = null;
        if (canAuto()) go(idx + 1, false);
        else schedule();                      // reintenta más tarde sin acumular temporizadores
      }, wait);
    }

    root.querySelector('.cs-prev').addEventListener('click', function(){ go(idx - 1, true); });
    root.querySelector('.cs-next').addEventListener('click', function(){ go(idx + 1, true); });
    root.querySelector('.cs-dots').addEventListener('click', function(e){ var d = e.target.closest('.cs-dot'); if (d) go(+d.dataset.i, true); });
    root.addEventListener('keydown', function(e){
      if (e.key === 'ArrowLeft'){ e.preventDefault(); go(idx - 1, true); }
      if (e.key === 'ArrowRight'){ e.preventDefault(); go(idx + 1, true); }
    });
    root.addEventListener('pointerenter', function(e){ if (e.pointerType === 'mouse') hover = true; });
    root.addEventListener('pointerleave', function(){ hover = false; });
    root.addEventListener('focusin', function(){ focused = true; });
    root.addEventListener('focusout', function(e){ focused = !!(e.relatedTarget && root.contains(e.relatedTarget)); });
    // deslizar con el dedo
    var sx = null;
    root.querySelector('.cs-stage').addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, { passive:true });
    root.querySelector('.cs-stage').addEventListener('touchend', function(e){
      if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1), true);
    });

    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(en){ inView = en[0].isIntersecting; }, { threshold: 0.35 }).observe(root);
    }

    if (opts.onChange) opts.onChange(0, items[0], false);

    return {
      start: function(){ running = true; holdUntil = 0; schedule(); },
      stop:  function(){ running = false; clearTimeout(timer); timer = null; },
      reset: function(){ if (idx !== 0){ var r = running; running = false; go(0, false); running = r; } },
      get index(){ return idx; }
    };
  };
})();
