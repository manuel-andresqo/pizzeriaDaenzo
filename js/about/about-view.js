/* =========================================================
   VISTA «SOBRE NOSOTROS» (ruta #sobre-nosotros)
   Misma arquitectura que Reseñas: se abre sobre la pantalla
   principal sin recargar, pausa el video del inicio mientras la
   cubre y reutiliza panel social, acceso, aviso de inicio de
   sesión, gestor de ventanas y avisos.
   El contenido sale de js/about/about-data.js (ficticio, demo).
   ========================================================= */
(function(){
  var D = window.DAENZO_ABOUT, NS = window.DaEnzoAbout, R = window.DaEnzoReviews;
  var DE = window.DaEnzo = window.DaEnzo || { routes:{} };
  var view = document.getElementById('about');
  if (!view || !D) return;

  var scroller = view.querySelector('.ab-scroll'), content = view.querySelector('#abContent');
  var bar = view.querySelector('.ab-bar'), accountBtn = view.querySelector('#abAccount');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isOpen = false, pushed = false, lastOpener = null, io = null;

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); }
  var ARROW = '<svg viewBox="0 0 12 10" fill="none" aria-hidden="true"><path d="M0.8 5h10M7.1 1.4 10.9 5l-3.8 3.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- Plantillas (solo estructura; los textos vienen de DAENZO_ABOUT) ---------- */
  function typeHTML(text){
    var i = 0;
    return text.split('').map(function(ch){
      if (ch === ' ') return '<span class="ab-type-sp"> </span>';
      return '<span class="ab-type-ch" style="--k:' + (i++) + '">' + esc(ch) + '</span>';
    }).join('');
  }

  function heroHTML(h){
    return '<section class="ab-hero" aria-labelledby="abName">' +
      '<img class="ab-hero-img" src="' + esc(h.image.src) + '" alt="' + esc(h.image.alt) + '" width="' + h.image.width + '" height="' + h.image.height + '" fetchpriority="high">' +
      '<div class="ab-hero-in">' +
        '<div class="ab-hero-brand">' +
          '<h1 class="ab-name" id="abName" aria-label="' + esc(h.brand + ' ' + h.brandSub) + '">' +
            '<span class="ab-name-main" aria-hidden="true">' + typeHTML(h.brand) + '</span>' +
            '<span class="ab-name-sub" aria-hidden="true">' + typeHTML(h.brandSub) + '</span>' +
          '</h1>' +
          '<p class="ab-since">' + esc(h.since) + '</p>' +
        '</div>' +
        '<div class="ab-hero-copy">' +
          '<p class="ab-hero-title">' + esc(h.title) + ' <em>' + esc(h.titleAccent) + '</em></p>' +
          '<p class="ab-hero-lead">' + esc(h.lead) + '</p>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="ab-scrollhint" data-jump="abStory"><span>' + esc(h.scrollHint) + '</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg></button>' +
    '</section>';
  }

  function storyHTML(s){
    return '<section class="ab-sec ab-story" id="abStory" aria-labelledby="abStoryT">' +
      '<div class="ab-wrap ab-story-grid">' +
        '<div class="ab-story-text">' +
          '<p class="ab-chapter reveal">' + esc(s.chapter) + '</p>' +
          '<h2 class="ab-h2 reveal" id="abStoryT">' + esc(s.title) + '</h2>' +
          s.paragraphs.map(function(p, i){ return '<p class="ab-p reveal' + (i === 0 ? ' ab-p--lead' : '') + '">' + esc(p) + '</p>'; }).join('') +
          '<blockquote class="ab-quote reveal"><p>«' + esc(s.quote.text) + '»</p><cite>— ' + esc(s.quote.author) + '</cite></blockquote>' +
          '<ol class="ab-timeline reveal" aria-label="Momentos de nuestra historia">' + s.milestones.map(function(m){
            return '<li><span class="ab-tl-year">' + esc(m.year) + '</span><span class="ab-tl-text">' + esc(m.text) + '</span></li>';
          }).join('') + '</ol>' +
        '</div>' +
        '<aside class="ab-logos reveal" aria-labelledby="abLogoT">' +
          '<p class="ab-logos-k">La evolución de nuestra imagen</p>' +
          '<h3 class="ab-logos-t" id="abLogoT" aria-live="polite"></h3>' +
          '<p class="ab-logos-period"></p>' +
          '<div class="ab-logos-cs" id="abLogosCs"></div>' +
          '<p class="ab-logos-cap"></p>' +
        '</aside>' +
      '</div>' +
    '</section>';
  }

  function specialtiesHTML(s){
    return '<section class="ab-spec" aria-labelledby="abSpecT">' +
      '<div class="ab-band">' +
        '<img class="ab-band-img" src="' + esc(s.band.src) + '" alt="' + esc(s.band.alt) + '" width="' + s.band.width + '" height="' + s.band.height + '" loading="lazy" decoding="async">' +
        '<div class="ab-band-in">' +
          '<p class="ab-chapter ab-chapter--light reveal">' + esc(s.chapter) + '</p>' +
          '<h2 class="ab-band-title reveal reveal--title" id="abSpecT">' + esc(s.title) + '</h2>' +
          '<p class="ab-band-intro reveal">' + esc(s.intro) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="ab-wrap ab-spec-grid">' +
        '<div class="ab-dishes" role="group" aria-label="Especialidades">' + s.items.map(function(d, i){
          return '<button type="button" class="ab-dish reveal" style="--i:' + i + '" data-id="' + d.id + '" aria-pressed="' + (i === 0) + '" aria-controls="abDishDetail">' +
            '<span class="ab-dish-img"><img src="' + esc(d.image.src) + '" alt="' + esc(d.image.alt) + '" width="900" height="900" loading="lazy" decoding="async"></span>' +
            '<span class="ab-dish-body"><span class="ab-dish-tag">' + esc(d.tag) + '</span>' +
            '<span class="ab-dish-name">' + esc(d.name) + '</span>' +
            '<span class="ab-dish-short">' + esc(d.short) + '</span></span>' +
          '</button>';
        }).join('') + '</div>' +
        '<div class="ab-spec-text">' +
          s.narrative.map(function(p){ return '<p class="ab-p reveal">' + esc(p) + '</p>'; }).join('') +
          '<article class="ab-dish-detail reveal" id="abDishDetail" aria-live="polite"></article>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function galleryBlock(key, g, cls){
    return '<div class="ab-place ' + cls + ' reveal">' +
      '<div class="ab-place-head"><h3 class="ab-place-t">' + esc(g.title) + '</h3><span class="ab-place-period">' + esc(g.period) + '</span></div>' +
      '<div class="ab-place-cs" id="abCs-' + key + '"></div>' +
      '<p class="ab-place-cap" id="abCap-' + key + '"></p>' +
      '<p class="ab-p ab-place-text">' + esc(g.text) + '</p>' +
    '</div>';
  }

  function placesHTML(p){
    return '<section class="ab-sec ab-places" aria-labelledby="abPlacesT">' +
      '<div class="ab-wrap">' +
        '<div class="ab-places-head">' +
          '<p class="ab-chapter reveal">' + esc(p.chapter) + '</p>' +
          '<h2 class="ab-h2 reveal" id="abPlacesT">' + esc(p.title) + '</h2>' +
          '<p class="ab-p ab-places-intro reveal">' + esc(p.intro) + '</p>' +
        '</div>' +
        '<div class="ab-places-grid">' + galleryBlock('old', p.old, 'ab-place--old') + galleryBlock('current', p.current, 'ab-place--current') + '</div>' +
        '<p class="ab-closing reveal">' + esc(p.closing) + '</p>' +
        '<p class="ab-demo-note">' + esc(D.demoNote) + '</p>' +
      '</div>' +
    '</section>';
  }

  content.innerHTML = heroHTML(D.hero) + storyHTML(D.story) + specialtiesHTML(D.specialties) + placesHTML(D.places) +
    '<footer class="rv-foot ab-foot">Da Enzo Pizzería · Secreto de familia desde 1989</footer>';

  /* ---------- Carrusel de logos (título y texto cambian con la imagen) ---------- */
  var logoT = content.querySelector('.ab-logos-t'), logoP = content.querySelector('.ab-logos-period'), logoC = content.querySelector('.ab-logos-cap');
  var logosCs = NS.Carousel(content.querySelector('#abLogosCs'), D.logos, {
    label: 'Evolución del logo de Da Enzo', interval: D.carouselIntervalMs, pauseAfter: D.pauseAfterInteractionMs, eager: true,
    onChange: function(i, it){
      [logoT, logoP, logoC].forEach(function(el){ el.classList.remove('swap-in'); void el.offsetWidth; el.classList.add('swap-in'); });
      logoT.textContent = it.label; logoP.textContent = it.period; logoC.textContent = it.caption;
    }
  });

  /* ---------- Galerías de los locales (independientes) ---------- */
  function galleryCs(key, g){
    var cap = content.querySelector('#abCap-' + key);
    return NS.Carousel(content.querySelector('#abCs-' + key), g.photos.map(function(ph){ ph.label = ph.caption; return ph; }), {
      label: g.title, interval: D.carouselIntervalMs, pauseAfter: D.pauseAfterInteractionMs, blurFill: true,
      onChange: function(i, it){ cap.classList.remove('swap-in'); void cap.offsetWidth; cap.classList.add('swap-in'); cap.textContent = it.caption; }
    });
  }
  var oldCs = galleryCs('old', D.places.old), curCs = galleryCs('current', D.places.current);
  var carousels = [logosCs, oldCs, curCs];

  /* ---------- Especialidades: selección y detalle ---------- */
  var detail = content.querySelector('#abDishDetail');
  function showDish(id, animate){
    var d = D.specialties.items.filter(function(x){ return x.id === id; })[0]; if (!d) return;
    content.querySelectorAll('.ab-dish').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.id === id)); });
    var html = '<p class="ab-detail-k">' + esc(d.tag) + '</p><h3 class="ab-detail-t">' + esc(d.name) + '</h3>' +
      '<p class="ab-detail-story">' + esc(d.story) + '</p>' +
      '<ul class="ab-detail-ing" aria-label="Ingredientes">' + d.ingredients.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    if (!animate || reduced){ detail.innerHTML = html; return; }
    detail.classList.add('swap'); setTimeout(function(){ detail.innerHTML = html; detail.classList.remove('swap'); }, 180);
  }
  content.querySelector('.ab-dishes').addEventListener('click', function(e){
    var b = e.target.closest('.ab-dish'); if (!b) return;
    showDish(b.dataset.id, true);
    if (matchMedia('(max-width: 860px)').matches) detail.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block:'nearest' });
  });
  showDish(D.specialties.items[0].id, false);

  /* ---------- Indicador para continuar ---------- */
  content.querySelector('[data-jump]').addEventListener('click', function(e){
    var t = document.getElementById(e.currentTarget.getAttribute('data-jump'));
    scroller.scrollTo({ top: t.offsetTop - bar.offsetHeight + 4, behavior: reduced ? 'auto' : 'smooth' });
  });

  /* ---------- Aparición al desplazarse (una vez por visita) ---------- */
  function armReveals(){
    var els = content.querySelectorAll('.reveal');
    if (reduced || !('IntersectionObserver' in window)){ els.forEach(function(el){ el.classList.add('is-in'); }); return; }
    if (io) io.disconnect();
    /* un título que se revela con clip-path no tiene área visible: se observa su contenedor */
    var hostOf = new Map();
    io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (!en.isIntersecting) return;
        (hostOf.get(en.target) || [en.target]).forEach(function(t){ t.classList.add('is-in'); });
        io.unobserve(en.target);
      });
    }, { root: scroller, threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function(el){
      el.classList.remove('is-in');
      var target = el.classList.contains('reveal--title') ? el.parentNode : el;
      if (target !== el){ hostOf.set(target, (hostOf.get(target) || [target]).concat(el)); }
      io.observe(target);
    });
  }

  /* ---------- Barra: fondo sólido al bajar ---------- */
  scroller.addEventListener('scroll', function(){ bar.classList.toggle('is-solid', scroller.scrollTop > 40); }, { passive:true });

  /* ---------- Cuenta (misma experiencia que Reseñas) ---------- */
  function paintAccount(s){
    accountBtn.querySelector('.rv-account-label').textContent = s ? s.name + (s.real ? '' : ' · demo') : 'Acceder';
    accountBtn.setAttribute('aria-label', s ? 'Cuenta' + (s.real ? '' : ' en modo demostración') + ': ' + s.name : 'Acceder o crear una cuenta');
    accountBtn.classList.toggle('is-demo', !!s);
  }
  R.Auth.onChange(paintAccount); paintAccount(R.Auth.session());
  accountBtn.addEventListener('click', function(){ R.Auth.open(accountBtn); });
  /* En una página de lectura el aviso espera más antes de aparecer (no interrumpe la historia) */
  var prompt = R.LoginPrompt(view.querySelector('#abLogin'), { initialDelayMs: 12000, autoHideMs: 15000 });

  /* ---------- Ordenar mi pedido (flotante y arrastrable) ---------- */
  var order = NS.FloatingOrder(view.querySelector('#abOrder'), view, function(){
    var route = DE.routes[(window.DAENZO_CONFIG.reviews || {}).orderRoute || '#ordenar'];
    if (typeof route === 'function') return route();
    DE.toast('La experiencia de pedidos estará disponible próximamente.');
  });

  /* ---------- Abrir / cerrar ---------- */
  function heroVisible(v){ document.dispatchEvent(new CustomEvent('daenzo:hero', { detail:{ visible: v } })); }
  function runTyping(){
    var h = content.querySelector('.ab-name');
    h.classList.remove('is-typing'); void h.offsetWidth;
    if (!reduced) h.classList.add('is-typing'); else h.classList.add('is-typed');
  }

  function open(opener, fromHistory){
    if (isOpen) return;
    isOpen = true; lastOpener = opener || document.activeElement;
    if (DE.closeWindow) DE.closeWindow({ silent:true });
    if (DE.reviews && DE.reviews.close) DE.reviews.close(true);
    view.hidden = false; view.inert = false; view.setAttribute('aria-hidden','false');
    document.body.classList.add('in-about');
    scroller.scrollTop = 0; bar.classList.remove('is-solid');
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ view.classList.add('open'); runTyping(); }); });
    if (!fromHistory && location.hash !== D.route){ history.pushState({ view:'nosotros' }, '', D.route); pushed = true; }
    armReveals();
    carousels.forEach(function(c){ c.reset(); c.start(); });
    order.show(); prompt.start();
    setTimeout(function(){ heroVisible(false); view.querySelector('.rv-back').focus({ preventScroll:true }); }, 380);
  }

  function close(fromHistory){
    if (!isOpen) return;
    isOpen = false;
    if (DE.closeWindow) DE.closeWindow({ silent:true });
    carousels.forEach(function(c){ c.stop(); });
    prompt.stop(); if (io) io.disconnect();
    heroVisible(true);
    view.classList.remove('open');
    document.body.classList.remove('in-about');
    view.inert = true; view.setAttribute('aria-hidden','true');
    setTimeout(function(){ if (!isOpen) view.hidden = true; }, 420);
    if (!fromHistory){
      if (pushed){ pushed = false; history.back(); }
      else if (location.hash === D.route) history.replaceState(null, '', location.pathname + location.search);
    } else pushed = false;
    var back = lastOpener && document.contains(lastOpener) && lastOpener.offsetParent ? lastOpener : document.querySelector('.btn-primary');
    setTimeout(function(){ back && back.focus({ preventScroll:true }); }, 60);
  }

  view.querySelector('.rv-back').addEventListener('click', function(){ close(false); });
  window.addEventListener('popstate', function(){ if (location.hash === D.route) open(null, true); else close(true); });
  document.addEventListener('visibilitychange', function(){ if (!isOpen) return; carousels.forEach(function(c){ if (document.hidden) c.stop(); else c.start(); }); });

  DE.routes[D.route] = function(a){ open(a); };
  DE.about = { open: open, close: close };

  view.inert = true;
  if (location.hash === D.route) open(null, true);
})();
