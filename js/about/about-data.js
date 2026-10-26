/* =========================================================
   «SOBRE NOSOTROS» — CONTENIDO DE DEMOSTRACIÓN
   ---------------------------------------------------------
   ⚠ TODO EL CONTENIDO DE ESTE ARCHIVO ES FICTICIO.
   Historia, fundador, familia, fechas (salvo 1989, que figura
   en el logo), anécdotas, platos e ingredientes se inventaron
   para la demostración, con autorización del cliente.
   SUSTITUIR por la información real antes del lanzamiento.

   Es la ÚNICA fuente de textos e imágenes de la sección:
   la interfaz (about-view.js) solo lee de aquí.
   ========================================================= */
(function(){
  var IMG = 'assets/nosotros/';

  window.DAENZO_ABOUT = {
    route: '#sobre-nosotros',
    isDemoContent: true,

    /* ---------- Personajes y fechas (ficticios) ---------- */
    founder:   { name: 'Vincenzo Marchetti', nickname: 'Enzo', origin: 'Calabria' },
    family:    { partner: 'Carmen', nextGeneration: 'Giulia' },
    founded:   1989,

    /* ---------- Portada ---------- */
    hero: {
      image: { src: IMG + 'hero-horno.jpg', alt: 'Pizzas horneándose en un horno de leña encendido', width: 1024, height: 1024 },
      brand: 'Da Enzo',
      brandSub: 'Pizzería',
      since: 'Desde 1989',
      title: 'Toda gran pizza tiene una historia.',
      titleAccent: 'Esta es la nuestra.',
      lead: 'Un horno encendido, un cuaderno de recetas y una familia que nunca dejó de poner la mesa.',
      scrollHint: 'Descubre cómo empezó'
    },

    /* ---------- Capítulo 1 · El origen ---------- */
    story: {
      chapter: 'Capítulo I',
      title: 'Cómo empezó todo',
      paragraphs: [
        'Vincenzo Marchetti —Enzo, para todos— llegó a Mérida desde Calabria con una maleta pequeña y un cuaderno de recetas de su madre, escrito a mano en un italiano que casi nadie más podía leer. Trabajó en panaderías, aprendió cómo se comporta la masa con el frío de la montaña y descubrió que aquí, como en su pueblo, las cosas buenas no se apuran.',
        'En 1989, junto a Carmen, su esposa merideña, alquiló un local de seis mesas y levantó con sus propias manos el primer horno de ladrillo. La primera noche vendieron once pizzas. Enzo todavía las recuerda todas, y a cada persona que se sentó a comerlas.',
        'Lo que empezó como un lugar para los vecinos se convirtió en punto de encuentro: cumpleaños que se celebraban entre mesas de cuadros, estudiantes que compartían una pizza grande entre cinco y clientes que volvían cada viernes sin necesidad de mirar el menú. Aquel cuaderno pasó a ser lo que hoy llamamos nuestro secreto de familia.'
      ],
      quote: { text: 'La masa no se apura. La gente tampoco.', author: 'Enzo' },
      milestones: [
        { year: '1989', text: 'Seis mesas y el primer horno de ladrillo.' },
        { year: '1998', text: 'Llegan los pastichos de Carmen a la carta.' },
        { year: '2012', text: 'Giulia, la hija de Enzo, entra a la cocina.' },
        { year: '2023', text: 'Nuevo local y una identidad renovada.' }
      ]
    },

    /* ---------- Evolución del logo ---------- */
    logos: [
      { src: IMG + 'logo-antiguo.jpg', width: 900, height: 900,
        alt: 'Logo antiguo de Pizzería Da Enzo: un chef sonriente con gorro y bigote, y el lema «Secreto de familia»',
        label: 'Nuestro logo antiguo', period: '1994 – 2022',
        caption: 'El chef sonriente que un cliente dibujó en una servilleta y que nos acompañó casi treinta años.' },
      { src: 'assets/logo-da-enzo.png', width: 447, height: 447,
        alt: 'Logo actual de Da Enzo Pizzería: gorro de chef y bigote en crema sobre verde oliva, 1989',
        label: 'Nuestra identidad actual', period: 'Desde 2023',
        caption: 'El gorro, el bigote y el guiño de siempre, en una versión más sencilla: la misma familia, con otra mirada.' }
    ],

    /* ---------- Capítulo 2 · Especialidades ---------- */
    specialties: {
      chapter: 'Capítulo II',
      title: 'Nuestras especialidades',
      band: { src: IMG + 'especialidades-fondo.jpg', alt: 'Lasaña recién horneada sobre una mesa de madera en una cocina con horno de leña', width: 1024, height: 434 },
      intro: 'Cada especialidad tiene su propia personalidad. Algunas nacieron en el cuaderno de la familia; otras, de una noche de mucho trabajo o de un cliente que pidió «lo de siempre, pero distinto».',
      narrative: [
        'Aquí no hay platos de relleno. Cada uno tardó años en quedarse en la carta y tiene a alguien detrás: una abuela, un error afortunado, una celebración. Por eso los preparamos igual que el primer día, con tiempo y sin atajos.',
        'Toca cada plato para conocer su historia. Y si alguno te hace volver, ya sabes por qué: es el sabor que te hace volver.'
      ],
      items: [
        { id:'tagliatelle', name:'Tagliatelle de la Nonna', tag:'Pasta fresca',
          image:{ src: IMG + 'plato-tagliatelle.jpg', alt:'Tagliatelle con ragú de carne, parmesano y albahaca' },
          short:'Seis horas de ragú y la paciencia de un domingo.',
          ingredients:['Tagliatelle hechos a mano','Ragú de res y cerdo a fuego lento','Parmesano','Albahaca fresca'],
          story:'Es la primera receta del cuaderno de la madre de Enzo. En Calabria se servía los domingos, cuando toda la familia se sentaba a la mesa. Aquí la seguimos cocinando igual: el ragú empieza temprano y se sirve cuando está listo, no antes.' },
        { id:'calzone', name:'Calzone Segreto', tag:'Del horno de leña',
          image:{ src: IMG + 'plato-calzone.jpg', alt:'Calzone abierto con mozzarella fundida y pepperoni' },
          short:'Nació de un accidente y se quedó para siempre.',
          ingredients:['Masa madre de 48 horas','Mozzarella fior di latte','Pepperoni','Ricotta y salsa de la casa'],
          story:'Una noche de 1991 una pizza se dobló al sacarla del horno. Enzo iba a repetirla, pero el cliente la probó y pidió otra «exactamente igual». Desde entonces el relleno es secreto y la masa se dobla a propósito.' },
        { id:'la89', name:'La 89', tag:'La de siempre',
          image:{ src: IMG + 'plato-la89.jpg', alt:'Pizza de pepperoni con borde inflado y romero' },
          short:'Un homenaje a la primera noche, en 1989.',
          ingredients:['Salsa de tomate de la casa','Mozzarella','Pepperoni tostado','Orégano y romero'],
          story:'Fue la primera pizza que salió del horno el día que abrimos. La llamamos así para no olvidar de dónde venimos: sencilla, con el borde inflado y tostado, y ese pepperoni que se dora en los bordes.' },
        { id:'cheesecake', name:'Cheesecake de Mora Andina', tag:'El postre de Carmen',
          image:{ src: IMG + 'plato-cheesecake.jpg', alt:'Porción de cheesecake con compota de frutos rojos y moras' },
          short:'Un postre italiano con sabor a montaña.',
          ingredients:['Queso crema y ricotta','Base de galleta tostada','Compota de mora andina','Frutos rojos frescos'],
          story:'Carmen quería un postre que supiera a Mérida. Probó con fresas, con guayaba y con parchita, hasta que una tarde llegó una cesta de moras del páramo. Desde ese día no volvió a cambiar la receta.' }
      ]
    },

    /* ---------- Capítulo 3 · Los locales ---------- */
    places: {
      chapter: 'Capítulo III',
      title: 'Nuestros locales',
      intro: 'Los espacios cambian y las historias siguen creciendo. Cada etapa forma parte del camino de Da Enzo y de los momentos compartidos alrededor de sus mesas.',
      old: {
        title: 'Nuestro antiguo local', period: '1989 – 2023',
        text: 'Seis mesas que se convirtieron en veinte, manteles de cuadros, paredes de ladrillo llenas de fotos de clientes y el horno siempre a la vista. Allí aprendimos casi todo lo que sabemos.',
        photos: [
          { src: IMG + 'antiguo-1.jpg', width: 1024, height: 559, alt:'Salón con mesas de manteles de cuadros rojos y paredes de ladrillo', caption:'El salón de los primeros años' },
          { src: IMG + 'antiguo-2.jpg', width: 1024, height: 572, alt:'Comensales cenando bajo paredes cubiertas de fotos enmarcadas', caption:'Las paredes de la memoria: fotos de clientes y amigos' },
          { src: IMG + 'antiguo-3.jpg', width: 1024, height: 559, alt:'Entrada del antiguo local con clientes en las mesas', caption:'La puerta donde se formaban las filas de los viernes' }
        ]
      },
      current: {
        title: 'Nuestro local actual', period: 'Desde 2023',
        text: 'Más espacio, más luz y la misma cocina abierta. Nos mudamos con el horno, las recetas y con quienes nos acompañan desde el principio.',
        photos: [
          { src: IMG + 'actual-1.jpg', width: 506, height: 900, alt:'Vespa clásica bajo el letrero luminoso de Da Enzo', caption:'La Vespa que te da la bienvenida' },
          { src: IMG + 'actual-2.jpg', width: 506, height: 900, alt:'Salón amplio con lámparas cálidas y la barra Da Enzo al fondo', caption:'Un salón pensado para compartir' },
          { src: IMG + 'actual-3.jpg', width: 506, height: 900, alt:'Mesa de madera con el letrero DA ENZO reflejado', caption:'La barra, el corazón de la casa' },
          { src: IMG + 'actual-4.jpg', width: 506, height: 900, alt:'Letrero circular iluminado con el logo de Da Enzo', caption:'Nuestra identidad, encendida' }
        ]
      },
      closing: 'Treinta y cinco años después, la mesa sigue puesta. Cambiaron las paredes; el sabor que te hace volver es el mismo.'
    },

    carouselIntervalMs: 5000,          // rotación automática de logos y galerías
    pauseAfterInteractionMs: 12000,    // tras usar las flechas, la rotación espera antes de seguir
    demoNote: 'Historia y contenidos ilustrativos de demostración.'
  };
})();
