/* =========================================================
   CONFIGURACIÓN DE LA SECCIÓN RESEÑAS
   Se añade a la configuración central DAENZO_CONFIG.
   ========================================================= */
(function(){
  var C = window.DAENZO_CONFIG = window.DAENZO_CONFIG || {};
  C.reviews = {
    route: '#resenas',
    /* Encabezado: video en bucle (assets/resenas/resenas-loop.webm/.mp4) definido en index.html */

    form: {
      commentMaxLength: 600,                 // caracteres
      maxPhotos: 4,
      maxPhotoSizeMB: 5,
      acceptedTypes: ['image/jpeg','image/png','image/webp'],
      encourageAutoHideMs: 7000              // el mensaje de incentivo se retira solo
    },

    /* Frases rápidas: etiqueta visible + cláusula para redactar el texto sugerido.
       kind 'desc'  → se une con otras ("la masa estaba deliciosa y la atención fue muy buena")
       kind 'self'  → oración propia en primera persona ("Volvería a repetir.") */
    quickPhrases: [
      { id:'sabor',      label:'Excelente sabor',               clause:'el sabor era excelente',              kind:'desc' },
      { id:'masa',       label:'Masa deliciosa',                clause:'la masa estaba deliciosa',            kind:'desc' },
      { id:'atencion',   label:'Muy buena atención',            clause:'la atención fue muy buena',           kind:'desc' },
      { id:'ingred',     label:'Ingredientes de calidad',       clause:'los ingredientes eran de calidad',    kind:'desc' },
      { id:'ambiente',   label:'Ambiente agradable',            clause:'el ambiente era agradable',           kind:'desc' },
      { id:'precio',     label:'Buena relación calidad-precio', clause:'la relación calidad-precio fue buena',kind:'desc' },
      { id:'condicion',  label:'Llegó en buenas condiciones',   clause:'el pedido llegó en buenas condiciones',kind:'desc' },
      { id:'repetir',    label:'Volvería a repetir',            clause:'volvería a repetir',                  kind:'self' }
    ],

    /* «Dejar una reseña en Google»: permanece oculto hasta tener el enlace OFICIAL
       de reseñas del Perfil de Empresa (no inventar ni usar un enlace genérico). */
    googleReviewUrl: null,

    /* «Ordenar mi pedido»: ruta de la futura sección. Si no hay manejador
       registrado en DaEnzo.routes, se muestra un aviso de «próximamente». */
    orderRoute: '#ordenar',

    /* Autenticación: sin proveedor configurado en esta fase. */
    auth: {
      provider: null,          // p. ej. 'firebase' | 'supabase' | 'auth0' | backend propio
      googleClientId: null,    // ID de cliente OAuth de Google (nunca un secreto en el frontend)
      googleEndpoint: null     // URL del servidor que verifica el token de Google y crea/abre la cuenta
    },

    /* Aviso para iniciar sesión al entrar en Reseñas (mismo patrón que el panel de redes) */
    loginPrompt: {
      initialDelayMs: 2500,    // tras entrar en Reseñas
      reappearMs:     120000,  // si se cierra o se ignora, vuelve a sugerirse ~2 min después
      autoHideMs:     20000,   // si no se usa, se retira solo
      retryMs:        6000     // si no es buen momento (escribiendo, ventana abierta), se aplaza
    }
  };
})();
