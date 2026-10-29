# Panel de control Da Enzo — demostración

Ruta: **`/admin/`** (por ejemplo `https://pizzeriadaenzo.vercel.app/admin/`).

## 1. Diagnóstico del proyecto antes del panel
- Web 100 % frontend: HTML, CSS y JavaScript sin frameworks, sin backend, sin base de datos y sin API.
- Catálogo en `js/order/menu-data.js`; carrito en `localStorage`; pedidos a domicilio en `sessionStorage`; la capa `delivery-service.js` ya estaba preparada para una API (`DAENZO_CONFIG.orders.apiBase`, vacío).
- No existía un mecanismo de estado compartido ni tiempo real. Por eso se añadió una **capa de datos de demostración** común a la web y al panel.

## 2. Arquitectura
```
js/shared/demo-db.js      ← capa de datos (adaptador «demo-local»), compartida por web y panel
js/shared/catalog-sync.js ← la web aplica los cambios de menú hechos en el panel
js/order/table-requests.js← ventana «¿En qué te ayudamos?» (mesero, cuenta, agua, cubiertos, ayuda)
admin/index.html          ← panel
admin/css/panel.css
admin/js/panel-core.js    ← utilidades, iconos, enrutador, avisos, ventanas
admin/js/panel-seed.js    ← datos de ejemplo y simulaciones (marcados como tales)
admin/js/view-*.js        ← los cinco módulos
admin/js/panel-boot.js    ← entrada, navegación, avisos de eventos nuevos
```
- `DaEnzoDB` guarda pedidos, solicitudes, eventos y cambios de catálogo en `localStorage` (`daenzo.demo.db.v1`) y avisa a las demás pestañas con `BroadcastChannel` + evento `storage`.
- Su interfaz es **asíncrona** (`createOrder`, `updateStatus`, `updatePayment`, `createRequest`, `updateRequest`, `setOverride`, `subscribe`…). Para producción se sustituye por un adaptador que llame a la API con `fetch` y reciba cambios por WebSocket/SSE, sin reescribir las pantallas.
- Las reglas viven en la capa de datos: transiciones permitidas por modalidad, motivo obligatorio al cancelar, pago independiente del estado, sin duplicados (`ref` del pedido), total calculado desde productos + extras + cantidades.

### Flujos de estado
- Local: Nuevo → Confirmado → En preparación → Listo para servir → Finalizado (+ Cancelado).
- Delivery: Nuevo → Confirmado → En preparación → Listo para entregar → En camino → Entregado (+ Cancelado).
- Pago: Pendiente · Comprobante recibido · Confirmado · Rechazado · Devuelto (solo desde Confirmado). Cambio manual, sin verificación bancaria.

## 3. Qué funciona realmente (en la demo)
- Pedido en el local y a domicilio desde la web → aparecen en el panel al instante con aviso (y sonido opcional, desactivado por defecto).
- Acciones según estado y modalidad; cancelar pide confirmación y motivo; historial de cambios.
- El seguimiento del delivery en la web muestra el estado que pone el personal («Actualizado desde el panel (demo)») y el aviso «¡Tu pedido está en camino!». «Ver mi pedido» del local muestra el estado del panel.
- Solicitudes de mesa desde «Llamar al mesero» (con la mesa del QR `?mesa=N`; sin ella, «Mesa no identificada»). La cuenta solo avisa: no cobra.
- Indicadores calculados con los pedidos guardados; ventas excluyen cancelados; cobrado = pago confirmado.
- Menú: disponibilidad, precio y descripción editables; la web abierta en el mismo navegador los aplica al instante («No disponible hoy», precio nuevo, no deja pedirlo).
- Persistencia al recargar (mismo navegador). Botones para cargar datos de ejemplo y restablecer (con confirmación).

## 4. Limitaciones honestas
- **Solo funciona en un mismo navegador** (mismo dispositivo). La web en el teléfono de un cliente y el panel en la computadora del local NO se comunican: para eso hace falta el backend.
- Sin autenticación: la pantalla de entrada es de demostración.
- Avisos solo dentro de la demo: no hay notificaciones push, WhatsApp ni correos.
- Los datos guardados en el navegador no están verificados por ningún servidor.

## 5. Cómo presentar la demo al dueño
1. Abrir el panel: `/admin/` → «Entrar al panel de demostración».
2. Herramientas → «Cargar datos de ejemplo» (7 días de pedidos ficticios marcados «Ejemplo»).
3. En otra pestaña del **mismo navegador**: «Abrir la web en la mesa 5» → hacer un pedido → confirmar. En el panel aparece el aviso «Nuevo pedido».
4. Confirmar → preparación → listo → finalizar. Ver cómo cambian Inicio, Mesas y Ventas.
5. En la web, «Llamar al mesero» → «Pedir la cuenta». En el panel: aviso, indicador persistente y botón «Atender».
6. Hacer un pedido a domicilio y llevarlo hasta «En camino»: la web muestra el aviso al cliente.
7. En Menú, marcar una pizza «No disponible»: en la web aparece «No disponible hoy».
8. Con un solo dispositivo se pueden usar «Simular pedido entrante» y «Simular solicitud de mesa».

## 6. Para pasar a producción
- Backend + API (pedidos, solicitudes, catálogo, usuarios) y base de datos (p. ej. PostgreSQL).
- Autenticación del personal y permisos por rol (caja, cocina, mesero, administrador); sesiones seguras; registro de auditoría.
- Tiempo real entre dispositivos (WebSocket/SSE) y recuperación del estado al reconectar.
- Validación y recálculo de precios en el servidor (no confiar en el navegador); idempotencia (`Idempotency-Key` = `clientRef`).
- Identificación de mesas con QR/NFC firmados (evitar mesas inventadas).
- Integración de WhatsApp Business Platform desde el servidor (credenciales solo en el servidor, reintentos, sin duplicados).
- Verificación de pagos, caja, inventario, empleados e informes avanzados cuando se aprueben.
- Seguridad: HTTPS, CSP, limitación de peticiones, copias de seguridad, cumplimiento de privacidad de datos de clientes.

## 7. «Ver mi pedido» se cierra desde el panel
El botón flotante de la web desaparece cuando el personal deja **todos** los pedidos de ese cliente terminados **y** con pago confirmado (Finalizado/Entregado + Pago confirmado), o cancelados. Se borran del dispositivo del cliente y el botón vuelve a aparecer solo con un pedido nuevo. (Sin panel, se mantiene la caducidad de 5 minutos.)

## 8. Conectar dispositivos (teléfono + laptop) en tiempo real — demo
Sin configuración, la demo funciona solo dentro de un mismo navegador. Para conectar la web del teléfono con el panel en la laptop se usa una **Firebase Realtime Database** gratuita (solo para la demo):
1. https://console.firebase.google.com → «Crear un proyecto» (p. ej. `daenzo-demo`, sin Google Analytics).
2. Menú «Compilación» → «Realtime Database» → «Crear base de datos» → ubicación Estados Unidos → «Comenzar en modo de prueba».
3. Pestaña «Reglas» → pegar y publicar (abre solo la carpeta de la demo, sin fecha de caducidad):
   ```json
   { "rules": { ".read": false, ".write": false, "daenzo-demo": { ".read": true, ".write": true } } }
   ```
4. Copiar la URL de la base (p. ej. `https://daenzo-demo-default-rtdb.firebaseio.com`) en `js/shared/demo-cloud.js` → `databaseURL`, y subir a GitHub.

Funcionamiento: cada dispositivo mantiene una copia local que se sincroniza con la nube (API REST + transmisión EventSource, sin librerías). El indicador del panel muestra «En la nube · todos los dispositivos (demo)».
Avisos: la base de la demo es pública para quien tenga la URL; no introducir datos reales de clientes. Si dos dispositivos crean un pedido en el mismo segundo podría repetirse el número (limitación de la demo; en producción el servidor asigna los números).
