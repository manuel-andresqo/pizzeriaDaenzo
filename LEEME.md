# Da Enzo Pizzería — Fase 1 (pantalla principal)

Abrir `index.html` con un servidor local (ej. `python3 -m http.server`) o subir la carpeta completa al hosting.

## Estructura
```
index.html                 HTML + CSS + JS autocontenidos
assets/logo-da-enzo.png    logo original
assets/daenzo-intro.(webm|mp4)   0,0 → 9,0 s del video original (se reproduce una sola vez)
assets/daenzo-loop.(webm|mp4)    3,5 s de pizza girando, en bucle infinito
assets/poster-intro.jpg    primer fotograma (mientras carga)
assets/poster-fallback.jpg fotograma real si el navegador bloquea el autoplay
```

## Video: intro → bucle
- El original (10 s, 1280×720, 24 fps) tiene la introducción (horno + chef) hasta ~6 s y luego un plano cerrado de la pizza girando.
- No existe un punto natural de bucle: la pizza gira en un solo sentido y ningún fotograma final coincide con uno anterior (diferencia media medida ≈ 40/255 en todo el tramo).
- Solución: `daenzo-loop` empieza exactamente en el fotograma siguiente al último de la intro (fotograma 216) y su último segundo se funde con los fotogramas 132–155, de modo que termina donde empieza. Resultado: sin corte ni salto, pero durante ~1 s de cada vuelta del bucle (cada 3,5 s) se percibe una leve superposición de pepperonis.
- Para un bucle perfecto: grabar/generar un clip de la pizza girando 360° completos con cámara fija (o 1/N de vuelta si la pizza es simétrica) y reemplazar `daenzo-loop.*`.

## Enlaces pendientes
Todos los controles llevan `data-pending` y muestran "disponible en la próxima fase". Para conectar una vista: `DaEnzo.routes['#resenas'] = () => { ... }`.

---

# Fase 2 — Ventanas informativas y panel social

Todo está en `index.html` (bloque de script **D**). Horarios muestra solo el texto generado desde la configuración y el logo (la pieza gráfica de referencia se retiró). En Ubicación, todo el recuadro del mapa es el enlace «Cómo llegar» y la dirección va dentro del recuadro.

## Configuración única — `window.DAENZO_CONFIG`
WhatsApp, teléfono, dirección, referencia de Maps, redes, horario, zona horaria, tiempos del panel social y textos de políticas. Cambiar un dato ahí lo actualiza en todas las ventanas.

### Horario
- `hours[día]` con 0 = domingo … 6 = sábado.
- `[{open:'17:00', close:'22:15'}]` = abierto · `'closed'` = cerrado · `'pending'` = muestra «HORARIO POR CONFIRMAR».
- Lunes y martes están como `'closed'` (confirmado: no abren).
- Un tramo con `close` ≤ `open` cruza la medianoche.
- El estado se calcula en `America/Caracas` con `Intl.DateTimeFormat`, sin depender de la zona del visitante. Un solo temporizador apunta al próximo cambio (apertura, cierre o medianoche) y se recalcula al volver a la pestaña.
- Es el horario habitual; no refleja cierres extraordinarios (eso requerirá el panel administrativo).

### Mapa
El recuadro muestra una imagen fija del mapa (`assets/mapa-da-enzo.jpg`, captura de Google Maps con el pin «Pizzería Da Enzo») porque el mapa embebido no carga dentro de la vista publicada. Todo el recuadro abre en Google Maps la ruta a las coordenadas exactas (`mapsCoords`, tomadas de https://maps.app.goo.gl/k9Swn3FWfuNSLo2a7). Para cambiar el mapa basta con reemplazar esa imagen.

### Teléfono secundario
Se muestra como cápsula informativa (sin enlace `tel:`), a pedido del cliente.

### Panel social
`socialPanel.initialDelayMs` (3,2 s), `reappearMs` (120 s, cuenta desde que se cierra), `autoHideMs` (12 s si se abrió solo y no se usa), `retryMs` (6 s), `idleMs` (4 s). No aparece si hay una ventana o el menú abiertos, si el usuario acaba de interactuar o navega con teclado, ni con la pestaña oculta.

## Pendiente de confirmar
- Textos de políticas: BORRADOR PROVISIONAL, sin validación legal.

---

# Fase 3 — Sección Reseñas

Vista que se abre sobre la pantalla principal (ruta `#resenas`) sin recargar. El video queda montado: se **pausa** mientras la vista lo cubre y se reanuda en el mismo punto al volver (no se reinicia). La flecha ← y el botón «atrás» del navegador vuelven al inicio.

## Archivos
```
css/reviews.css                    estilos de la vista, detalle y acceso
js/reviews/reviews-config.js       límites, frases rápidas, ruta de pedidos, enlace de Google (null), auth (null)
js/reviews/demo-reviews.js         12 reseñas FICTICIAS (fácil de reemplazar)
js/reviews/utils.js                media, recuento, distribución, formato, avatares, redacción de frases
js/reviews/star-rating.js          selector de estrellas accesible
js/reviews/review-list.js          resumen de valoraciones + tarjetas
js/reviews/review-detail.js        ventana de detalle, galería y ampliación
js/reviews/quick-phrases.js        frases rápidas
js/reviews/photo-picker.js         fotos: validación y vista previa local
js/reviews/review-form.js          formulario «Agrega una reseña»
js/reviews/auth.js                 interfaz de acceso/registro (sin proveedor) + enganche de Google One Tap
js/reviews/login-prompt.js         aviso «Inicia sesión» al entrar en Reseñas (reaparece como el panel social)
js/reviews/hero-video.js           video del encabezado: acercamiento → bucle de humo
js/reviews/reviews-view.js         orquestación de la vista y la navegación
assets/resenas/resenas-intro.*      acercamiento a las pizzas (se reproduce una vez por visita), 1920×1080
assets/resenas/resenas-loop.*       bucle de 4 s con la cámara quieta en la posición final y solo el humo en movimiento
assets/resenas/resenas-poster.jpg / resenas-hold.jpg   primer fotograma y fotograma de la posición final
assets/resenas/demo/*.jpg          fotos de demostración proporcionadas por el cliente
```
Cambios mínimos en `index.html`: enlaces a estos archivos, marcado de la vista y de dos ventanas (detalle y acceso), `DaEnzo.toast()`, `DaEnzo.onEscape`, panel social controlado por cualquier `[data-social-toggle]`, y pausa/reanudación del video con el evento `daenzo:hero`.

## Qué es demostración
- Las 12 reseñas, sus fechas y fotos son ficticias; la página lo indica. Sin insignias de «verificada» ni de Google. Avatares con iniciales (no se usan fotos de personas).
- «Enviar reseña» añade la reseña solo al estado de la página; desaparece al recargar. Las fotos se previsualizan con URL locales del navegador y no se suben.
- Acceso/registro: interfaz completa con validaciones, pero ningún formulario crea cuentas. Las contraseñas se descartan al enviar; nada se guarda en localStorage. «Modo demostración» es una sesión en memoria claramente rotulada.
- La casilla de promociones es opcional, está desmarcada y es independiente de la cuenta.

## Para conectar el sistema real
1. **Autenticación**: elegir proveedor (Firebase Auth, Supabase, Auth0 o backend propio). Para Google: proyecto en Google Cloud, pantalla de consentimiento OAuth, ID de cliente con orígenes autorizados del dominio. Rellenar `reviews.auth` y sustituir los manejadores de `auth.js`. Sesión en cookie `HttpOnly`, nunca tokens en localStorage.
2. **Persistencia de reseñas**: API con tabla de reseñas (autor, valoración, comentario, fotos, fecha, estado de moderación) y almacenamiento de imágenes; cargar la lista con la misma forma que `demo-reviews.js`. Mantener separadas: demostración, reseñas del sitio y datos de Google.
3. **Consentimiento comercial**: guardar la elección con fecha y origen, y ofrecer baja en cada envío.
4. **Google**: las reseñas del sitio no se convierten en reseñas de Google. Cuando exista el enlace oficial para reseñar el Perfil de Empresa, ponerlo en `reviews.googleReviewUrl` y aparecerá el botón «Dejar una reseña en Google». Mostrar reseñas reales de Google requiere evaluar la API correspondiente y sus condiciones.
5. **Ordenar mi pedido**: registrar `DaEnzo.routes['#ordenar']` cuando exista la sección; mientras tanto muestra «La experiencia de pedidos estará disponible próximamente».

## Actualización — video, aviso de acceso y fotos
- **Video del encabezado**: el clip original hace un acercamiento continuo hasta el final, sin tramo quieto. Para que «se acerque y se quede», los últimos 5 s se estabilizaron por software a la posición final de la cámara (alineación por puntos de la mesa) y se empalmaron con un fundido de 1 s. Resultado: acercamiento completo una vez → cámara quieta con humo en bucle. Al salir y volver a Reseñas, el acercamiento se repite. Se reescaló a 1920×1080 con un enfoque suave: más nítido en pantallas grandes, aunque no añade detalle que el original de 1280×720 no tuviera.
- **Aviso «Inicia sesión»**: aparece a los 2,5 s de entrar; si se cierra o se ignora (20 s), vuelve a los ~120 s; no aparece con ventanas abiertas, mientras se escribe ni con sesión iniciada. Tiempos en `reviews.loginPrompt`.
- **Registro automático con Google**: requiere `reviews.auth.googleClientId` (Google Cloud → credenciales OAuth, orígenes autorizados del dominio) y `reviews.auth.googleEndpoint` (servidor que verifica el token con la clave pública de Google y crea/abre la cuenta). Con ambos definidos, el aviso usa el One Tap oficial de Google («Continuar como …»). Hasta entonces se muestra el aviso propio de Da Enzo e indica que el acceso no está conectado.
- **Fotos de reseñas** (cuadradas): en el detalle, una grande y hasta dos debajo; si hay más de 3, la última muestra «+N». Al pulsar cualquiera se abre la ampliación para recorrerlas todas (flechas + X). En las tarjetas, hasta 3 miniaturas.

---

# Fase 4 — Sección «Sobre nosotros»

Vista dentro de la misma página (ruta `#sobre-nosotros`, botón «Sobre nosotros» del inicio). Igual que Reseñas: no recarga, pausa el video del inicio mientras lo cubre y la flecha ← / «atrás» del navegador vuelven al inicio.

## Archivos
```
css/about.css                 estilos de la vista
js/about/about-data.js        ⚠ TODO el contenido (FICTICIO): historia, fundador, fechas, platos, locales, rutas de imágenes
js/about/carousel.js          carrusel reutilizable (logos y galerías): 5 s, flechas, puntos, teclado, deslizar
js/about/floating-order.js    botón «Ordenar mi pedido» flotante y arrastrable
js/about/about-view.js        construye la vista desde los datos y la conecta con el resto del sitio
assets/nosotros/              fotos proporcionadas (portada, fondo de especialidades, 4 platos, 3 antiguo, 4 actual, logo antiguo)
```
Reutiliza: barra y botones de Reseñas, panel social (mismo panel, otro logo con `data-social-toggle`), ventana de acceso (`DaEnzoReviews.Auth`), aviso de inicio de sesión (`LoginPrompt`, aquí con 12 s de demora y abajo a la izquierda), gestor de ventanas y `DaEnzo.toast`.

## Contenido ficticio
Historia de Vincenzo «Enzo» Marchetti y Carmen, hitos 1989–2023, las 4 especialidades (Tagliatelle de la Nonna, Calzone Segreto, La 89, Cheesecake de Mora Andina) y la historia de los locales son inventados para la demo, con autorización. Todo está en `about-data.js`; cambiar ese archivo actualiza la página. Al pie de la sección hay una nota discreta: «Historia y contenidos ilustrativos de demostración».

## Comportamientos
- Nombre «DA ENZO PIZZERÍA» con escritura progresiva al entrar (una vez por visita; sin animación con movimiento reducido; legible por lectores de pantalla).
- Logos antiguo/actual y galerías de ambos locales: cambian cada 5 s, se pausan con el cursor, el foco, fuera de pantalla o la pestaña oculta; tras usar las flechas esperan 12 s antes de seguir. Cada galería es independiente.
- Especialidades: al tocar un plato se muestra su historia e ingredientes en el panel de la derecha.
- Botón «Ordenar mi pedido»: se arrastra a cualquier punto visible (no puede salir de la pantalla), un toque lo pulsa, Alt + flechas lo mueve con teclado. Guarda la posición en `localStorage` (`daenzo.orderButton.pos`, solo coordenadas). Usa `DaEnzo.routes['#ordenar']` cuando exista; hoy muestra «La experiencia de pedidos estará disponible próximamente».

---

# Fase 5 — «Ordenar mi pedido» (pedido en el local)

Todos los botones «Ordenar mi pedido» (inicio, Reseñas, Sobre nosotros) abren la ventana «¿Cómo quieres disfrutar Da Enzo?». «Estoy en el local» abre la vista `#pedido-local` encima de la sección de origen; la flecha ← vuelve a esa sección. «Quiero recibirlo en casa» aparece como «Próximamente» y no navega.

## Archivos
```
css/order.css                estilos de la vista y sus ventanas
js/order/menu-data.js        ÚNICA fuente del menú: categorías, productos, variantes, extras, precios, recomendaciones, mesas
js/order/cart.js             lógica del carrito (céntimos enteros, líneas por configuración, persistencia, estados)
js/order/table.js            lectura/validación del número de mesa (?mesa=12 o #ordenar?mesa=12)
js/order/order-modals.js     ventanas: modo, producto, bebidas, revisión, confirmación, resumen, carrito móvil
js/order/order-view.js       vista: hero, navegación por categorías, tarjetas, carrito lateral, barra móvil, mesero
assets/pedido/               fotos del hero, categorías y platos
```
Reutiliza: gestor de ventanas, barra/botones de Reseñas, panel social (mismo panel), ventana de acceso, avisos, efecto de escritura de «Sobre nosotros» y el botón arrastrable (`FloatingOrder`, ahora con `storageKey` propio por botón).

## Contenido
- Nombres e ingredientes de pizzas, pastas, pasticcio, bebidas, cócteles y café salen de la carta real (`source:'carta'`). Pasticho de la Nonna, Pasticho Bianco, Gnocchi alla Sorrentina, Tiramisú y Cheesecake son de demostración (`source:'demo'`).
- **Todos los precios son ficticios** (USD, en céntimos en `menu-data.js`).
- Varias fotos se comparten entre platos o son recortes; reemplazar en `menu-data.js` sin tocar componentes.
- **Pendiente:** fotos de cócteles y de café/frappuccino. Hoy se ven dos espacios marcados «Foto por agregar». Para ponerlas: `DAENZO_MENU.drinks.images.cocteles` y `.cafe`.

## Carrito
- Guardado en `localStorage` (`daenzo.cart.v1`): solo ids, variantes, extras y cantidades. Sobrevive a cambiar de sección y recargar; se valida contra el catálogo al restaurar.
- Estados: en preparación → revisado → confirmado (demostración). Si se modifica tras confirmar, se indica.
- La confirmación NO envía nada a cocina ni genera número de pedido.

## Mesas (QR / NFC)
`?mesa=12` se valida por formato y se muestra «Mesa 12 · demo» (sin verificar). Sin parámetro: «Mesa sin asignar · demo». Con backend: rellenar `DAENZO_MENU.tables.registry` o sustituir la validación por una consulta al servidor. «Llamar al mesero» solo muestra un aviso: no notifica a nadie.

## Actualización — menú desplegable y pedido realizado
- El menú son botones por categoría (Pizzas, Pastichos, Pastas, Bebidas, Postres): cada uno despliega y recoge sus platos; «Bebidas» abre la carta de bebidas (ya no hay sección de bebidas en la página).
- Extras: «← Volver al plato» a la izquierda; mientras están abiertos se oculta la X de la ventana.
- Fotos de bebidas (`cartImage` en `menu-data.js`) solo en el carrito y en el pedido. Por ahora: Refresco y Té.
- Al confirmar se guarda una copia de solo lectura; al cerrar la confirmación el carrito se vacía y aparece el botón flotante «Ver mi pedido» en todo el sitio.

## Actualización — v13
- Botones flotantes (mesero y «Ver mi pedido»): se mueven libremente a cualquier punto de la pantalla, en ordenador y en móvil (táctil). Solo evitan la barra inferior del móvil y no se montan entre sí; quedan siempre por encima del contenido. Cada uno recuerda su posición.
- Foto ampliada del plato: visor a pantalla completa fuera de la ventana; la imagen se ajusta entera a cualquier pantalla. Flechas, teclado (← → Esc) y contador.
- Pizzas: los botones Especialidades / Tradicionales / Del Mar / De vegetales se adaptan al ancho disponible y ya no se cortan.
- Al tocar un plato su tarjeta queda marcada con borde naranja.
- Varios pedidos: cada confirmación se suma (`localStorage 'daenzo.placedOrders.v1'`). «Mi pedido» muestra cada pedido por separado (número, hora, productos, precios, subtotal) y el total a pagar.
- «Ver mi pedido» desaparece 5 minutos después del último pedido (`DAENZO_MENU.placedOrders.ttlMs`). Con el panel de control, sustituir esa caducidad por el aviso «pagado» del servidor.
- Sugerencia de iniciar sesión también en el inicio y en «Ordenar mi pedido» (además de Reseñas y Sobre nosotros): aparece a los pocos segundos, se oculta sola y vuelve a recordarse más tarde; nunca con una ventana abierta, mientras se escribe ni con sesión iniciada.
- Bebidas: foto del Frappuccino en la carta de bebidas (sección de café) y en el carrito.

## Actualización — v14: extras compactos y Delivery

### Carrito
- Los extras ya no alargan la línea: aparece una píldora «N extras · +$X» que despliega la lista con el precio de cada uno. Todas las líneas siguen la misma estructura (foto, nombre y precio / extras / cantidad, Editar y Eliminar). Igual en «Ver mi pedido».
- Foto del espresso (`assets/pedido/bebidas-espresso.jpg`): en la carta de bebidas (sección Café) y en el carrito para Espresso y Americano.

### Ventana «¿Cómo quieres disfrutar Da Enzo?»
- Sin fotografías: dos tarjetas («Comer en Da Enzo» → «Pedir en el local», «Recibir en casa» → «Pedir a domicilio»).

### Modo Delivery (ruta `#pedido-delivery`)
- Reutiliza la misma vista, catálogo, tarjetas, detalle, extras, carrito, revisión y resumen. La modalidad es compartida (`DaEnzoOrder.orderMode`, sessionStorage `daenzo.orderMode`); solo cambian textos (`DAENZO_MENU.hero.delivery`) y el final del proceso.
- «Llamar al mesero» no existe en Delivery.
- Envío: `DAENZO_MENU.delivery.fee` = `null` → «Se confirmará» y NO se suma al total. Con una tarifa real (en céntimos) aparece como línea independiente y se suma.
- Revisión: «¿Todo listo para disfrutarlo en casa?» → «Continuar con la entrega».
- «¿Dónde llevamos tu pedido?»: dirección y teléfono obligatorios; referencia y enlace de Google Maps opcionales (acepta enlaces maps.app.goo.gl, goo.gl, google.*/maps, también pegados con texto). Errores junto a cada campo, sin alertas del navegador; los datos no se borran. Borrador en sessionStorage (`daenzo.deliveryDraft.v1`) solo en esta pestaña. No se pide acceso a la ubicación ni hay rastreo.
- Botón «Contactar por WhatsApp» con el número de `DAENZO_CONFIG.whatsapp` y mensaje de consulta codificado. Es solo consulta: no envía el pedido.
- Seguimiento: «Estamos preparando el siguiente paso de tu pedido», aviso de pago por WhatsApp, estado «Pendiente de confirmación» marcado como **estado de demostración** y aviso de que la recepción real no está conectada. Botón para abrir WhatsApp con el pedido ya escrito (el cliente debe pulsar Enviar; no se marca como enviado).
- «Ver mi pedido»: productos, variantes, extras, cantidades, precios, subtotal, envío, total, dirección, teléfono, referencia y ubicación (solo si se dieron) y estado. Sin número oficial mientras no exista backend.
- Pedidos a domicilio de la pestaña: sessionStorage `daenzo.deliveryOrders.v1` (copia local, NO confirmación del restaurante). Al registrar el pedido el carrito se vacía: volver o recargar no crea pedidos duplicados.

### Integración pendiente (backend / panel de control)
Archivo: `js/order/delivery-service.js`. Configuración: `DAENZO_CONFIG.orders` en `index.html` (con `apiBase` vacío no se envía nada).
1. `POST {apiBase}/orders` con el pedido (`schema 'daenzo.order.v1'`) y cabecera `Idempotency-Key` (= `clientRef`). Respuesta `{ id, status, createdAt, accessToken }`.
2. El servidor guarda el pedido, valida de nuevo todos los datos y recalcula los precios (no confiar en el frontend).
3. `POST /orders/{id}/notify` (o automático al crear): el servidor avisa a la pizzería por WhatsApp Business Platform o un proveedor autorizado; credenciales solo en el servidor, registro del resultado, reintentos seguros sin duplicar.
4. `GET /orders/{id}/status` con `Authorization: Bearer <accessToken>` (token por pedido: cambiar el id no da acceso a pedidos ajenos). Consulta cada `pollMs`; se puede sustituir por WebSocket/SSE. Estados: recibido, pendiente_confirmacion, pendiente_pago, confirmado, en_preparacion, en_camino, entregado, cancelado.
5. Al recibir `en_camino` se muestra «¡Tu pedido está en camino!» en el seguimiento y en el resumen. En la demo nada cambia de estado solo: no hay temporizadores.

## Actualización — rendimiento en teléfonos
- Videos por dispositivo (`DaEnzoMedia` en el `<head>` de index.html): en teléfonos en vertical se usan versiones recortadas en vertical (`*-m.mp4/webm`, unas 3 veces más ligeras); en iPhone/iPad/Safari se usa MP4 (H.264, decodificado por hardware). En iPhone la intro arranca de inmediato (antes esperaba datos que Safari no descarga hasta pulsar play).
- Reseñas: videos y pósters se asignan al entrar en la sección (ya no se descargan al abrir la web). Videos recomprimidos a 720p (de 7,4 MB a 1,8 MB la intro).
- Primera carga en teléfono: de ~4,6 MB a ~1,3 MB. Fuentes de Google sin bloquear la página; logo optimizado (85 KB → 14 KB); imágenes de secciones y ventanas ocultas en diferido; platos de cada categoría del menú se crean al abrirla.
- Táctil (`css/touch.css`): sin efectos :hover pegados (la X ya no queda girada), sin recuadros de foco al tocar (solo con teclado), sin retraso de toque, y sin desenfoques de fondo ni grano sobre el video (eran los que trababan el video y los toques en iPhone antiguos).
