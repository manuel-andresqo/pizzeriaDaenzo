/* =========================================================
   VIDEO DEL ENCABEZADO DE RESEÑAS
   Igual que la pantalla principal:
     Estado 1 · resenas-intro: el acercamiento a las pizzas (una vez por visita)
     Estado 2 · resenas-loop : la cámara queda quieta en la posición final y
                               solo se mueve el humo (bucle sin salto)
   El bucle se generó estabilizando los últimos segundos del clip original a la
   posición final de la cámara, con un fundido interno de 1 s en el empalme.
   Cada vez que se vuelve a entrar en Reseñas, el acercamiento empieza de nuevo.
   ========================================================= */
(function(){
  var R = window.DaEnzoReviews;

  R.HeroVideo = function(box){
    var intro = box.querySelector('.rv-hero-video--intro');
    var loop  = box.querySelector('.rv-hero-video--loop');
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var state = 'idle';                 // idle | intro | loop
    var hideTimer = null;

    function tryPlay(v){
      try { var p = v.play(); return p && p.then ? p : Promise.resolve(); }
      catch(e){ return Promise.reject(e); }
    }
    /* Los archivos se asignan la primera vez que se entra en Reseñas (no al abrir la web):
       versión cuadrada y ligera en teléfonos, MP4 en iPhone (ver DaEnzoMedia en index.html) */
    function ensure(){
      if (box.dataset.ready) return; box.dataset.ready = '1';
      var D = window.DaEnzoMedia; box.classList.toggle('is-m', D.mobile());
      [intro, loop].forEach(function(v){ v.poster = D.poster(v.dataset.poster); v.src = D.src(v.dataset.base); });
    }
    function prime(v){ ensure(); if (v.preload !== 'auto'){ v.preload = 'auto'; v.load(); } }

    /* Fin del acercamiento → bucle de humo, con un fundido breve (misma posición de cámara) */
    function toLoop(){
      if (state !== 'intro') return;
      state = 'loop';
      loop.currentTime = 0;
      tryPlay(loop).then(function(){
        var reveal = function(){ box.classList.add('is-looping'); clearTimeout(hideTimer); hideTimer = setTimeout(function(){ intro.pause(); }, 800); };
        if (loop.requestVideoFrameCallback) loop.requestVideoFrameCallback(reveal); else reveal();
      }, function(){ /* si se bloquea, la intro queda en su último fotograma: nunca negro */ });
    }
    intro.addEventListener('playing', function(){ prime(loop); });
    intro.addEventListener('ended', toLoop);

    return {
      /* Entrar en Reseñas: el acercamiento siempre empieza desde el principio */
      start: function(){
        clearTimeout(hideTimer);
        ensure();
        if (reduced){                    // movimiento reducido: imagen fija de la posición final
          box.classList.add('is-looping', 'is-still');
          return;
        }
        box.classList.remove('is-looping');
        loop.pause();
        state = 'intro';
        prime(intro);
        try { intro.currentTime = 0; } catch(e){}
        tryPlay(intro).catch(function(){ /* autoplay bloqueado: se ve el póster */ });
      },
      /* Salir de Reseñas: se pausa todo (se reiniciará al volver) */
      stop: function(){
        clearTimeout(hideTimer);
        intro.pause(); loop.pause();
        state = 'idle';
      },
      /* Pestaña oculta / visible: pausa y reanuda sin reiniciar */
      pause: function(){ intro.pause(); loop.pause(); },
      resume: function(){
        if (state === 'intro') tryPlay(intro).catch(function(){});
        else if (state === 'loop') tryPlay(loop).catch(function(){});
      }
    };
  };
})();
