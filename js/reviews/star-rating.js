/* =========================================================
   SELECTOR DE ESTRELLAS (entrada accesible)
   radiogroup con 5 opciones · flechas, Inicio/Fin, 1–5 · vista previa al pasar el cursor
   ========================================================= */
(function(){
  var R = window.DaEnzoReviews, U = R.utils;
  var WORDS = ['', 'Mala', 'Regular', 'Buena', 'Muy buena', 'Excelente'];

  R.StarRating = function(root, opts){
    opts = opts || {};
    var value = 0, preview = 0;
    root.classList.add('rv-rate');
    root.setAttribute('role', 'radiogroup');
    root.setAttribute('aria-label', opts.label || 'Valoración de 1 a 5 estrellas');
    if (opts.describedBy) root.setAttribute('aria-describedby', opts.describedBy);

    var btns = [];
    for (var i = 1; i <= 5; i++){
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'rv-rate-star'; b.dataset.v = i;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', i + ' ' + U.plural(i, 'estrella', 'estrellas') + ' — ' + WORDS[i]);
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + U.STAR_PATH + '"/></svg>';
      root.appendChild(b); btns.push(b);
    }
    var caption = document.createElement('span');
    caption.className = 'rv-rate-caption'; caption.setAttribute('aria-hidden', 'true');
    root.appendChild(caption);

    function paint(){
      var shown = preview || value;
      btns.forEach(function(b, idx){
        var n = idx + 1;
        b.classList.toggle('on', n <= shown);
        b.classList.toggle('is-preview', !!preview && n <= preview);
        b.setAttribute('aria-checked', String(n === value));
        b.tabIndex = (value ? n === value : n === 1) ? 0 : -1;
      });
      caption.textContent = shown ? WORDS[shown] + ' · ' + shown + '/5' : 'Sin valorar';
    }
    function set(v, focus){
      v = Math.max(1, Math.min(5, v));
      var changed = v !== value;
      value = v; preview = 0; paint();
      var b = btns[v - 1];
      b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');   // breve animación de selección
      if (focus) b.focus();
      if (changed && opts.onChange) opts.onChange(value);
    }

    btns.forEach(function(b){
      b.addEventListener('click', function(){ set(+b.dataset.v); });
      b.addEventListener('pointerenter', function(e){ if (e.pointerType === 'mouse'){ preview = +b.dataset.v; paint(); } });
    });
    root.addEventListener('pointerleave', function(){ if (preview){ preview = 0; paint(); } });
    root.addEventListener('keydown', function(e){
      var cur = value || 0, k = e.key, next = null;
      if (k === 'ArrowRight' || k === 'ArrowUp') next = Math.min(5, cur + 1 || 1);
      else if (k === 'ArrowLeft' || k === 'ArrowDown') next = Math.max(1, cur - 1 || 1);
      else if (k === 'Home') next = 1; else if (k === 'End') next = 5;
      else if (/^[1-5]$/.test(k)) next = +k;
      if (next !== null){ e.preventDefault(); set(next, true); }
    });

    paint();
    return {
      get value(){ return value; },
      reset: function(){ value = 0; preview = 0; paint(); },
      focus: function(){ (btns[(value || 1) - 1]).focus(); }
    };
  };
})();
