/* =========================================================
   VENTANA DE DETALLE + GALERÍA + AMPLIACIÓN DE FOTOS
   Reutiliza el gestor de ventanas existente (DaEnzo.openWindow):
   misma animación, foco, Escape y capa de fondo que Contacto/Horarios.
   ========================================================= */
(function(){
  var R = window.DaEnzoReviews, U = R.utils;
  var win, head, body, lb, lbImg, lbCap, lbCount, photos = [], idx = 0, lastThumb = null;

  /* Galería: una foto grande cuadrada y hasta dos debajo.
     Si hay más de 3, la última miniatura muestra «+N»; al pulsar cualquier foto se
     abre la ampliación, donde se recorren TODAS una por una (flechas + X). */
  function galleryHTML(list){
    var n = list.length, shown = list.slice(0, 3), rest = n - 3;
    return '<div class="rv-gal rv-gal--' + Math.min(n, 3) + '">' + shown.map(function(p, i){
      var more = (i === 2 && rest > 0);
      return '<button type="button" class="rv-gal-item' + (i === 0 ? ' rv-gal-main' : '') + (more ? ' has-more' : '') + '" data-i="' + i + '" aria-label="' +
             (more ? 'Ver las ' + n + ' fotos (' + rest + ' más)' : 'Ampliar foto ' + (i + 1) + ' de ' + n + ': ' + U.escape(p.alt || '')) + '">' +
             '<img src="' + U.escape(p.src) + '" alt="' + U.escape(p.alt || '') + '" loading="lazy" decoding="async">' +
             (more ? '<span class="rv-gal-more" aria-hidden="true">+' + rest + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }

  function render(r){
    var hasPhotos = r.photos && r.photos.length, hasText = r.comment && r.comment.trim();
    win.classList.toggle('rv-detail--photos', !!hasPhotos);
    head.innerHTML =
      U.avatarHTML(r, 'rv-avatar--lg') +
      '<div><h2 class="win-title rv-detail-name" id="t-resena">' + U.escape(r.authorName) + '</h2>' +
      '<div class="rv-detail-meta">' + U.starsHTML(r.rating, r.rating + ' de 5 estrellas') + '<span>' + r.rating + ' de 5</span></div></div>';
    body.innerHTML =
      '<div class="rv-detail-text">' +
        (hasText ? r.comment.trim().split(/\n+/).map(function(t){ return '<p>' + U.escape(t) + '</p>'; }).join('')
                 : '<p class="rv-detail-empty">Esta persona dejó solo su valoración, sin comentario.</p>') +
        '<p class="rv-detail-foot">' +
          (r.isLocal ? '<span class="rv-tag rv-tag--local">Tu reseña · solo en esta sesión, no publicada</span>'
                     : '<span class="rv-tag">Reseña de demostración · contenido ficticio</span>') +
          (r.date ? '<span class="rv-detail-date">' + U.escape(U.formatMonth(r.date)) + (r.isLocal ? '' : ' · fecha de demostración') + '</span>' : '') +
        '</p>' +
      '</div>' +
      (hasPhotos ? '<div class="rv-detail-photos"><p class="rv-detail-photos-t">' + U.icon.camera + r.photos.length + ' ' + U.plural(r.photos.length, 'foto', 'fotos') + '</p>' + galleryHTML(r.photos) + '</div>' : '');
    photos = r.photos || [];
  }

  /* ---------- Ampliación (lightbox dentro de la ventana) ---------- */
  function showLb(i){
    idx = (i + photos.length) % photos.length;
    var p = photos[idx];
    lbImg.classList.remove('in'); void lbImg.offsetWidth;
    lbImg.src = p.src; lbImg.alt = p.alt || '';
    lbImg.classList.add('in');
    lbCap.textContent = p.alt || '';
    lbCount.textContent = (idx + 1) + ' / ' + photos.length;
    lb.querySelectorAll('.rv-lb-nav').forEach(function(b){ b.hidden = photos.length < 2; });
  }
  function openLb(i, from){
    lastThumb = from; lb.hidden = false;
    requestAnimationFrame(function(){ lb.classList.add('open'); });
    showLb(i);
    lb.querySelector('.rv-lb-close').focus();
  }
  function closeLb(){
    if (lb.hidden || !lb.classList.contains('open')) return false;
    lb.classList.remove('open');
    setTimeout(function(){ lb.hidden = true; }, 220);
    if (lastThumb) lastThumb.focus();
    return true;
  }

  R.ReviewDetail = {
    init: function(){
      win = document.getElementById('win-resena');
      head = win.querySelector('.rv-detail-head');
      body = win.querySelector('.rv-detail-body');
      lb = win.querySelector('.rv-lightbox');
      lbImg = lb.querySelector('img'); lbCap = lb.querySelector('.rv-lb-cap'); lbCount = lb.querySelector('.rv-lb-count');

      body.addEventListener('click', function(e){
        var t = e.target.closest('.rv-gal-item'); if (t) openLb(+t.dataset.i, t);
      });
      lb.querySelector('.rv-lb-close').addEventListener('click', closeLb);
      lb.querySelector('.rv-lb-prev').addEventListener('click', function(){ showLb(idx - 1); });
      lb.querySelector('.rv-lb-next').addEventListener('click', function(){ showLb(idx + 1); });
      lb.addEventListener('click', function(e){ if (e.target === lb) closeLb(); });   // fondo de la ampliación: solo cierra la ampliación
      lb.addEventListener('keydown', function(e){
        if (e.key === 'ArrowLeft'){ e.preventDefault(); showLb(idx - 1); }
        if (e.key === 'ArrowRight'){ e.preventDefault(); showLb(idx + 1); }
      });
      /* Escape: primero cierra la ampliación; un segundo Escape cierra la ventana */
      var prev = window.DaEnzo.onEscape;
      window.DaEnzo.onEscape = function(){ return closeLb() || (prev ? prev() : false); };
    },
    open: function(review, opener){
      lb.hidden = true; lb.classList.remove('open');
      render(review);
      win.querySelector('.win-body').scrollTop = 0;
      window.DaEnzo.openWindow('resena', opener);
    }
  };
})();
