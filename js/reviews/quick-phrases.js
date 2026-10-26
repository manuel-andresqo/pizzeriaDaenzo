/* =========================================================
   FRASES RÁPIDAS — etiquetas seleccionables (aria-pressed)
   Son ayudas de redacción: nunca se publican por sí solas.
   ========================================================= */
(function(){
  var R = window.DaEnzoReviews, U = R.utils;

  R.QuickPhrases = function(root, phrases, onChange){
    var selected = [];   // en orden de selección
    root.innerHTML = phrases.map(function(p){
      return '<button type="button" class="rv-phrase" aria-pressed="false" data-id="' + p.id + '">' +
             '<svg class="rv-phrase-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>' +
             U.escape(p.label) + '</button>';
    }).join('');

    root.addEventListener('click', function(e){
      var b = e.target.closest('.rv-phrase'); if (!b) return;
      var p = phrases.filter(function(x){ return x.id === b.dataset.id; })[0];
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on));
      if (on) selected.push(p); else selected = selected.filter(function(x){ return x.id !== p.id; });
      onChange(selected.slice(), on ? p : null, on ? null : p);
    });

    return {
      reset: function(){ selected = []; root.querySelectorAll('.rv-phrase').forEach(function(b){ b.setAttribute('aria-pressed','false'); }); }
    };
  };
})();
