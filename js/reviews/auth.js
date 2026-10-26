/* =========================================================
   ACCESO / REGISTRO — INTERFAZ (sin proveedor configurado)
   ---------------------------------------------------------
   · No hay backend ni OAuth: ningún formulario crea cuentas reales.
   · Las contraseñas nunca se guardan: se descartan al enviar.
   · Nada se escribe en localStorage.
   · «Modo demostración» es una sesión SOLO en memoria, claramente
     identificada, para probar la interfaz (desaparece al recargar).
   · La suscripción comercial es opcional, desmarcada y separada
     de la cuenta.
   ========================================================= */
(function(){
  var R = window.DaEnzoReviews, U = R.utils;
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var session = null;           // { name, marketingOptIn }  — solo memoria
  var listeners = [];
  var root;

  function emit(){ listeners.forEach(function(fn){ fn(session); }); }

  function view(){
    if (session) return accountView();
    return '' +
      '<div class="au-tabs" role="tablist" aria-label="Acceso">' +
        '<button type="button" role="tab" class="au-tab" id="auTabIn" aria-controls="auIn" aria-selected="true">Iniciar sesión</button>' +
        '<button type="button" role="tab" class="au-tab" id="auTabUp" aria-controls="auUp" aria-selected="false" tabindex="-1">Crear cuenta</button>' +
      '</div>' +
      '<button type="button" class="au-google" data-google>' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>' +
        'Continuar con Google</button>' +
      '<p class="au-note" data-google-note hidden role="status">El acceso con Google todavía no está configurado: requiere un proyecto de Google Cloud con credenciales OAuth y un servidor de autenticación. No se ha iniciado sesión.</p>' +
      '<div class="au-or"><span>o con tu correo</span></div>' +

      '<form class="au-form" id="auIn" role="tabpanel" aria-labelledby="auTabIn" novalidate>' +
        field('auInEmail','Correo electrónico','email','email','tu@correo.com') +
        field('auInPass','Contraseña','password','current-password','') +
        '<button type="submit" class="au-submit">Iniciar sesión</button>' +
      '</form>' +

      '<form class="au-form" id="auUp" role="tabpanel" aria-labelledby="auTabUp" novalidate hidden>' +
        field('auUpName','Nombre (se mostrará en tus reseñas)','text','name','Ej.: Ana P.') +
        field('auUpEmail','Correo electrónico (no se muestra públicamente)','email','email','tu@correo.com') +
        field('auUpPass','Contraseña (mínimo 8 caracteres)','password','new-password','') +
        '<label class="au-check"><input type="checkbox" id="auUpMkt"><span><b>Quiero recibir novedades y promociones de Da Enzo por correo.</b> Opcional y distinto de tu cuenta: puedes crear la cuenta sin aceptarlo y darte de baja cuando quieras.</span></label>' +
        '<button type="submit" class="au-submit">Crear cuenta</button>' +
      '</form>' +

      '<div class="au-result" data-result role="status" aria-live="polite" hidden></div>' +
      '<p class="au-foot">' + U.icon.info + '<span>Interfaz de demostración: el registro y el inicio de sesión reales aún no están conectados.</span></p>';
  }

  function field(id, label, type, ac, ph){
    return '<div class="au-field"><label for="' + id + '">' + label + '</label>' +
      '<input id="' + id + '" type="' + type + '" autocomplete="' + ac + '"' + (ph ? ' placeholder="' + ph + '"' : '') + ' aria-describedby="' + id + 'Err">' +
      '<p class="au-err" id="' + id + 'Err" hidden></p></div>';
  }

  function accountView(){
    return '<div class="au-account">' +
      '<span class="au-demo-badge">Modo demostración</span>' +
      '<p class="au-hello">Hola, <b>' + U.escape(session.name) + '</b></p>' +
      '<p class="au-sub">Esta sesión existe solo en esta pestaña. No hay cuenta real ni datos guardados.</p>' +
      '<label class="au-check"><input type="checkbox" id="auMktToggle"' + (session.marketingOptIn ? ' checked' : '') + '><span><b>Recibir novedades y promociones por correo.</b> Puedes activarlo o retirarlo cuando quieras. (En la versión real, esta elección se registrará en el servidor.)</span></label>' +
      '<button type="button" class="au-submit au-submit--ghost" data-logout>Salir del modo demostración</button>' +
    '</div>';
  }

  function setErr(id, msg){
    var e = root.querySelector('#' + id + 'Err'), i = root.querySelector('#' + id);
    e.textContent = msg || ''; e.hidden = !msg; i.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  function showResult(html){
    var r = root.querySelector('[data-result]'); r.innerHTML = html; r.hidden = false;
  }

  function bind(){
    root.onclick = function(e){
      var t = e.target;
      if (t.closest('[data-google]')){ root.querySelector('[data-google-note]').hidden = false; return; }
      if (t.closest('.au-tab')){ selectTab(t.closest('.au-tab').id === 'auTabUp'); return; }
      if (t.closest('[data-demo]')){
        session = { name: t.closest('[data-demo]').getAttribute('data-demo') || 'Invitado', marketingOptIn: t.closest('[data-demo]').getAttribute('data-mkt') === '1' };
        render(); emit(); return;
      }
      if (t.closest('[data-logout]')){ session = null; render(); emit(); return; }
    };
    root.onchange = function(e){ if (e.target.id === 'auMktToggle' && session){ session.marketingOptIn = e.target.checked; } };
    root.onkeydown = function(e){
      if (!e.target.classList.contains('au-tab')) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft'){ e.preventDefault(); selectTab(e.target.id === 'auTabIn', true); }
    };
    var fin = root.querySelector('#auIn'), fup = root.querySelector('#auUp');
    if (fin) fin.onsubmit = function(e){
      e.preventDefault();
      var ok = setErr('auInEmail', EMAIL.test(val('auInEmail')) ? '' : 'Escribe un correo válido.');
      ok = setErr('auInPass', val('auInPass') ? '' : 'Escribe tu contraseña.') && ok;
      root.querySelector('#auInPass').value = '';                 // nunca se conserva la contraseña
      if (!ok) return;
      showResult('<p><b>No se ha iniciado sesión.</b> El acceso con correo aún no está conectado a un servidor.</p>' +
        '<button type="button" class="rv-linkbtn" data-demo="Invitado">Probar la interfaz en modo demostración</button>');
    };
    if (fup) fup.onsubmit = function(e){
      e.preventDefault();
      var name = val('auUpName').trim();
      var ok = setErr('auUpName', name.length >= 2 ? '' : 'Escribe tu nombre (mínimo 2 caracteres).');
      ok = setErr('auUpEmail', EMAIL.test(val('auUpEmail')) ? '' : 'Escribe un correo válido.') && ok;
      ok = setErr('auUpPass', val('auUpPass').length >= 8 ? '' : 'La contraseña debe tener al menos 8 caracteres.') && ok;
      root.querySelector('#auUpPass').value = '';
      if (!ok) return;
      var mkt = root.querySelector('#auUpMkt').checked;
      showResult('<p><b>No se ha creado ninguna cuenta.</b> El registro real requiere un servidor de autenticación que aún no está configurado.</p>' +
        '<button type="button" class="rv-linkbtn" data-demo="' + U.escape(name) + '" data-mkt="' + (mkt ? '1' : '0') + '">Probar la interfaz en modo demostración como «' + U.escape(name) + '»</button>');
    };
  }
  function val(id){ return root.querySelector('#' + id).value; }

  function selectTab(up, focus){
    var a = root.querySelector('#auTabIn'), b = root.querySelector('#auTabUp');
    a.setAttribute('aria-selected', String(!up)); b.setAttribute('aria-selected', String(up));
    a.tabIndex = up ? -1 : 0; b.tabIndex = up ? 0 : -1;
    root.querySelector('#auIn').hidden = up; root.querySelector('#auUp').hidden = !up;
    root.querySelector('[data-result]').hidden = true;
    if (focus) (up ? b : a).focus();
  }

  function render(){ root.innerHTML = view(); bind(); }

  R.Auth = {
    init: function(){
      root = document.querySelector('#win-cuenta .au-body');
      render();
    },
    open: function(opener){
      render();
      window.DaEnzo.openWindow('cuenta', opener);
    },
    session: function(){ return session; },

    /* ---------- Google One Tap (solo cuando esté configurado) ----------
       Con reviews.auth.googleClientId y googleEndpoint definidos, se carga la
       librería oficial de Google Identity Services y se muestra SU aviso
       («Continuar como …»). Al aceptarlo, Google entrega un token que se envía
       al servidor para verificarlo y crear/abrir la cuenta automáticamente.
       Sin configuración, devuelve false y no se carga nada de Google. */
    googleReady: function(){
      var A = window.DAENZO_CONFIG.reviews.auth;
      return !!(A && A.googleClientId && A.googleEndpoint);
    },
    googlePrompt: function(onDone){
      var A = window.DAENZO_CONFIG.reviews.auth;
      if (!R.Auth.googleReady()) return false;
      function run(){
        google.accounts.id.initialize({
          client_id: A.googleClientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
          callback: function(resp){
            fetch(A.googleEndpoint, { method:'POST', credentials:'include',
              headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ credential: resp.credential }) })
              .then(function(r){ if (!r.ok) throw new Error('auth'); return r.json(); })
              .then(function(user){ session = { name: user.name, marketingOptIn: !!user.marketingOptIn, real: true }; render(); emit(); onDone && onDone(true); })
              .catch(function(){ onDone && onDone(false); });
          }
        });
        google.accounts.id.prompt();
      }
      if (window.google && google.accounts && google.accounts.id) run();
      else {
        var sc = document.createElement('script');
        sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true; sc.onload = run;
        document.head.appendChild(sc);
      }
      return true;
    },
    onChange: function(fn){ listeners.push(fn); }
  };
})();
