/* =========================================================
   AVISO «INICIA SESIÓN» AL ENTRAR EN RESEÑAS
   · Aparece tras una breve demora al entrar en Reseñas.
   · Si se cierra (X) o se ignora, vuelve a sugerirse más tarde
     (mismo patrón que el panel de redes sociales; tiempos en
     DAENZO_CONFIG.reviews.loginPrompt).
   · No aparece si ya hay sesión, si hay una ventana abierta o si
     la persona está escribiendo en el formulario.
   · Con Google configurado se usa el aviso oficial de Google
     (One Tap): al pulsar «Continuar», la cuenta se crea/abre sola.
     Sin configurar, se muestra este aviso propio de Da Enzo y se
     explica que el acceso aún no está conectado.
   ========================================================= */
(function(){
  var R = window.DaEnzoReviews, U = R.utils;

  R.LoginPrompt = function(el, overrides){
    var P = Object.assign({}, window.DAENZO_CONFIG.reviews.loginPrompt, overrides || {});
    var active = false, open = false, timer = null, hideTimer = null, hovering = false;
    var msg = el.querySelector('.lp-msg');

    el.inert = true;

    function schedule(ms){ clearTimeout(timer); timer = setTimeout(tryShow, ms); }   // un solo temporizador

    function goodMoment(){
      if (!active || document.hidden) return false;
      if (R.Auth.session()) return false;                                     // ya tiene sesión
      if (document.querySelector('.win.open')) return false;                  // detalle o acceso abiertos
      var a = document.activeElement;
      if (a && a.matches && a.matches('input, textarea, select')) return false;  // está escribiendo
      return true;
    }

    function tryShow(){
      timer = null;
      if (!active || open || R.Auth.session()) return;
      if (!goodMoment()){ schedule(P.retryMs); return; }
      if (R.Auth.googleReady()){                                               // aviso oficial de Google
        R.Auth.googlePrompt(function(){});
        schedule(P.reappearMs);
        return;
      }
      show();
    }

    function show(){
      open = true; msg.hidden = true;
      el.hidden = false; el.inert = false;
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ el.classList.add('open'); }); });
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function(){
        if (!hovering && !el.contains(document.activeElement)) hide(true);   // ignorado → se retira y vuelve luego
      }, P.autoHideMs);
    }

    function hide(again){
      if (!open) return;
      open = false; clearTimeout(hideTimer);
      el.classList.remove('open'); el.inert = true;
      setTimeout(function(){ if (!open) el.hidden = true; }, 350);
      if (again && active && !R.Auth.session()) schedule(P.reappearMs);
    }

    el.querySelector('.lp-x').addEventListener('click', function(){ hide(true); });
    el.querySelector('.lp-google').addEventListener('click', function(){
      if (R.Auth.googlePrompt(function(ok){ if (ok) hide(false); })) return;
      msg.hidden = false;                                                     // aún no configurado
      clearTimeout(hideTimer);
    });
    el.querySelector('.lp-mail').addEventListener('click', function(e){ hide(true); R.Auth.open(e.currentTarget); });
    el.addEventListener('pointerenter', function(){ hovering = true; });
    el.addEventListener('pointerleave', function(){ hovering = false; });
    el.addEventListener('keydown', function(e){ if (e.key === 'Escape'){ e.stopPropagation(); hide(true); } });

    R.Auth.onChange(function(s){ if (s){ hide(false); clearTimeout(timer); } });
    document.addEventListener('visibilitychange', function(){ if (!document.hidden && active && !open && !timer && !R.Auth.session()) schedule(1500); });

    return {
      /* Entrar en Reseñas */
      start: function(){ active = true; if (!R.Auth.session()) schedule(P.initialDelayMs); },
      /* Salir de Reseñas: se oculta y se cancelan los temporizadores */
      stop: function(){ active = false; clearTimeout(timer); timer = null; hide(false); }
    };
  };
})();
