/* =========================================================
   FORMULARIO «AGREGA UNA RESEÑA»
   Orden: estrellas → incentivo → comentario → frases rápidas → fotos → enviar
   Única obligación: la valoración por estrellas.
   El envío es de DEMOSTRACIÓN: la reseña solo vive en el estado de la página.
   ========================================================= */
(function(){
  var R = window.DaEnzoReviews, U = R.utils;
  var ERR_RATING = 'Selecciona una valoración de una a cinco estrellas para continuar.';

  R.ReviewForm = function(root, opts){
    var C = window.DAENZO_CONFIG.reviews, F = C.form;

    root.innerHTML =
      '<form class="rv-form" novalidate aria-labelledby="rvFormTitle">' +
        '<h2 class="rv-form-title" id="rvFormTitle">Agrega una reseña</h2>' +
        '<p class="rv-form-sub">¿Cómo fue tu experiencia en Da Enzo?</p>' +

        '<div class="rv-field rv-field--rate">' +
          '<div id="rvRate"></div>' +
          '<p class="rv-err" id="rvRateErr" role="alert" hidden></p>' +
        '</div>' +

        '<div class="rv-encourage" id="rvEncourage" role="status" aria-live="polite" hidden>' +
          '<p>¡Gracias por valorar Da Enzo! ¿Quieres contarnos qué fue lo que más te gustó?</p>' +
          '<button type="button" class="rv-encourage-x" aria-label="Cerrar mensaje">' + U.icon.close + '</button>' +
        '</div>' +

        '<div class="rv-field">' +
          '<label class="rv-label" for="rvText">Comentario <span class="rv-opt">(opcional)</span></label>' +
          '<textarea id="rvText" class="rv-text" rows="5" maxlength="' + F.commentMaxLength + '" placeholder="Cuéntanos cómo fue tu experiencia…" aria-describedby="rvCount rvTextErr"></textarea>' +
          '<div class="rv-text-meta"><span class="rv-phr-hint" id="rvPhrHint"></span><span class="rv-count" id="rvCount" aria-live="off">0 / ' + F.commentMaxLength + '</span></div>' +
          '<p class="rv-err" id="rvTextErr" role="alert" hidden></p>' +
        '</div>' +

        '<div class="rv-field">' +
          '<p class="rv-label" id="rvPhrLabel">Atajos <span class="rv-opt">· toca para añadirlos a tu texto</span></p>' +
          '<div class="rv-phrases" id="rvPhrases" role="group" aria-labelledby="rvPhrLabel"></div>' +
        '</div>' +

        '<div class="rv-field rv-photos" id="rvPhotos">' +
          '<div class="rv-photos-top">' +
            '<label class="rv-photos-add" tabindex="0" role="button">' +
              '<input type="file" multiple class="sr-only" tabindex="-1">' + U.icon.camera +
              '<span>Adjuntar fotos</span></label>' +
            '<span class="rv-photos-hint">JPG, PNG o WebP · máx. ' + F.maxPhotoSizeMB + ' MB · <span class="rv-photos-count"></span></span>' +
          '</div>' +
          '<div class="rv-photos-grid"></div>' +
          '<ul class="rv-photos-err" role="alert" hidden></ul>' +
        '</div>' +

        '<button type="submit" class="rv-submit"><span>Enviar reseña</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 3 10.2 13.8M21 3l-6.8 18-4-7.2L3 9.8 21 3Z"/></svg></button>' +

        '<div class="rv-done" id="rvDone" role="status" aria-live="polite" hidden></div>' +

        '<p class="rv-form-note">' + U.icon.info + '<span>Modo demostración: la reseña se muestra solo en esta página y no se publica en Google ni se guarda. Para publicar reseñas reales será necesario <button type="button" class="rv-linkbtn" data-auth-open>acceder a tu cuenta</button> (aún no configurado).</span></p>' +
        (C.googleReviewUrl ? '<a class="rv-google" href="' + U.escape(C.googleReviewUrl) + '" target="_blank" rel="noopener noreferrer">Dejar una reseña en Google ' + U.icon.arrow + '</a>' : '') +
      '</form>';

    var form = root.querySelector('form');
    var text = root.querySelector('#rvText'), count = root.querySelector('#rvCount');
    var rateErr = root.querySelector('#rvRateErr'), textErr = root.querySelector('#rvTextErr');
    var enc = root.querySelector('#rvEncourage'), done = root.querySelector('#rvDone'), hint = root.querySelector('#rvPhrHint');
    var encShown = false, encTimer = null;

    /* ---- Estrellas ---- */
    var stars = R.StarRating(root.querySelector('#rvRate'), {
      label: 'Tu valoración, de 1 a 5 estrellas', describedBy: 'rvRateErr',
      onChange: function(){
        rateErr.hidden = true;
        done.hidden = true;
        if (!encShown) showEncourage();          // solo la primera vez: no reaparece mientras se escribe
      }
    });

    /* ---- Mensaje de incentivo ---- */
    function showEncourage(){
      encShown = true; enc.hidden = false;
      requestAnimationFrame(function(){ enc.classList.add('in'); });
      clearTimeout(encTimer); encTimer = setTimeout(hideEncourage, F.encourageAutoHideMs);
    }
    function hideEncourage(){
      clearTimeout(encTimer);
      enc.classList.remove('in');
      setTimeout(function(){ if (!enc.classList.contains('in')) enc.hidden = true; }, 260);
    }
    enc.querySelector('.rv-encourage-x').addEventListener('click', function(){ hideEncourage(); text.focus(); });

    /* ---- Comentario ---- */
    function updateCount(){
      var n = text.value.length;
      count.textContent = n + ' / ' + F.commentMaxLength;
      count.classList.toggle('is-near', n > F.commentMaxLength * 0.9);
      if (n <= F.commentMaxLength) textErr.hidden = true;
    }
    text.addEventListener('input', function(){ updateCount(); done.hidden = true; });

    /* ---- Frases rápidas → texto editable ----
       autoText: último texto sugerido insertado. Mientras siga intacto dentro del comentario,
       se reescribe al cambiar la selección. Si la persona lo edita, el texto pasa a ser suyo:
       las nuevas frases se añaden al final y las que desmarque no borran nada. */
    var autoText = '';
    var phrases = R.QuickPhrases(root.querySelector('#rvPhrases'), C.quickPhrases, function(selected, added){
      var val = text.value, next = U.composeFromPhrases(selected);
      if (autoText && val.indexOf(autoText) >= 0){
        val = val.replace(autoText, next);
        autoText = next;
      } else if (!autoText){
        if (added){ val = (val.trim() ? val.trim() + ' ' : '') + next; autoText = next; }
      } else if (added){
        var s = U.composeFromPhrases([added]);
        val = (val.trim() ? val.trim() + ' ' : '') + s;
      }
      text.value = val.replace(/\s{2,}/g, ' ').trim();
      hint.textContent = selected.length ? 'Revisa y edita el texto antes de enviar.' : '';
      updateCount(); done.hidden = true;
      // resaltar brevemente el campo para indicar que cambió
      text.classList.remove('flash'); void text.offsetWidth; text.classList.add('flash');
    });

    /* ---- Fotos ---- */
    var photos = R.PhotoPicker(root.querySelector('#rvPhotos'), F);

    /* ---- Envío (demostración) ---- */
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var ok = true;
      if (!stars.value){
        rateErr.textContent = ERR_RATING; rateErr.hidden = false;
        stars.focus(); ok = false;                          // el texto escrito se conserva
      }
      if (text.value.length > F.commentMaxLength){
        textErr.textContent = 'El comentario supera los ' + F.commentMaxLength + ' caracteres. Acórtalo un poco para continuar.';
        textErr.hidden = false; if (ok) text.focus(); ok = false;
      }
      if (photos.pending()){
        textErr.textContent = 'Espera a que terminen de cargarse las fotos.'; textErr.hidden = false; ok = false;
      }
      if (!ok) return;

      var now = new Date();
      var review = {
        id: 'local-' + now.getTime(),
        authorName: (opts.getAuthorName && opts.getAuthorName()) || 'Tú',
        avatarUrl: null,
        rating: stars.value,
        comment: text.value.trim(),
        photos: photos.take(),
        date: now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'),
        isDemo: true, isLocal: true
      };
      opts.onSubmit(review);

      // reiniciar el formulario
      stars.reset(); text.value = ''; autoText = ''; hint.textContent = ''; updateCount();
      phrases.reset();
      encShown = false; hideEncourage();
      done.innerHTML = '<p><b>Reseña de demostración añadida al listado.</b> No se ha publicado ni guardado en ningún servidor: desaparecerá al recargar la página.</p>' +
        '<button type="button" class="rv-linkbtn" data-see="' + review.id + '">Ver mi reseña</button>';
      done.hidden = false;
    });
    done.addEventListener('click', function(e){
      var b = e.target.closest('[data-see]'); if (b && opts.onSee) opts.onSee(b.getAttribute('data-see'));
    });

    root.querySelector('[data-auth-open]').addEventListener('click', function(e){ opts.onAuth && opts.onAuth(e.currentTarget); });
    return { stars: stars };
  };
})();
