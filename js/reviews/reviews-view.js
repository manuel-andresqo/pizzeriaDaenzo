/* =========================================================
   VISTA «RESEÑAS» — orquestación
   · Se abre sobre la pantalla principal (ruta #resenas) sin recargar:
     el video queda montado y se pausa mientras está cubierto (sin reiniciarse).
   · Flecha ← vuelve al inicio (y respeta el botón «atrás» del navegador).
   · Reutiliza: gestor de ventanas, panel social, aviso (toast) y configuración.
   ========================================================= */
(function(){
  var R = window.DaEnzoReviews, U = R.utils;
  var C = window.DAENZO_CONFIG.reviews;
  var DE = window.DaEnzo = window.DaEnzo || { routes:{} };

  var view = document.getElementById('reviews');
  if (!view) return;
  var scroller = view.querySelector('.rv-scroll');
  var bar = view.querySelector('.rv-bar');
  var listEl = view.querySelector('#rvList');
  var sumEl = view.querySelector('#rvSummary');
  var accountBtn = view.querySelector('#rvAccount');
  var isOpen = false, pushed = false, lastOpener = null;

  /* ---------- Estado: demostración + reseñas locales de esta sesión ---------- */
  var reviews = R.demoReviews.slice();
  function all(){ return reviews; }
  function find(id){ return reviews.filter(function(r){ return r.id === id; })[0]; }

  function renderAll(){
    R.renderSummary(sumEl, all());
    R.renderList(listEl, all(), function(id, btn){ R.ReviewDetail.open(find(id), btn); });
  }

  /* ---------- Encabezado ---------- */
  /* Video del encabezado (js/reviews/hero-video.js): acercamiento al entrar → bucle de humo.
     Las ventanas de reseña no lo detienen; al salir se pausa y al volver el acercamiento se repite. */
  var hero = R.HeroVideo(view.querySelector('#rvHeroMedia'));
  var loginPrompt = null;   // se crea después de iniciar Auth
  document.addEventListener('visibilitychange', function(){ if (!isOpen) return; if (document.hidden) hero.pause(); else hero.resume(); });

  /* ---------- Formulario ---------- */
  R.ReviewForm(view.querySelector('#rvFormBox'), {
    getAuthorName: function(){ var s = R.Auth.session(); return s ? s.name : 'Tú'; },
    onSubmit: function(review){
      reviews.unshift(review);
      renderAll();
      var card = listEl.querySelector('[data-id="' + review.id + '"]');
      if (card){ card.classList.add('is-new'); }
    },
    onSee: function(id){
      var card = listEl.querySelector('[data-id="' + id + '"]'); if (!card) return;
      card.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'center' });
      card.querySelector('.rv-card-open').focus({ preventScroll:true });
    },
    onAuth: function(btn){ R.Auth.open(btn); }
  });

  /* ---------- Cuenta ---------- */
  R.Auth.init();
  function paintAccount(s){
    accountBtn.querySelector('.rv-account-label').textContent = s ? s.name + ' · demo' : 'Acceder';
    accountBtn.setAttribute('aria-label', s ? 'Cuenta en modo demostración: ' + s.name : 'Acceder o crear una cuenta');
    accountBtn.classList.toggle('is-demo', !!s);
  }
  R.Auth.onChange(paintAccount); paintAccount(null);
  loginPrompt = R.LoginPrompt(view.querySelector('#rvLogin'));
  accountBtn.addEventListener('click', function(){ R.Auth.open(accountBtn); });

  /* ---------- Ordenar mi pedido (fase posterior) ---------- */
  view.querySelector('#rvOrder').addEventListener('click', function(e){
    var route = DE.routes[C.orderRoute];
    if (typeof route === 'function') return route(e.currentTarget);
    DE.toast('La experiencia de pedidos estará disponible próximamente.');
  });

  /* ---------- Móvil: acceso directo al formulario ---------- */
  view.querySelector('#rvJump').addEventListener('click', function(){
    var box = view.querySelector('#rvFormBox');
    box.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start' });
    setTimeout(function(){ var s = box.querySelector('.rv-rate-star[tabindex="0"]'); s && s.focus({ preventScroll:true }); }, 450);
  });

  /* ---------- Barra: fondo sólido al desplazarse ---------- */
  scroller.addEventListener('scroll', function(){ bar.classList.toggle('is-solid', scroller.scrollTop > 40); }, { passive:true });

  /* ---------- Abrir / cerrar la vista ---------- */
  function heroVisible(v){ document.dispatchEvent(new CustomEvent('daenzo:hero', { detail:{ visible: v } })); }

  function open(opener, fromHistory){
    if (isOpen) return;
    isOpen = true; lastOpener = opener || document.activeElement;
    if (DE.closeWindow) DE.closeWindow({ silent:true });
    view.hidden = false; view.inert = false; view.setAttribute('aria-hidden','false');
    document.body.classList.add('in-reviews');
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ view.classList.add('open'); }); });
    scroller.scrollTop = 0;
    if (!fromHistory && location.hash !== C.route){ history.pushState({ view:'resenas' }, '', C.route); pushed = true; }
    hero.start();
    loginPrompt.start();
    setTimeout(function(){ heroVisible(false); view.querySelector('.rv-back').focus({ preventScroll:true }); }, 380);
    var card = listEl.querySelectorAll('.rv-card'); card.forEach(function(c){ c.classList.remove('is-in'); });
    requestAnimationFrame(function(){ card.forEach(function(c){ c.classList.add('is-in'); }); });
  }

  function close(fromHistory){
    if (!isOpen) return;
    isOpen = false;
    if (DE.closeWindow) DE.closeWindow({ silent:true });
    heroVisible(true);
    hero.stop();
    loginPrompt.stop();
    view.classList.remove('open');
    document.body.classList.remove('in-reviews');
    view.inert = true; view.setAttribute('aria-hidden','true');
    setTimeout(function(){ if (!isOpen) view.hidden = true; }, 420);
    if (!fromHistory){
      if (pushed){ pushed = false; history.back(); }
      else if (location.hash === C.route) history.replaceState(null, '', location.pathname + location.search);
    } else pushed = false;
    var back = lastOpener && document.contains(lastOpener) && lastOpener.offsetParent ? lastOpener : document.querySelector('.btn-primary');
    setTimeout(function(){ back && back.focus({ preventScroll:true }); }, 60);
  }

  view.querySelector('.rv-back').addEventListener('click', function(){ close(false); });
  window.addEventListener('popstate', function(){
    if (location.hash === C.route) open(null, true); else close(true);
  });

  /* Ruta usada por los botones existentes («Reseñas») */
  DE.routes[C.route] = function(a){ open(a); };
  DE.reviews = { open: open, close: close, list: all };

  /* ---------- Inicio ---------- */
  view.inert = true;
  R.ReviewDetail.init();
  renderAll();
  if (location.hash === C.route){ open(null, true); }
})();
