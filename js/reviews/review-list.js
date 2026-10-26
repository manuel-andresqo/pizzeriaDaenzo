/* =========================================================
   RESUMEN DE VALORACIONES + TARJETAS DE RESEÑA
   ========================================================= */
(function(){
  var R = window.DaEnzoReviews, U = R.utils;

  /* ---------- Resumen: media, estrellas, recuento y distribución ---------- */
  R.renderSummary = function(root, list){
    var n = U.count(list), avg = U.average(list), dist = U.distribution(list);
    var bars = '';
    for (var s = 5; s >= 1; s--){
      var pct = n ? Math.round(dist[s] / n * 100) : 0;
      bars += '<li><span class="rv-dist-k">' + s + ' <svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + U.STAR_PATH + '"/></svg></span>' +
              '<span class="rv-dist-bar" aria-hidden="true"><i style="width:' + pct + '%"></i></span>' +
              '<span class="rv-dist-n">' + dist[s] + '<span class="sr-only"> ' + U.plural(dist[s], 'reseña', 'reseñas') + ' de ' + s + ' ' + U.plural(s, 'estrella', 'estrellas') + '</span></span></li>';
    }
    root.innerHTML =
      '<div class="rv-sum-main">' +
        '<p class="rv-sum-avg"><span class="rv-sum-num">' + U.formatAverage(avg) + '</span><span class="rv-sum-of">/ 5</span></p>' +
        U.starsHTML(avg, 'Valoración media ' + U.formatAverage(avg) + ' de 5') +
        '<p class="rv-sum-count">' + n + ' ' + U.plural(n, 'opinión', 'opiniones') + ' de demostración</p>' +
      '</div>' +
      '<ul class="rv-dist" aria-label="Distribución de valoraciones">' + bars + '</ul>';
  };

  /* ---------- Tarjeta ---------- */
  function cardHTML(r, i){
    var hasText = !!(r.comment && r.comment.trim());
    var photos = r.photos || [];
    return '<article class="rv-card' + (r.isLocal ? ' rv-card--local' : '') + '" data-id="' + U.escape(r.id) + '" style="--i:' + Math.min(i, 10) + '">' +
      '<header class="rv-card-head">' +
        U.avatarHTML(r) +
        '<div class="rv-card-who">' +
          '<h3 class="rv-card-name">' + U.escape(r.authorName) + '</h3>' +
          '<div class="rv-card-meta">' + U.starsHTML(r.rating, r.rating + ' de 5 estrellas') +
            '<span class="rv-card-score" aria-hidden="true">' + r.rating + '/5</span></div>' +
        '</div>' +
        (photos.length ? '<span class="rv-chip-photo">' + U.icon.camera + photos.length + ' ' + U.plural(photos.length, 'foto', 'fotos') + '</span>' : '') +
      '</header>' +
      (hasText
        ? '<p class="rv-card-text">' + U.escape(r.comment) + '</p>'
        : '<p class="rv-card-text rv-card-text--empty">Valoración sin comentario.</p>') +
      /* miniaturas cuadradas (hasta 3); la tercera indica cuántas más hay */
      (photos.length ? '<div class="rv-card-thumbs" aria-hidden="true">' + photos.slice(0, 3).map(function(p, k){
        var rest = photos.length - 3;
        return '<span class="rv-card-thumb"><img src="' + U.escape(p.src) + '" alt="" loading="lazy">' + (k === 2 && rest > 0 ? '<span class="rv-card-more">+' + rest + '</span>' : '') + '</span>';
      }).join('') + '</div>' : '') +
      '<footer class="rv-card-foot">' +
        (r.isLocal ? '<span class="rv-tag rv-tag--local">Tu reseña · solo en esta sesión</span>' : '<span class="rv-tag">Demostración</span>') +
        /* el botón se extiende a toda la tarjeta (::after) para que toda ella responda al clic */
        '<button type="button" class="rv-card-open" data-open="' + U.escape(r.id) + '">Leer reseña<span class="sr-only"> de ' + U.escape(r.authorName) + '</span> ' + U.icon.arrow + '</button>' +
      '</footer>' +
    '</article>';
  }

  R.renderList = function(root, list, onOpen){
    root.innerHTML = list.map(cardHTML).join('');
    if (!root.dataset.bound){
      root.dataset.bound = '1';
      root.addEventListener('click', function(e){
        var b = e.target.closest('.rv-card-open'); if (!b) return;
        root.querySelectorAll('.rv-card.is-selected').forEach(function(c){ c.classList.remove('is-selected'); });
        b.closest('.rv-card').classList.add('is-selected');
        onOpen(b.getAttribute('data-open'), b);
      });
    }
  };
})();
