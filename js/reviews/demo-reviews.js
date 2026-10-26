/* =========================================================
   DATOS DE DEMOSTRACIÓN — RESEÑAS FICTICIAS
   ---------------------------------------------------------
   Contenido inventado únicamente para diseñar y probar la
   interfaz. NO son opiniones reales, NO proceden de Google
   y NO representan compras verificadas.

   Estructura de cada reseña:
     id          identificador único
     authorName  nombre ficticio
     avatarUrl   ruta a una foto de perfil (null → avatar con iniciales)
     rating      1 a 5
     comment     texto ('' = valoración sin comentario)
     photos      [{ src, alt }]  (fotos de demostración del propio proyecto)
     date        'AAAA-MM' de demostración
     isDemo      true
   Para sustituirlas por reseñas reales basta con cambiar esta
   lista (o cargarla desde el backend con la misma forma).
   ========================================================= */
(function(){
  var P = 'assets/resenas/demo/';
  function photo(file, alt){ return { src: P + file, alt: alt }; }

  window.DaEnzoReviews = window.DaEnzoReviews || {};
  window.DaEnzoReviews.demoReviews = [
    { id:'demo-01', authorName:'Valentina R.', avatarUrl:null, rating:5, date:'2026-09',
      comment:'Pedimos la margarita y la de pepperoni para compartir. La masa tiene ese borde inflado y un poco tostado que me encanta, y el tomate sabe a tomate de verdad. Nos atendieron rápido aunque el local estaba lleno. Ya estamos planeando volver con la familia.',
      photos:[ photo('margarita.jpg','Pizza margarita con mozzarella y albahaca (foto de demostración)'), photo('pepperoni.jpg','Pizza de pepperoni con hierbas (foto de demostración)') ], isDemo:true },

    { id:'demo-02', authorName:'Andrés M.', avatarUrl:null, rating:5, date:'2026-09',
      comment:'Excelente masa.', photos:[], isDemo:true },

    { id:'demo-03', authorName:'Carolina P.', avatarUrl:null, rating:4, date:'2026-08',
      comment:'Muy rica la blanca de hongos, con bastante queso. Le quitaría una estrella solo porque tardó un poco más de lo que nos dijeron al recogerla, pero llegó caliente a la casa.',
      photos:[ photo('hongos-blanca.jpg','Pizza blanca de hongos y queso (foto de demostración)') ], isDemo:true },

    { id:'demo-04', authorName:'Luis Fernando G.', avatarUrl:null, rating:5, date:'2026-08',
      comment:'', photos:[], isDemo:true },

    { id:'demo-05', authorName:'Daniela S.', avatarUrl:null, rating:3, date:'2026-07',
      comment:'La pizza estaba buena, pero esperaba un poco más de ingredientes en la de hongos con salchicha. La atención fue amable. Probaré otra la próxima vez.',
      photos:[ photo('hongos-salchicha.jpg','Pizza de hongos con salchicha (foto de demostración)') ], isDemo:true },

    { id:'demo-06', authorName:'José Gregorio T.', avatarUrl:null, rating:5, date:'2026-07',
      comment:'Fuimos un sábado al mediodía y el ambiente estaba muy agradable, se siente el olor del horno apenas entras. La de salami con aceitunas y pimentón asado fue la sorpresa de la mesa: intensa y bien equilibrada. Los pastichos también se veían muy bien, quedaron pendientes para la próxima visita.',
      photos:[ photo('mixta-salami.jpg','Pizza de salami, aceitunas y pimentón asado (foto de demostración)'), photo('margarita.jpg','Pizza margarita recién salida del horno (foto de demostración)'), photo('hongos-salchicha.jpg','Pizza de hongos con salchicha (foto de demostración)'), photo('hongos-ricotta.jpg','Pizza blanca de hongos y ricotta (foto de demostración)'), photo('pepperoni.jpg','Pizza de pepperoni (foto de demostración)'), photo('hongos-blanca.jpg','Pizza blanca de hongos (foto de demostración)') ], isDemo:true },

    { id:'demo-07', authorName:'María Alejandra V.', avatarUrl:null, rating:4, date:'2026-06',
      comment:'Buena experiencia. Volvería a pedir.', photos:[], isDemo:true },

    { id:'demo-08', authorName:'Ricardo L.', avatarUrl:null, rating:2, date:'2026-06',
      comment:'Esta vez el pedido llegó tibio y la masa algo blanda por el viaje. Escribí por WhatsApp y me respondieron con amabilidad. Les doy otra oportunidad comiendo allá.',
      photos:[], isDemo:true },

    { id:'demo-09', authorName:'Gabriela F.', avatarUrl:null, rating:5, date:'2026-05',
      comment:'Ingredientes frescos y se nota. La blanca de hongos con ricotta es mi favorita: los hongos salen dorados del horno y la ricotta le da suavidad.',
      photos:[ photo('hongos-ricotta.jpg','Pizza blanca de hongos y ricotta (foto de demostración)'), photo('hongos-blanca.jpg','Pizza blanca de hongos (foto de demostración)') ], isDemo:true },

    { id:'demo-10', authorName:'Héctor P.', avatarUrl:null, rating:4, date:'2026-05',
      comment:'Muy buena atención y precios razonables para la calidad.', photos:[], isDemo:true },

    { id:'demo-11', authorName:'Sofía C.', avatarUrl:null, rating:3, date:'2026-04',
      comment:'Correcta. Nada que reprochar, aunque no me pareció muy distinta a otras pizzerías de la zona.',
      photos:[], isDemo:true },

    { id:'demo-12', authorName:'Manuela B.', avatarUrl:null, rating:5, date:'2026-04',
      comment:'Muy rica.', photos:[ photo('pepperoni.jpg','Pizza de pepperoni recién salida del horno (foto de demostración)') ], isDemo:true }
  ];
})();
