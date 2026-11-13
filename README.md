# PassMaster - Sistema de Ticketing y Acceso a Eventos

Aplicación web para crear eventos, vender boletos digitales y validar el ingreso de los asistentes, con monitoreo del aforo desde un panel administrativo.

El frontend está hecho en React (Vite y Tailwind CSS) y el backend en Node.js con Express, organizado en MVC, sobre una base de datos MySQL 8.0.

## Cumplimiento de Especificaciones

| Requerimiento | Implementación en PassMaster |
| :--- | :--- |
| Frontend con dashboard de aforo | Panel administrativo en React que consulta el aforo del evento cada 5 segundos: capacidad, entradas vendidas, ingresos registrados y porcentaje de ocupación. |
| Backend con códigos únicos | Servidor Node.js con Express en arquitectura MVC: modelos (`src/models`), rutas (`src/routes`), controladores (`src/controllers`) y servicios (`src/services`). Cada boleto recibe un código con formato `TKT-XXXXXXXX-XXXXXXXX` y la base de datos impide que se repita. |
| Base de datos y transacciones | MySQL 8.0. La compra se ejecuta en una transacción con bloqueo de filas (`SELECT ... FOR UPDATE`) para que no se vendan más entradas que los cupos disponibles. |
| Tickets con identificador único | Tras la compra se emite un boleto por entrada, con su código único y una firma HMAC-SHA256 que viaja en el código QR. |
| Módulo de check-in | Pantalla para el personal con lectura del QR por cámara o ingreso manual del código. Valida el estado del boleto (`ACTIVE`, `CHECKED_IN`, `CANCELLED`) y rechaza el reingreso. |
| Pasarela de pagos | Flujo de pago en modo sandbox: el servidor simula la pasarela y aprueba la transacción. El servicio de pagos incluye la integración con Stripe, que se activa al configurar una clave en el servidor. |
| Seguridad | Autenticación con JWT, contraseñas cifradas con bcrypt y control de acceso por rol (`ADMIN`, `STAFF`, `CUSTOMER`). |
| Documentación | API, mapa de navegación y guía de usuario en este mismo documento. También hay una copia en [api-spec.md](docs/api-spec.md), [navigation-map.md](docs/navigation-map.md) y [user-guide.md](docs/user-guide.md). |

## Estructura del Repositorio

```
docker-compose.yml           Levanta base de datos, backend y frontend
backend/
    Dockerfile
    package.json
    .env.example             Variables de entorno de ejemplo
    database/
        schema.sql           Creación de la base de datos y sus tablas
        seed.sql             Datos de demostración en SQL
    src/
        server.js            Punto de entrada de Express
        config/              Conexión a MySQL
        controllers/         Auth, eventos, órdenes, tickets y check-in
        middlewares/         Verificación de JWT y de roles
        models/              Consultas SQL por entidad
        routes/              Rutas de la API
        services/            Compra de tickets, pagos y generación de QR
        utils/               Migración, seed y firma HMAC
frontend/
    Dockerfile
    nginx.conf               Sirve la web y reenvía /api al backend
    package.json
    index.html
    src/
        App.jsx              Vistas de la aplicación
        api/                 Cliente HTTP
        components/          Menú superior y ventana modal
        context/             Sesión del usuario
        pages/               Catálogo, detalle y compra, mis boletos, dashboard y check-in
docs/
    api-spec.md
    navigation-map.md
    user-guide.md
```

## Instalación y Uso con Docker

Requisitos: Git y Docker con Docker Compose.

1. Clonar el repositorio en la carpeta actual. La carpeta debe estar vacía; el punto final indica que se clone ahí mismo y no en una subcarpeta:
```bash
git clone https://github.com/elputiciero2/passmaster .
```
Si se prefiere que Git cree la carpeta:
```bash
git clone https://github.com/elputiciero2/passmaster
cd passmaster
```

2. Elegir la rama. `main` es la versión base y `main-modoseguro` es la versión con las medidas de seguridad:
```bash
git checkout main
```

3. Levantar el sistema completo:
```bash
docker compose up --build
```
Ese comando levanta MySQL, crea las tablas, carga los datos de demostración e inicia el backend y el frontend. La primera vez tarda unos minutos porque descarga y construye las imágenes.

4. Abrir la aplicación e iniciar sesión con una de las cuentas de demostración que aparecen más abajo:
- Aplicación web: http://localhost:8080
- API: http://localhost:5000/api (también disponible en http://localhost:8080/api)

Comandos de uso diario:

| Acción | Comando |
| :--- | :--- |
| Levantar en segundo plano | `docker compose up --build -d` |
| Ver el estado de los contenedores | `docker compose ps` |
| Ver los registros del backend | `docker compose logs -f backend` |
| Detener el sistema, conservando los datos | `docker compose down` |
| Detener y borrar la base de datos | `docker compose down -v` |
| Actualizar el código | `git pull` y luego `docker compose up --build` |

Al cambiar de una rama a otra hay que reiniciar la base de datos, porque cada rama la configura distinto:
```bash
docker compose down -v
git checkout main-modoseguro
docker compose up --build
```

## Puesta en Marcha Manual (sin Docker)

Requiere Node.js 18 o superior y un servidor MySQL 8.0 en el puerto 3306.

Backend:
```bash
cd backend
npm install
cp .env.example .env    # ajustar usuario y contraseña de MySQL
npm run migrate         # crea la base de datos passmaster_db y sus tablas
npm run seed            # carga usuarios y eventos de demostración
npm run dev             # API en http://localhost:5000/api
```

Frontend, en otra terminal:
```bash
cd frontend
npm install
npm run dev             # aplicación en http://localhost:5173
```

## Cuentas de Demostración

| Rol | Correo | Contraseña | Qué puede hacer |
| :--- | :--- | :--- | :--- |
| Administrador | `admin@passmaster.com` | `Password123!` | Ver el aforo, crear, editar y eliminar eventos, hacer check-in y comprar. |
| Staff | `staff@passmaster.com` | `Password123!` | Validar boletos en el check-in y comprar. |
| Comprador | `cliente@passmaster.com` | `Password123!` | Comprar entradas y ver sus boletos con código QR. |

## Documentación de la API (Endpoints)

- URL base: `http://localhost:5000/api` (con Docker también `http://localhost:8080/api`)
- Formato: `application/json` en peticiones y respuestas
- Autenticación: encabezado `Authorization: Bearer <token>`; el token se obtiene en `/auth/login` o `/auth/register` y dura 7 días
- Roles: `ADMIN`, `STAFF`, `CUSTOMER`

Todas las respuestas tienen la forma `{ "success": true|false, "message": "...", "data": ... }`.

### Resumen de endpoints

| Método | Ruta | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Público | Estado del servidor |
| `POST` | `/auth/register` | Público | Registrar usuario |
| `POST` | `/auth/login` | Público | Iniciar sesión y obtener token |
| `GET` | `/auth/me` | Token | Datos del usuario autenticado |
| `GET` | `/events` | Público | Listar eventos |
| `GET` | `/events/:id` | Público | Detalle de un evento con sus localidades |
| `GET` | `/events/:id/occupancy` | `ADMIN`, `STAFF` | Aforo en tiempo real |
| `POST` | `/events` | `ADMIN` | Crear evento |
| `PUT` | `/events/:id` | `ADMIN` | Editar evento y localidades |
| `DELETE` | `/events/:id` | `ADMIN` | Eliminar evento |
| `POST` | `/orders/checkout` | Token | Comprar entradas (pago + emisión de tickets) |
| `GET` | `/orders/my-orders` | Token | Órdenes del usuario autenticado |
| `GET` | `/orders/:id` | Dueño o `ADMIN` | Detalle de una orden con sus tickets |
| `GET` | `/orders` | `ADMIN` | Todas las órdenes del sistema |
| `GET` | `/tickets/my-tickets` | Token | Boletos del usuario autenticado |
| `GET` | `/tickets/:id` | Dueño, `STAFF` o `ADMIN` | Boleto con imagen QR |
| `POST` | `/checkin/verify` | `STAFF`, `ADMIN` | Validar boleto y registrar ingreso |
| `GET` | `/checkin/logs/:eventId` | `STAFF`, `ADMIN` | Historial de escaneos de un evento |

### Errores comunes

| Código | Cuándo ocurre |
| :--- | :--- |
| `400` | Faltan campos obligatorios o la compra no se puede procesar |
| `401` | Falta el token, tiene mal formato, expiró o las credenciales son inválidas |
| `403` | El rol del usuario no tiene permiso sobre el recurso |
| `404` | El recurso no existe |
| `409` | Correo ya registrado o boleto ya utilizado |
| `500` | Error interno; el detalle viene en el campo `error` |

### 1. Autenticación (`/auth`)

#### `POST /auth/register`
Crea un usuario y devuelve su token. `role` es opcional y solo acepta `CUSTOMER` (por defecto) o `STAFF`; no se pueden registrar administradores por la API.
```json
{ "name": "Juan Pérez", "email": "juan@example.com", "password": "Password123!", "role": "CUSTOMER" }
```
Respuesta `201`:
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente.",
  "data": {
    "user": { "id": 4, "name": "Juan Pérez", "email": "juan@example.com", "role": "CUSTOMER" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```
Errores: `400` si falta nombre, correo o contraseña; `409` si el correo ya existe.

#### `POST /auth/login`
```json
{ "email": "admin@passmaster.com", "password": "Password123!" }
```
Respuesta `200`: misma estructura que el registro (`data.user` y `data.token`). Error `401` si las credenciales son inválidas.

#### `GET /auth/me`
Devuelve `data.user` del token enviado.

### 2. Eventos y aforo (`/events`)

#### `GET /events`
Parámetros opcionales: `status` (`DRAFT`, `PUBLISHED`, `FINISHED`, `CANCELLED`) y `search` (busca en título y ubicación). Los eventos vienen ordenados por fecha.
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "TechFest Global Summit 2026",
      "description": "El mayor evento de tecnología...",
      "location": "Centro de Convenciones Metropolitano - Gran Salón A",
      "event_date": "2026-12-15T09:00:00.000Z",
      "banner_url": "https://...",
      "max_capacity": 500,
      "status": "PUBLISHED",
      "creator_name": "Administrador PassMaster",
      "configured_capacity": "500",
      "available_capacity": "499",
      "sold_tickets": "1"
    }
  ]
}
```

#### `GET /events/:id`
Devuelve el evento con el arreglo `tiers` (localidades), ordenado por precio.
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "TechFest Global Summit 2026",
    "tiers": [
      { "id": 3, "name": "Early Bird Estudiante", "price": "25.00", "total_quantity": 50, "available_quantity": 50 },
      { "id": 1, "name": "Entrada General", "price": "45.00", "total_quantity": 350, "available_quantity": 349 }
    ]
  }
}
```

#### `GET /events/:id/occupancy`
Datos que alimentan el dashboard de aforo. `occupancy_percentage` son los ingresos físicos sobre la capacidad; `sales_percentage`, las entradas vendidas sobre la capacidad.
```json
{
  "success": true,
  "data": {
    "event_id": 1,
    "title": "TechFest Global Summit 2026",
    "max_capacity": 500,
    "total_configured": "500",
    "total_sold": "410",
    "total_available": "90",
    "total_checked_in": 285,
    "effective_capacity": "500",
    "occupancy_percentage": 57,
    "sales_percentage": 82
  }
}
```

#### `POST /events`
Obligatorios: `title`, `location`, `event_date`. Si se omiten, `max_capacity` vale 100 y `status` vale `PUBLISHED`.
```json
{
  "title": "Festival de Jazz 2026",
  "description": "Concierto al aire libre",
  "location": "Parque Central",
  "event_date": "2026-12-20 18:00:00",
  "banner_url": "https://example.com/banner.jpg",
  "max_capacity": 200,
  "status": "PUBLISHED",
  "tiers": [
    { "name": "General", "price": 20.00, "total_quantity": 150 },
    { "name": "VIP", "price": 50.00, "total_quantity": 50 }
  ]
}
```
Respuesta `201`: el evento creado con sus `tiers`.

#### `PUT /events/:id`
Acepta los mismos campos que la creación; los que no se envían conservan su valor. En `tiers`, una localidad con `id` se actualiza y una sin `id` se crea.
```json
{
  "title": "Festival de Jazz 2026 (nueva fecha)",
  "event_date": "2026-12-27 18:00:00",
  "tiers": [
    { "id": 6, "name": "General", "price": 25.00, "total_quantity": 150, "available_quantity": 140 },
    { "name": "Palco", "price": 80.00, "total_quantity": 20 }
  ]
}
```
Respuesta `200`: el evento actualizado. Error `404` si no existe.

#### `DELETE /events/:id`
Elimina el evento y sus localidades. Respuesta `200` con `"Evento eliminado exitosamente."`; `404` si no existe. Un evento con boletos ya vendidos no se puede eliminar: la base de datos lo impide y la API responde `500`.

### 3. Órdenes y pasarela de pagos (`/orders`)

#### `POST /orders/checkout`
Ejecuta la compra completa en una sola transacción: bloquea los cupos, cobra en la pasarela, crea la orden, descuenta disponibilidad y emite un ticket con código único por cada entrada. Si algo falla, no se guarda nada.
```json
{
  "items": [ { "tierId": 1, "quantity": 2 } ],
  "paymentInfo": { "method": "card" }
}
```
La pasarela funciona en modo sandbox (`MOCK_SANDBOX`) y aprueba el pago al instante. Si el servidor tiene configurada una clave real de Stripe y se envía `paymentInfo.token`, el cobro se hace con Stripe.

Respuesta `201`:
```json
{
  "success": true,
  "message": "¡Compra procesada y tickets generados exitosamente!",
  "data": {
    "success": true,
    "orderId": 12,
    "orderNumber": "PM-MWEI8WU7-6011",
    "totalAmount": 90,
    "gateway": "MOCK_SANDBOX",
    "tickets": [
      { "id": 25, "ticketCode": "TKT-5E9C17DC-MWEI8WU9", "tierName": "Entrada General", "price": "45.00", "eventTitle": "TechFest Global Summit 2026" },
      { "id": 26, "ticketCode": "TKT-91B0C3AA-MWEI8WUA", "tierName": "Entrada General", "price": "45.00", "eventTitle": "TechFest Global Summit 2026" }
    ]
  }
}
```
Error `400` con el motivo en `message`: sin entradas seleccionadas, localidad inexistente, evento no publicado, cupo insuficiente o pago rechazado.

#### `GET /orders/my-orders`
Órdenes del usuario autenticado, de la más reciente a la más antigua.
```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "order_number": "PM-MWEI8WU7-6011",
      "user_id": 3,
      "total_amount": "90.00",
      "payment_gateway": "MOCK_SANDBOX",
      "payment_intent_id": "pi_mock_1794545820223_opo6w80",
      "payment_status": "COMPLETED",
      "created_at": "2026-11-13T04:57:00.000Z",
      "ticket_count": 2
    }
  ]
}
```

#### `GET /orders/:id`
Detalle de una orden con `user_name`, `user_email` y el arreglo `tickets`. Solo la puede ver su dueño o un `ADMIN`; cualquier otro usuario recibe `403`. Error `404` si no existe.

#### `GET /orders`
Todas las órdenes del sistema, con la misma estructura que `/orders/my-orders` más `user_name` y `user_email` del comprador.

### 4. Tickets y códigos QR (`/tickets`)

#### `GET /tickets/my-tickets`
Boletos del usuario autenticado con los datos del evento y la localidad. `status` puede ser `ACTIVE`, `CHECKED_IN` o `CANCELLED`.
```json
{
  "success": true,
  "data": [
    {
      "id": 25,
      "order_id": 12,
      "ticket_code": "TKT-5E9C17DC-MWEI8WU9",
      "status": "ACTIVE",
      "checked_in_at": null,
      "tier_name": "Entrada General",
      "tier_price": "45.00",
      "event_id": 1,
      "event_title": "TechFest Global Summit 2026",
      "event_location": "Centro de Convenciones Metropolitano - Gran Salón A",
      "event_date": "2026-12-15T09:00:00.000Z",
      "order_number": "PM-MWEI8WU7-6011"
    }
  ]
}
```

#### `GET /tickets/:id`
Mismo boleto más `buyer_name`, `buyer_email` y `qr_image`: la imagen del código QR en base64 (`data:image/png;base64,...`), lista para mostrarse en una etiqueta `<img>`. Error `403` si el boleto es de otro usuario; `404` si no existe.

### 5. Check-in y control de acceso (`/checkin`)

#### `POST /checkin/verify`
Valida un boleto y, si está activo, lo marca como ingresado. `qrData` es el contenido leído del QR o, para el ingreso manual, solo el código del boleto. `eventId` y `deviceInfo` son opcionales.
```json
{
  "qrData": "{\"app\":\"PASSMASTER\",\"code\":\"TKT-5E9C17DC-MWEI8WU9\",\"sig\":\"d04d4c71...\"}",
  "eventId": 1,
  "deviceInfo": "Móvil Puerta Norte"
}
```
El campo `result` de la respuesta indica el veredicto:

| HTTP | `result` | Significado |
| :--- | :--- | :--- |
| `200` | `SUCCESS` | Acceso autorizado; el boleto pasa de `ACTIVE` a `CHECKED_IN` |
| `409` | `ALREADY_USED` | El boleto ya ingresó; se devuelve la fecha del primer ingreso |
| `400` | `CANCELLED` | El boleto está cancelado o reembolsado |
| `400` | `WRONG_EVENT` | El boleto pertenece a otro evento |
| `400` | `COUNTERFEIT_ALERT` | La firma digital del QR no es válida |
| `400` | `INVALID` | No se envió `qrData` |
| `404` | `INVALID` | El código no existe |

Cada intento sobre un boleto existente queda registrado en el historial.

#### `GET /checkin/logs/:eventId`
Últimos 50 escaneos del evento, del más reciente al más antiguo.
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "ticket_id": 25,
      "scanned_by_user_id": 2,
      "scan_timestamp": "2026-12-15T09:12:00.000Z",
      "result": "ALREADY_USED",
      "device_info": "Web Scanner",
      "ticket_code": "TKT-5E9C17DC-MWEI8WU9",
      "tier_name": "Entrada General",
      "staff_name": "Personal Check-in Acceso A",
      "event_title": "TechFest Global Summit 2026"
    }
  ]
}
```

## Mapa de Navegación

PassMaster es una aplicación de una sola página. No tiene rutas: la dirección del navegador no cambia, y lo que cambia es la vista que se muestra. La aplicación abre siempre en el catálogo de eventos y el menú superior, visible en todas las vistas, muestra las opciones según el rol de la sesión.

```mermaid
graph TD
    Menu["Menú superior, visible en todas las vistas"]
    Catalogo["Eventos: catálogo y buscador"]
    Detalle["Detalle del evento: selección de entradas y pago"]
    Auth["Ventana Iniciar Sesión o Crear Cuenta"]
    Exito["Confirmación: pago exitoso y boletos emitidos"]
    Boletos["Mis Boletos"]
    QR["Ventana del boleto: código QR e impresión"]
    Scanner["Check-in Staff: cámara QR, código manual e historial"]
    Aforo["Dashboard Aforo: pestaña Monitoreo de Aforo en Vivo"]
    Gestion["Dashboard Aforo: pestaña Gestión de Eventos"]
    Form["Ventana Crear o Editar evento"]

    Menu -->|"Eventos o logo"| Catalogo
    Menu -->|"Ingresar, sin sesión"| Auth
    Menu -->|"Mis Boletos, con sesión"| Boletos
    Menu -->|"Check-in Staff, rol STAFF o ADMIN"| Scanner
    Menu -->|"Dashboard Aforo, rol ADMIN"| Aforo

    Catalogo -->|"Ver Entradas y Precios"| Detalle
    Detalle -->|"Volver a Eventos"| Catalogo
    Detalle -->|"Comprar sin sesión"| Auth
    Detalle -->|"Confirmar y Comprar Entradas"| Exito
    Exito -->|"Ver Mis Boletos y Códigos QR"| Boletos
    Boletos -->|"Ver Código QR"| QR

    Aforo -->|"Cambio de pestaña"| Gestion
    Gestion -->|"Cambio de pestaña o Ver Aforo"| Aforo
    Aforo -->|"Crear Nuevo Evento"| Form
    Gestion -->|"Crear Nuevo Evento o Editar"| Form
```

Cada nodo del diagrama corresponde a un archivo del frontend:

| Vista | Archivo | Se llega desde |
| :--- | :--- | :--- |
| Menú superior | `frontend/src/components/Navbar.jsx` | Siempre visible |
| Eventos | `frontend/src/pages/CatalogPage.jsx` | Vista inicial, botón Eventos o logo |
| Detalle del evento, pago y confirmación | `frontend/src/pages/EventDetailPage.jsx` | Botón Ver Entradas y Precios de un evento |
| Ventana de sesión | `frontend/src/pages/AuthModal.jsx` | Botón Ingresar, o al intentar comprar sin sesión |
| Mis Boletos y ventana del boleto | `frontend/src/pages/MyTicketsPage.jsx` | Menú, o al terminar una compra |
| Check-in Staff | `frontend/src/pages/StaffScannerPage.jsx` | Menú, con rol STAFF o ADMIN |
| Dashboard Aforo y ventana de evento | `frontend/src/pages/AdminDashboardPage.jsx` | Menú, con rol ADMIN |

La ventana de sesión se abre encima de la vista actual; al iniciar sesión o registrarse se cierra y el usuario permanece en la misma vista. Al cerrar sesión desaparecen del menú las opciones que dependen del rol.

### Vistas disponibles por rol

| Vista | Visitante | CUSTOMER | STAFF | ADMIN |
| :--- | :---: | :---: | :---: | :---: |
| Eventos (catálogo) | Sí | Sí | Sí | Sí |
| Detalle del evento | Sí | Sí | Sí | Sí |
| Comprar entradas | No | Sí | Sí | Sí |
| Mis Boletos | No | Sí | Sí | Sí |
| Check-in Staff | No | No | Sí | Sí |
| Dashboard Aforo | No | No | No | Sí |

### Flujos principales

Compra de entradas:
1. Eventos.
2. Detalle del evento, con la selección de entradas.
3. Inicio de sesión, si el usuario aún no tiene una sesión abierta.
4. Pago y confirmación.
5. Mis Boletos y ventana con el código QR.

Check-in:
1. Inicio de sesión con una cuenta de Staff o Administrador.
2. Check-in Staff y selección del evento.
3. Escaneo del QR o ingreso manual del código.
4. Resultado de la validación e historial de escaneos.

Administración:
1. Inicio de sesión con la cuenta de Administrador.
2. Dashboard Aforo, pestaña Monitoreo de Aforo en Vivo.
3. Pestaña Gestión de Eventos para crear, editar o eliminar eventos.

## Guía de Usuario

### Requisitos

- Con Docker: solo Docker con Docker Compose.
- Sin Docker: Node.js 18 o superior y MySQL 8.0.
- Un navegador moderno (Chrome, Firefox o Edge). El escáner necesita permiso de cámara, y los navegadores solo lo conceden en `localhost` o en sitios con HTTPS.

### Obtener y lanzar el proyecto

1. Clona el repositorio en una carpeta vacía: `git clone https://github.com/elputiciero2/passmaster .`
2. Levanta el sistema: `docker compose up --build`
3. Espera a que el backend indique que está en ejecución y abre `http://localhost:8080`.

El detalle de cada paso y los comandos para detener, reiniciar o cambiar de rama están en la sección "Instalación y Uso con Docker".

### Ingresar a la plataforma

1. Abre la aplicación (`http://localhost:8080` con Docker).
2. Pulsa **Ingresar** en la esquina superior derecha.
3. Inicia sesión con tu correo y contraseña, o cambia a registro para crear una cuenta de comprador. Los botones Admin, Staff Check-in y Cliente rellenan las credenciales de las cuentas de demostración.

El catálogo de eventos se puede explorar sin iniciar sesión; para comprar sí hace falta una cuenta.

### Para el comprador

1. En **Eventos**, busca por título o ubicación y pulsa **Ver Entradas y Precios** en el evento que te interese.
2. En **1. Selecciona tus Entradas**, elige la cantidad de cada localidad. Las localidades sin cupo aparecen como **Agotado**.
3. En **2. Pago Seguro**, revisa el total y pulsa **Confirmar y Comprar Entradas**. La pasarela está en modo sandbox, así que el pago se aprueba al instante sin cobrar nada real.
4. Verás la confirmación con el total abonado y los códigos de tus boletos.
5. En **Mis Boletos**, pulsa **Ver Código QR** para abrir el boleto. Desde ahí puedes mostrarlo en el celular o usar **Imprimir Boleto Digital**.
6. Presenta el QR en la entrada del evento. Cada boleto sirve para un solo ingreso.

### Para el personal de check-in (Staff)

1. Inicia sesión con una cuenta de Staff y entra a **Check-in Staff**.
2. En **Puesto de Control para**, selecciona el evento que estás controlando.
3. Pulsa **Activar Cámara** y apunta al código QR del asistente. Si la cámara no está disponible, escribe el código del boleto (por ejemplo `TKT-5E9C17DC-MWEI8WU9`) en el campo de ingreso manual.
4. Lee el veredicto:
   - Acceso autorizado: el boleto es válido y queda marcado como ingresado; se muestran los datos del asistente.
   - Boleto ya utilizado: ya se registró un ingreso con ese boleto; se muestra la hora del primero. No dejes pasar.
   - Otro evento, cancelado, inexistente o alerta de falsificación: el boleto no es válido para este acceso.
5. El historial inferior muestra los últimos escaneos del evento; pulsa **Actualizar** para refrescarlo.

### Para el administrador

1. Inicia sesión con la cuenta de administrador y entra a **Dashboard Aforo**.
2. Monitoreo de Aforo en Vivo: elige el evento en **Monitoreando**. El panel muestra capacidad total, entradas vendidas, ingresos físicos (check-in) y porcentaje de ocupación del recinto, y se actualiza solo cada 5 segundos.
3. Crear Nuevo Evento: completa título, lugar, fecha y hora, aforo máximo, estado, imagen y descripción. Luego agrega las localidades con **Agregar Localidad**, cada una con nombre, precio y cupos. Solo se pueden comprar entradas de eventos en estado **Publicado**.
4. Gestión de Eventos: cada evento tiene los botones **Ver Aforo**, **Editar** y **Eliminar**. Un evento que ya vendió boletos no se puede eliminar; cámbiale el estado a **Cancelado** o **Finalizado**.

### Problemas frecuentes

| Problema | Solución |
| :--- | :--- |
| La cámara no se activa | Abre la aplicación desde `localhost` o por HTTPS y concede el permiso de cámara; mientras tanto usa el ingreso manual. |
| "Cupo insuficiente" al comprar | Otra persona compró esas entradas antes; reduce la cantidad o elige otra localidad. |
| "Token expirado o inválido" | La sesión dura 7 días; vuelve a iniciar sesión. |
| Quiero reiniciar los datos de demostración | Ejecuta `docker compose down -v` y luego `docker compose up --build`. |

## Creadores del Proyecto

- Diego Manjarres
- Juan Borja
- Jean Perez
