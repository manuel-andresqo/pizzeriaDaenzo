/* =========================================================
   SELECTOR DE FOTOGRAFÍAS — previsualización local
   Valida formato y tamaño; las imágenes no salen del navegador.
   ========================================================= */
(function(){
  var R = window.DaEnzoReviews, U = R.utils;

  R.PhotoPicker = function(root, cfg){
    var items = [], seq = 0;
    var input = root.querySelector('input[type=file]');
    var grid = root.querySelector('.rv-photos-grid');
    var errBox = root.querySelector('.rv-photos-err');
    var addBtn = root.querySelector('.rv-photos-add');
    var countEl = root.querySelector('.rv-photos-count');
    var maxBytes = cfg.maxPhotoSizeMB * 1048576;
    input.accept = cfg.acceptedTypes.join(',');

    function updateMeta(){
      countEl.textContent = items.length + ' / ' + cfg.maxPhotos;
      var full = items.length >= cfg.maxPhotos;
      addBtn.classList.toggle('is-disabled', full);
      addBtn.setAttribute('aria-disabled', String(full));
    }
    function showErrors(list){
      errBox.innerHTML = list.map(function(t){ return '<li>' + U.escape(t) + '</li>'; }).join('');
      errBox.hidden = !list.length;
    }

    function addFiles(files){
      var errors = [];
      Array.prototype.forEach.call(files, function(f){
        if (items.length >= cfg.maxPhotos){ errors.push('Puedes adjuntar hasta ' + cfg.maxPhotos + ' fotos.'); return; }
        if (cfg.acceptedTypes.indexOf(f.type) < 0){ errors.push('«' + f.name + '»: formato no admitido (usa JPG, PNG o WebP).'); return; }
        if (f.size > maxBytes){ errors.push('«' + f.name + '» pesa ' + U.formatBytes(f.size) + '; el máximo es ' + cfg.maxPhotoSizeMB + ' MB.'); return; }
        var it = { id: 'p' + (++seq), file: f, url: URL.createObjectURL(f), status: 'loading' };
        items.push(it); renderItem(it);
      });
      // mensajes únicos
      showErrors(errors.filter(function(t, i){ return errors.indexOf(t) === i; }));
      updateMeta();
    }

    function renderItem(it){
      var el = document.createElement('div');
      el.className = 'rv-photo is-loading'; el.dataset.id = it.id;
      el.innerHTML = '<span class="rv-photo-spin" aria-hidden="true"></span>' +
        '<img alt="Vista previa: ' + U.escape(it.file.name) + '">' +
        '<button type="button" class="rv-photo-rm" aria-label="Quitar ' + U.escape(it.file.name) + '">' + U.icon.close + '</button>';
      var img = el.querySelector('img');
      img.onload = function(){ it.status = 'ready'; el.classList.remove('is-loading'); };
      img.onerror = function(){
        it.status = 'error'; remove(it.id, true);
        showErrors(['«' + it.file.name + '» no se pudo leer como imagen.']);
      };
      img.src = it.url;
      grid.appendChild(el);
    }

    function remove(id, silent){
      var it = items.filter(function(x){ return x.id === id; })[0]; if (!it) return;
      URL.revokeObjectURL(it.url);
      items = items.filter(function(x){ return x.id !== id; });
      var el = grid.querySelector('[data-id="' + id + '"]');
      if (el){ el.classList.add('is-out'); setTimeout(function(){ el.remove(); }, 200); }
      if (!silent) showErrors([]);
      updateMeta();
      if (!silent) addBtn.focus();
    }

    input.addEventListener('change', function(){ addFiles(input.files); input.value = ''; });
    addBtn.addEventListener('click', function(e){
      if (items.length >= cfg.maxPhotos){ e.preventDefault(); showErrors(['Ya alcanzaste el máximo de ' + cfg.maxPhotos + ' fotos.']); }
    });
    addBtn.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); addBtn.click(); } });
    grid.addEventListener('click', function(e){
      var b = e.target.closest('.rv-photo-rm'); if (b) remove(b.closest('.rv-photo').dataset.id);
    });
    // arrastrar y soltar (escritorio)
    ['dragenter','dragover'].forEach(function(t){ root.addEventListener(t, function(e){ e.preventDefault(); root.classList.add('is-drag'); }); });
    ['dragleave','drop'].forEach(function(t){ root.addEventListener(t, function(e){ e.preventDefault(); root.classList.remove('is-drag'); }); });
    root.addEventListener('drop', function(e){ if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); });

    updateMeta();
    return {
      pending: function(){ return items.some(function(x){ return x.status === 'loading'; }); },
      /* entrega las fotos a la reseña local (las URL siguen vivas mientras dure la sesión) */
      take: function(){
        var out = items.map(function(x){ return { src: x.url, alt: 'Foto adjuntada por ti (vista previa local)' }; });
        items = []; grid.innerHTML = ''; showErrors([]); updateMeta();
        return out;
      },
      count: function(){ return items.length; },
      addFiles: addFiles
    };
  };
})();
