# PassMaster API - Especificación Técnica de Endpoints

Documentación completa de la API RESTful del Sistema de Ticketing y Acceso a Eventos (**PassMaster**).

- **URL Base:** `http://localhost:5000/api`
- **Autenticación:** Encabezado HTTP `Authorization: Bearer <JWT_TOKEN>`
- **Formato:** `application/json`

---

## 1. Módulo de Autenticación (`/auth`)

### `POST /auth/register`
Registra un nuevo usuario en la plataforma.
- **Acceso:** Público
- **Cuerpo de la Petición:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "Password123!",
  "role": "CUSTOMER" // Opcional: "CUSTOMER" o "STAFF"
}
```
- **Respuesta (201 Created):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente.",
  "data": {
    "user": { "id": 4, "name": "Juan Pérez", "email": "juan@example.com", "role": "CUSTOMER" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

### `POST /auth/login`
Inicia sesión y genera un JSON Web Token (JWT).
- **Acceso:** Público
- **Cuerpo de la Petición:**
```json
{
  "email": "admin@passmaster.com",
  "password": "Password123!"
}
```
- **Respuesta (200 OK):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso.",
  "data": {
    "user": { "id": 1, "name": "Administrador", "email": "admin@passmaster.com", "role": "ADMIN" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

### `GET /auth/me`
Obtiene los datos del usuario actualmente autenticado según su token JWT.
- **Acceso:** Requiere Token (`ADMIN`, `STAFF`, `CUSTOMER`)
- **Respuesta (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "name": "Administrador", "email": "admin@passmaster.com", "role": "ADMIN" }
  }
}
```

---

## 2. Módulo de Eventos y Aforo (`/events`)

### `GET /events`
Lista todos los eventos disponibles con filtros opcionales.
- **Acceso:** Público
- **Query Params:** `status=PUBLISHED`, `search=musica`
- **Respuesta (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "TechFest Global Summit 2026",
      "location": "Centro de Convenciones Metropolitano",
      "event_date": "2026-12-15T09:00:00.000Z",
      "max_capacity": 500,
      "status": "PUBLISHED",
      "configured_capacity": "500",
      "available_capacity": "450",
      "sold_tickets": "50"
    }
  ]
}
```

### `GET /events/:id`
Obtiene la información detallada de un evento junto a sus localidades (Tiers) y precios.
- **Acceso:** Público
- **Respuesta (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "TechFest Global Summit 2026",
    "description": "El mayor evento de tecnología...",
    "location": "Centro de Convenciones Metropolitano",
    "event_date": "2026-12-15T09:00:00.000Z",
    "tiers": [
      {
        "id": 1,
        "name": "Entrada General",
        "price": "45.00",
        "total_quantity": 350,
        "available_quantity": 320
      }
    ]
  }
}
```

### `GET /events/:id/occupancy`
Monitoreo de aforo en tiempo real para el Dashboard de Administración.
- **Acceso:** Requiere Token con rol `ADMIN` o `STAFF`
- **Respuesta (200 OK):**
```json
{
  "success": true,
  "data": {
    "event_id": 1,
    "title": "TechFest Global Summit 2026",
    "max_capacity": 500,
    "total_configured": 500,
    "total_sold": 410,
    "total_available": 90,
    "total_checked_in": 285,
    "occupancy_percentage": 57,
    "sales_percentage": 82
  }
}
```

### `POST /events`
Crea un nuevo evento y sus localidades asociadas.
- **Acceso:** Requiere Token con rol `ADMIN`
- **Cuerpo de la Petición:**
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

---

## 3. Módulo de Órdenes y Pasarela de Pagos (`/orders`)

### `POST /orders/checkout`
Procesa la compra atómica de entradas bajo transacción MySQL con bloqueo pesimista (`FOR UPDATE`), evitando sobreventas y emitiendo boletos con identificadores únicos y firmas HMAC.
- **Acceso:** Requiere Token (`CUSTOMER`, `ADMIN`)
- **Cuerpo de la Petición:**
```json
{
  "items": [
    { "tierId": 1, "quantity": 2 }
  ],
  "paymentInfo": {
    "method": "card",
    "token": "tok_visa" // Omitir para auto-simulación Sandbox inmediata
  }
}
```
- **Respuesta (201 Created):**
```json
{
  "success": true,
  "message": "¡Compra procesada y tickets generados exitosamente!",
  "data": {
    "orderId": 12,
    "orderNumber": "PM-K893DF-4921",
    "totalAmount": 90.00,
    "gateway": "MOCK_SANDBOX",
    "tickets": [
      {
        "id": 25,
        "ticketCode": "TKT-A81E99B2-K92",
        "tierName": "Entrada General",
        "price": "45.00"
      }
    ]
  }
}
```

### `GET /orders/my-orders`
Lista las órdenes realizadas por el usuario logueado.
- **Acceso:** Requiere Token

---

## 4. Módulo de Tickets y Códigos QR (`/tickets`)

### `GET /tickets/my-tickets`
Devuelve el listado de todos los boletos adquiridos por el comprador, con estado actual (`ACTIVE`, `CHECKED_IN`, `CANCELLED`).
- **Acceso:** Requiere Token

### `GET /tickets/:id`
Devuelve la información de un boleto específico junto con la **imagen del código QR generada en base64 (Data URL)**.
- **Acceso:** Requiere Token (Comprador del ticket, Staff o Admin)
- **Respuesta (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 25,
    "ticket_code": "TKT-A81E99B2-K92",
    "status": "ACTIVE",
    "tier_name": "Entrada General",
    "event_title": "TechFest Global Summit 2026",
    "qr_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

---

## 5. Módulo de Check-in y Control de Acceso (`/checkin`)

### `POST /checkin/verify`
Valida el ticket escaneado por el personal de acceso mediante cámara web/móvil o ingresado manualmente.
- **Acceso:** Requiere Token con rol `STAFF` o `ADMIN`
- **Cuerpo de la Petición:**
```json
{
  "qrData": "{\"app\":\"PASSMASTER\",\"code\":\"TKT-A81E99B2-K92\",\"sig\":\"e2f41c...\"}",
  "eventId": 1,
  "deviceInfo": "Móvil Entrada Puerta Norte"
}
```
- **Posibles Respuestas:**
  - **`200 OK - SUCCESS`**: Entrada autorizada por primera vez. Estado cambia a `CHECKED_IN`.
  - **`409 Conflict - ALREADY_USED`**: Boleto ya utilizado. Devuelve fecha y hora del ingreso previo.
  - **`400 Bad Request - COUNTERFEIT_ALERT`**: Firma HMAC manipulada o fraudulenta.
  - **`400 Bad Request - WRONG_EVENT`**: El boleto corresponde a otro evento.
  - **`404 Not Found - INVALID`**: Código inexistente.

### `GET /checkin/logs/:eventId`
Historial de lecturas y auditoría de escaneo para un evento en tiempo real.
- **Acceso:** Requiere Token con rol `STAFF` o `ADMIN`
