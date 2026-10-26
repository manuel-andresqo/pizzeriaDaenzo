/* =========================================================
   «ORDENAR MI PEDIDO» — CATÁLOGO DE DEMOSTRACIÓN
   ---------------------------------------------------------
   Nombres e ingredientes:
     source:'carta' → tomados de la carta real de Da Enzo.
     source:'demo'  → inventados para la demostración.
   ⚠ PRECIOS FICTICIOS (USD, en céntimos) para probar el carrito.
     No son precios oficiales: sustituir antes del lanzamiento.
   Fotografías: de demostración; varias se comparten entre platos.
   Es la ÚNICA fuente de datos del menú: los componentes solo leen de aquí.
   ========================================================= */
(function(){
  var I = 'assets/pedido/';
  function img(f, alt, pos){ return { src: I + f, alt: alt, pos: pos || '50% 50%' }; }

  /* ---------- Variantes reutilizables ---------- */
  var PIZZA_SIZES = [
    { id:'individual', label:'Individual', note:'25 cm', delta:0 },
    { id:'mediana',    label:'Mediana',    note:'33 cm', delta:450 },
    { id:'familiar',   label:'Familiar',   note:'40 cm', delta:900 }
  ];
  var PASTA_TYPES = [      // de la carta: «Rigatoni, Penne (Plumita), Ravioli, Linguini y Fettuccine»
    { id:'fettuccine', label:'Fettuccine', delta:0 },
    { id:'linguini',   label:'Linguini',   delta:0 },
    { id:'rigatoni',   label:'Rigatoni',   delta:0 },
    { id:'penne',      label:'Penne (Plumita)', delta:0 },
    { id:'ravioli',    label:'Ravioli',    delta:200 }
  ];

  /* ---------- Ingredientes adicionales (precio por unidad) ---------- */
  var EXTRAS = {
    mozzarella:  { label:'Extra de mozzarella', price:150 },
    pepperoni:   { label:'Pepperoni adicional',  price:200 },
    champinon:   { label:'Champiñones',          price:120 },
    aceitunas:   { label:'Aceitunas negras',     price:100 },
    jamon:       { label:'Jamón',                price:150 },
    tocineta:    { label:'Tocineta',             price:180 },
    albahaca:    { label:'Albahaca fresca',      price:80  },
    rucula:      { label:'Rúcula',               price:100 },
    maiz:        { label:'Maíz',                 price:80  },
    anchoa:      { label:'Anchoas',              price:150 },
    pecorino:    { label:'Pecorino',             price:180 },
    parmesano:   { label:'Parmesano extra',      price:150 },
    pollo:       { label:'Pollo a la plancha',   price:250 },
    camarones:   { label:'Camarones salteados',  price:350 },
    salsaBlanca: { label:'Cambiar a salsa blanca', price:0 },
    nutella:     { label:'Topping de Nutella',   price:150 },
    frutos:      { label:'Frutos rojos',         price:150 },
    bolaHelado:  { label:'Bola de helado',       price:200 }
  };
  var PIZZA_EXTRAS = ['mozzarella','pepperoni','champinon','aceitunas','jamon','tocineta','albahaca','rucula','maiz','anchoa'];
  var PASTA_EXTRAS = ['parmesano','pecorino','pollo','camarones','champinon','tocineta'];

  window.DAENZO_MENU = {
    currency: 'USD',
    isDemoPricing: true,
    priceNote: 'Precios de demostración',
    extras: EXTRAS,

    hero: {
      image: img('hero-pedido.jpg', 'Mesa de madera con tomates, mozzarella, pepperoni, albahaca y bolas de masa frente al horno de leña', '60% 50%'),
      brand: 'Da Enzo',
      title: 'Tu próxima pizza favorita empieza aquí.',
      lead: 'Explora nuestras especialidades, personaliza tus favoritos y prepara tu pedido a tu manera.',
      aside: 'Masa de 48 horas · horno de leña · secreto de familia',
      /* textos del modo Delivery (mismo menú, mismas fotos y precios) */
      delivery: {
        title: 'Tu próxima pizza favorita, hasta tu puerta.',
        lead: 'Elige tus favoritos, personaliza tu pedido y prepárate para disfrutar Da Enzo en casa.',
        aside: 'Recién salida del horno de leña · directo a tu mesa en casa'
      }
    },

    /* ---------- Categorías (orden de la navegación) ---------- */
    categories: [
      { id:'pizzas', label:'Pizzas', title:'Pizzas', kicker:'Del horno de leña',
        intro:'Masa de larga fermentación, salsa de la casa y el borde inflado que sale tostado del horno. Elige tu tamaño y hazla tuya.',
        image: img('cat-pizzas.jpg','Pizzas horneándose dentro del horno de leña'),
        groups: [
          { id:'especialidades', label:'Especialidades', note:'Las recetas de la casa' },
          { id:'tradicionales',  label:'Tradicionales',  note:'Las de siempre' },
          { id:'del-mar',        label:'Del Mar',        note:'Con salsa roja o blanca' },
          { id:'vegetales',      label:'De vegetales',   note:'Del huerto al horno' }
        ] },
      { id:'pastichos', label:'Pastichos', title:'Pastichos', kicker:'Al horno, capa por capa',
        intro:'Láminas de pasta, bechamel y ragú que se arman a mano cada mañana y se gratinan hasta dorar.',
        image: img('cat-pastichos.jpg','Chef armando un pasticho capa por capa en la cocina', '50% 40%') },
      { id:'pastas', label:'Pastas', title:'Pastas', kicker:'Pasta fresca',
        intro:'Escoge tu pasta: Rigatoni, Penne (Plumita), Ravioli, Linguini o Fettuccine. La salsa la ponemos nosotros.',
        image: img('cat-pastas.jpg','Máquina de pasta fresca con espaguetis recién cortados') },
      { id:'bebidas', label:'Bebidas', title:'Bebidas', kicker:'Para acompañar',
        intro:'Refrescos, batidos, cervezas, cócteles de la casa y café recién hecho.' },
      { id:'postres', label:'Postres', title:'Postres', kicker:'El final feliz',
        intro:'Para cerrar la mesa con algo dulce: recetas de la familia y helados del día.',
        image: img('cat-postres.jpg','Chef emplatando tiramisú junto a helados y cannoli', '50% 45%') }
    ],

    /* ---------- Productos ---------- */
    products: [
      /* === PIZZAS · ESPECIALIDADES (carta) === */
      { id:'iberica', category:'pizzas', group:'especialidades', source:'carta', name:'Ibérica',
        short:'Chorizo español, aceitunas y pimentón sobre salsa trocitos.',
        description:'Chorizo español con aceitunas negras, maíz, cebolla o pimentón a elección, sobre salsa con trocitos de tomate y mozzarella. Intensa, con ese toque ahumado del chorizo al dorarse.',
        ingredients:['Chorizo español','Aceitunas / maíz / cebolla o pimentón','Salsa trocitos','Mozzarella'],
        price:1150, variants:PIZZA_SIZES, extras:PIZZA_EXTRAS,
        images:[ img('pz-iberica.jpg','Pizza con embutido, aceitunas y pimentón asado') ] },
      { id:'calzone', category:'pizzas', group:'especialidades', source:'carta', name:'Calzone',
        short:'Cerrada al horno: jamón, salchichón, champiñón y alcachofa.',
        description:'Masa doblada y horneada con jamón, salchichón, champiñón y alcachofa, salsa roja a base de cebollín y mozzarella que se funde por dentro.',
        ingredients:['Jamón','Salchichón','Champiñón','Alcachofa','Salsa de cebollín','Mozzarella'],
        price:1250, variants:[ { id:'unico', label:'Tamaño único', delta:0 } ], extras:['mozzarella','pepperoni','champinon','jamon','tocineta'],
        images:[ img('pz-calzone.jpg','Calzone abierto con mozzarella fundida y pepperoni') ] },
      { id:'bianca', category:'pizzas', group:'especialidades', source:'carta', name:'Bianca',
        short:'Salsa blanca de crema, tocineta, champiñón y pecorino.',
        description:'Salsa blanca a base de crema de leche, tocineta, champiñón, cebolla, pecorino y mozzarella. Suave, cremosa y con el punto salado de la tocineta.',
        ingredients:['Salsa blanca de crema de leche','Tocineta','Champiñón','Cebolla','Pecorino','Mozzarella'],
        price:1200, variants:PIZZA_SIZES, extras:PIZZA_EXTRAS,
        images:[ img('pz-bianca-1.jpg','Pizza blanca con hongos y carne'), img('pz-bianca-2.jpg','Pizza blanca de hongos con queso fundido') ] },
      { id:'caprichosa', category:'pizzas', group:'especialidades', source:'carta', name:'Caprichosa',
        short:'Jamón y champiñón, con aceitunas, maíz, cebolla o pimentón.',
        description:'Jamón y champiñón con el toque que prefieras: aceitunas negras, maíz, cebolla o pimentón. Mozzarella y salsa de la casa.',
        ingredients:['Jamón','Champiñón','Aceitunas / maíz / cebolla o pimentón','Mozzarella','Salsa'],
        price:1100, variants:PIZZA_SIZES, extras:PIZZA_EXTRAS,
        images:[ img('pz-caprichosa.jpg','Pizza con jamón, alcachofas, aceitunas negras y albahaca') ] },

      /* === PIZZAS · TRADICIONALES (carta) === */
      { id:'margarita', category:'pizzas', group:'tradicionales', source:'carta', name:'Margarita',
        short:'Mozzarella y salsa. La que nunca falla.',
        description:'La más sencilla y la que mejor muestra la masa: salsa de tomate de la casa, mozzarella y albahaca fresca al salir del horno.',
        ingredients:['Mozzarella','Salsa de tomate','Albahaca'],
        price:850, variants:PIZZA_SIZES, extras:PIZZA_EXTRAS,
        images:[ img('pz-margarita.jpg','Pizza margarita con mozzarella y albahaca') ] },
      { id:'pepperoni', category:'pizzas', group:'tradicionales', source:'carta', name:'Pepperoni',
        short:'Pepperoni tostado en los bordes, mozzarella y salsa.',
        description:'Pepperoni que se dora y se curva en el horno, mozzarella fundida, salsa de la casa y un toque de orégano y romero.',
        ingredients:['Pepperoni','Mozzarella','Salsa','Orégano'],
        price:950, variants:PIZZA_SIZES, extras:PIZZA_EXTRAS,
        images:[ img('pz-pepperoni-1.jpg','Pizza de pepperoni con romero servida en plato'), img('pz-pepperoni-2.jpg','Primer plano de pizza de pepperoni humeante'), img('pz-pepperoni-3.jpg','Pizza de pepperoni vista desde arriba') ] },
      { id:'champinon', category:'pizzas', group:'tradicionales', source:'carta', name:'Champiñón',
        short:'Champiñones, anchoa, mozzarella y salsa.',
        description:'Champiñones laminados, anchoa, mozzarella y salsa. Clásica y terrosa; pídela sin anchoa si lo prefieres.',
        ingredients:['Champiñones','Anchoa','Mozzarella','Salsa'],
        price:900, variants:PIZZA_SIZES, extras:PIZZA_EXTRAS,
        images:[ img('pz-champinon.jpg','Pizza de champiñones con hierbas', '50% 35%') ] },

      /* === PIZZAS · DEL MAR (carta) === */
      { id:'gamberi', category:'pizzas', group:'del-mar', source:'carta', name:'Gamberi',
        short:'Camarones salteados, cebolla morada y pimentón.',
        description:'Camarones salteados, cebolla morada, pimentón rojo en cuadros y mozzarella, con salsa a elección: roja o blanca.',
        ingredients:['Camarones salteados','Cebolla morada','Pimentón rojo','Mozzarella','Salsa roja o blanca'],
        price:1450, variants:PIZZA_SIZES, extras:['camarones','mozzarella','rucula','albahaca','salsaBlanca'],
        images:[ img('pz-gamberi.jpg','Pizza de camarones con rúcula y tomates cherry', '50% 85%') ] },

      /* === PIZZAS · VEGETALES (carta) === */
      { id:'siciliana', category:'pizzas', group:'vegetales', source:'carta', name:'Siciliana',
        short:'Alcachofa, champiñón, orégano y salsa trocitos.',
        description:'Alcachofa y champiñón con aceitunas negras, maíz, cebolla o pimentón a elección, orégano, salsa trocitos y mozzarella.',
        ingredients:['Alcachofa','Champiñón','Aceitunas / maíz / cebolla o pimentón','Orégano','Salsa trocitos','Mozzarella'],
        price:1050, variants:PIZZA_SIZES, extras:PIZZA_EXTRAS,
        images:[ img('pz-siciliana.jpg','Pizza de hongos con ricotta y hierbas') ] },

      /* === PASTICHOS === */
      { id:'pasticcio', category:'pastichos', source:'carta', name:'Pasticcio de la casa',
        short:'Bolognesa, bechamel, jamón, mozzarella y pecorino.',
        description:'Láminas de pasta con salsa bolognesa, bechamel, jamón, mozzarella y pecorino, gratinado hasta que los bordes crujen.',
        ingredients:['Láminas de pasta','Salsa bolognesa','Bechamel','Jamón','Mozzarella','Pecorino'],
        price:1150, variants:[ { id:'porcion', label:'Porción', delta:0 }, { id:'doble', label:'Porción doble', delta:900 } ], extras:['parmesano','pecorino'],
        images:[ img('ps-clasico.jpg','Pasticho gratinado en fuente de barro') ] },
      { id:'pasticho-nonna', category:'pastichos', source:'demo', name:'Pasticho de la Nonna',
        short:'Ragú de seis horas y cuatro quesos, como los domingos.',
        description:'Receta de demostración: ragú de res y cerdo cocinado a fuego lento, ricotta, mozzarella, parmesano y pecorino entre láminas de pasta fresca.',
        ingredients:['Pasta fresca','Ragú de res y cerdo','Ricotta','Mozzarella','Parmesano','Pecorino'],
        price:1300, variants:[ { id:'porcion', label:'Porción', delta:0 }, { id:'doble', label:'Porción doble', delta:1000 } ], extras:['parmesano','pecorino'],
        images:[ img('ps-nonna.jpg','Chef armando un pasticho con ragú y queso') ] },
      { id:'pasticho-bianco', category:'pastichos', source:'demo', name:'Pasticho Bianco',
        short:'Pollo, champiñones y bechamel, sin tomate.',
        description:'Receta de demostración: pollo desmechado, champiñones salteados y bechamel con nuez moscada, gratinado con mozzarella.',
        ingredients:['Pollo desmechado','Champiñones','Bechamel','Mozzarella'],
        price:1250, variants:[ { id:'porcion', label:'Porción', delta:0 }, { id:'doble', label:'Porción doble', delta:950 } ], extras:['parmesano','tocineta'],
        images:[ img('ps-bianco.jpg','Pasticho gratinado servido en la mesa') ] },

      /* === PASTAS (carta, salvo indicación) === */
      { id:'carbonara', category:'pastas', source:'carta', name:'Carbonara',
        short:'Al estilo tradicional: yema, tocineta, pecorino y parmesano.',
        description:'Preparada al estilo tradicional con yema de huevo, tocineta dorada, pecorino y parmesano. Sin crema, como debe ser.',
        ingredients:['Yema de huevo','Tocineta','Pecorino','Parmesano','Pimienta negra'],
        price:1150, variants:PASTA_TYPES, extras:PASTA_EXTRAS,
        images:[ img('pa-carbonara-1.jpg','Carbonara servida frente al horno de leña'), img('pa-carbonara-2.jpg','Carbonara con tocineta y queso rallado'), img('pa-carbonara-3.jpg','Primer plano de pasta carbonara') ] },
      { id:'bolognesa', category:'pastas', source:'carta', name:'Bolognesa',
        short:'Salsa bolognesa y queso parmesano.',
        description:'Nuestra salsa bolognesa de cocción lenta con queso parmesano y albahaca fresca.',
        ingredients:['Salsa bolognesa','Parmesano','Albahaca'],
        price:1050, variants:PASTA_TYPES, extras:PASTA_EXTRAS,
        images:[ img('pa-bolognesa-1.jpg','Tagliatelle a la bolognesa en la cocina'), img('pa-bolognesa-2.jpg','Primer plano de tagliatelle con bolognesa y parmesano') ] },
      { id:'gnocchi', category:'pastas', source:'demo', name:'Gnocchi alla Sorrentina',
        short:'Ñoquis gratinados con pomodoro, mozzarella y albahaca.',
        description:'Plato de demostración: ñoquis de papa en salsa pomodoro, gratinados con mozzarella fundida y albahaca.',
        ingredients:['Ñoquis de papa','Salsa pomodoro','Mozzarella','Albahaca'],
        price:1100, variants:[ { id:'gnocchi', label:'Ñoquis de papa', delta:0 } ], extras:['parmesano','pecorino','tocineta'],
        images:[ img('pa-gnocchi-1.jpg','Ñoquis gratinados con mozzarella y albahaca'), img('pa-gnocchi-2.jpg','Primer plano de ñoquis con queso fundido') ] },
      { id:'puttanesca', category:'pastas', source:'carta', name:'Puttanesca',
        short:'Ajo, aceitunas negras, anchoas, alcaparras y pomodoro.',
        description:'Ajo, aceite de oliva, aceitunas negras, anchoas y alcaparras en salsa de pomodoro. Sabrosa y directa.',
        ingredients:['Ajo','Aceite de oliva','Aceitunas negras','Anchoas','Alcaparras','Pomodoro'],
        price:1050, variants:PASTA_TYPES, extras:PASTA_EXTRAS,
        images:[ img('pa-pomodoro.jpg','Pasta fresca recién cortada junto a un plato con salsa de tomate') ] },

      /* === BEBIDAS (carta; precios ficticios) === */
      { id:'refresco', category:'bebidas', group:'bebidas', source:'carta', name:'Refresco', short:'Variedad de sabores.', cartImage: img('bebida-refresco.jpg','Lata de refresco sobre la barra', '50% 60%'),
        price:200, variants:[ { id:'lata', label:'Lata', delta:0 }, { id:'1-5l', label:'1,5 L', delta:250 } ] },
      { id:'agua', category:'bebidas', group:'bebidas', source:'carta', name:'Agua mineral', short:'Con o sin gas.',
        price:150, variants:[ { id:'sin-gas', label:'Sin gas', delta:0 }, { id:'con-gas', label:'Con gas', delta:50 } ] },
      { id:'te', category:'bebidas', group:'bebidas', source:'carta', name:'Té Lipton', short:'Frío, en botella.', cartImage: img('bebida-te.jpg','Lata de té frío sobre la barra', '50% 60%'), price:200 },
      { id:'batido', category:'bebidas', group:'bebidas', source:'carta', name:'Batido de frutas', short:'Fruta de temporada, en agua o en leche.',
        price:300, variants:[ { id:'agua', label:'En agua', delta:0 }, { id:'leche', label:'En leche', delta:50 } ] },
      { id:'limonada', category:'bebidas', group:'bebidas', source:'carta', name:'Limonada frappé', short:'Limón recién exprimido y hielo frappé.', price:300 },
      { id:'cerveza', category:'bebidas', group:'bebidas', source:'carta', name:'Cerveza', short:'Nacional, importada o artesanal.',
        price:250, variants:[ { id:'nacional', label:'Nacional', delta:0 }, { id:'importada', label:'Importada', delta:150 }, { id:'artesanal', label:'Artesanal', delta:250 } ] },

      { id:'tinto-verano', category:'bebidas', group:'cocteles', source:'carta', name:'Tinto de Verano', cartImage: img('bebidas-cocteles.jpg','Tinto de verano con limón y romero', '42% 60%'), short:'Vino tinto, gaseosa de limón y zumo de limón.', price:550 },
      { id:'ragazza-rosa', category:'bebidas', group:'cocteles', source:'carta', name:'Ragazza Rosa', short:'Campari, limoncello, vino blanco, limón y gaseosa.', price:700 },
      { id:'passione', category:'bebidas', group:'cocteles', source:'carta', name:'Passione', short:'Campari, jarabe de parchita y frizzante blanco.', price:700 },
      { id:'milano', category:'bebidas', group:'cocteles', source:'carta', name:'Milano', short:'Vodka, limoncello, espumante de durazno y limón.', price:750 },
      { id:'spritz', category:'bebidas', group:'cocteles', source:'carta', name:'Spritz', short:'Frizzante seco y soda.',
        price:700, variants:[ { id:'aperol', label:'Aperol', delta:0 }, { id:'campari', label:'Campari', delta:0 } ] },

      { id:'espresso', category:'bebidas', group:'cafe', source:'carta', name:'Espresso', cartImage: img('bebidas-espresso.jpg','Espresso en taza de Da Enzo frente al horno', '50% 62%'),  short:'Corto e intenso.',
        price:200, variants:[ { id:'sencillo', label:'Sencillo', delta:0 }, { id:'doble', label:'Doble', delta:100 } ] },
      { id:'americano', category:'bebidas', group:'cafe', source:'carta', name:'Americano', cartImage: img('bebidas-espresso.jpg','Café negro en taza de Da Enzo frente al horno', '50% 62%'),  short:'Espresso alargado con agua caliente.', price:250 },
      { id:'latte', category:'bebidas', group:'cafe', source:'carta', name:'Latte', cartImage: img('bebidas-cafe.jpg','Capuchino en taza de Da Enzo', '50% 45%'),  short:'Espresso con leche cremosa.', price:350 },
      { id:'cappuccino', category:'bebidas', group:'cafe', source:'carta', name:'Cappuccino', cartImage: img('bebidas-cafe.jpg','Capuchino en taza de Da Enzo', '50% 45%'),  short:'Espresso, leche y espuma.', price:350 },
      { id:'mocaccino', category:'bebidas', group:'cafe', source:'carta', name:'Mocaccino', cartImage: img('bebidas-cafe.jpg','Capuchino en taza de Da Enzo', '50% 45%'),  short:'Espresso, chocolate y leche.', price:400 },
      { id:'frappuccino', category:'bebidas', group:'cafe', source:'carta', name:'Frappuccino', cartImage: img('bebidas-frappuccino.jpg','Frappuccino con crema y caramelo', '50% 45%'), short:'Café frío batido con hielo.',
        price:450, variants:[ { id:'cafe', label:'Café', delta:0 }, { id:'moca', label:'Moca', delta:50 }, { id:'caramelo', label:'Caramelo', delta:50 } ] },
      { id:'infusion', category:'bebidas', group:'cafe', source:'carta', name:'Infusión', short:'Fría o caliente.',
        price:250, variants:[ { id:'caliente', label:'Caliente', delta:0 }, { id:'fria', label:'Fría', delta:0 } ] },

      /* === POSTRES === */
      { id:'tiramisu', category:'postres', source:'demo', name:'Tiramisú della Casa',
        short:'Café, mascarpone y cacao, en capas.',
        description:'Postre de demostración: bizcochos empapados en espresso, crema de mascarpone y cacao amargo por encima.',
        ingredients:['Bizcochos de soletilla','Espresso','Mascarpone','Cacao'],
        price:650, extras:['bolaHelado'],
        images:[ img('po-tiramisu.jpg','Tiramisú en plato de porcelana sobre mesa de madera') ] },
      { id:'cheesecake', category:'postres', source:'demo', name:'Cheesecake de Mora Andina',
        short:'El postre de Carmen, con compota de mora del páramo.',
        description:'Postre de demostración: cheesecake cremoso sobre base de galleta, con compota de mora andina y frutos rojos.',
        ingredients:['Queso crema y ricotta','Base de galleta','Compota de mora','Frutos rojos'],
        price:600, extras:['frutos','bolaHelado'],
        images:[ img('po-cheesecake.jpg','Porción de cheesecake con compota de frutos rojos') ] },
      { id:'gelato', category:'postres', source:'carta', name:'Helados soft',
        short:'Sabores del día.',
        description:'Helados de los sabores del día. Pregunta a tu mesero cuáles hay hoy.',
        ingredients:['Sabores del día'],
        price:350, variants:[ { id:'1', label:'1 bola', delta:0 }, { id:'2', label:'2 bolas', delta:200 }, { id:'3', label:'3 bolas', delta:350 } ], extras:['nutella','frutos'],
        images:[ img('po-gelato.jpg','Copa de helado de chocolate, vainilla y pistacho') ] },
      { id:'postre-dia', category:'postres', source:'carta', name:'Postre del día',
        short:'La sorpresa dulce de la cocina.',
        description:'Cada día la cocina prepara un postre distinto. Tu mesero te contará cuál es el de hoy.',
        price:550,
        images:[ img('po-del-dia.jpg','Chef emplatando un postre en la cocina') ] }
    ],

    /* ---------- Bebidas: grupos y espacios fotográficos ---------- */
    drinks: {
      groups: [
        { id:'bebidas',  label:'Bebidas',  note:'Refrescos, batidos y cervezas' },
        { id:'cocteles', label:'Cócteles', note:'Los de la casa' },
        { id:'cafe',     label:'Café',     note:'Café, frappuccino e infusiones' }
      ],
      /* Fotos de los espacios de Cócteles y Café en la carta de bebidas.
         Las fotos de cada bebida (cartImage) solo se muestran en el carrito. */
      images: {
        cocteles: { src: I + 'bebidas-cocteles.jpg', alt:'Tinto de verano con limón y romero en la mesa' },
        cafe:     { src: I + 'bebidas-cafe.jpg',     alt:'Capuchino en taza de Da Enzo frente a la cafetera' },
        espresso: { src: I + 'bebidas-espresso.jpg', alt:'Espresso humeante en taza de Da Enzo, con el horno de leña al fondo' },
        frappuccino: { src: I + 'bebidas-frappuccino.jpg', alt:'Frappuccino con crema y caramelo en la barra' }
      }
    },

    /* ---------- Recomendaciones de la ventana de revisión ---------- */
    recommendations: {
      max: 3,
      byCategory: { bebidas:['limonada','tinto-verano','refresco'], postres:['tiramisu','cheesecake','gelato'], pizzas:['margarita','pepperoni'] }
    },

    /* ---------- Pedidos realizados ----------
       El botón «Ver mi pedido» desaparece a los 5 minutos del último pedido.
       Con panel administrativo: se quitará cuando la pizzería marque el pago. */
    placedOrders: { ttlMs: 5 * 60 * 1000 },

    /* ---------- Delivery ----------
       fee: null = la tarifa de envío NO está definida → se muestra «se confirmará»
       y no se suma al total. Cuando exista una tarifa real, poner el importe en
       céntimos (p. ej. 300 = $3,00) y aparecerá como línea independiente. */
    delivery: { fee: null },

    /* ---------- Mesas (preparado para QR / NFC) ---------- */
    tables: {
      param: 'mesa',          // …/index.html?mesa=12  o  #ordenar?mesa=12
      pattern: /^[0-9]{1,3}$/,
      registry: null          // cuando exista backend: lista o servicio de mesas válidas
    }
  };
})();
