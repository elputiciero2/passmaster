# PassMaster - Sistema de Ticketing y Acceso a Eventos

Solución web integral para la creación, venta y validación segura de entradas a eventos con monitoreo de aforo en tiempo real.

Desarrollado bajo una arquitectura desacoplada: **Frontend en React (Vite + Tailwind CSS)** y **Backend en Node.js (Arquitectura MVC + MySQL 8.0)**.

---

## 🎯 Cumplimiento de Especificaciones

| Requerimiento | Implementación en PassMaster |
| :--- | :--- |
| **Arquitectura MVC** | Separación estricta en el Backend: Modelos (`src/models`), Vistas/Endpoints (`src/routes`), Controladores (`src/controllers`), y Servicios (`src/services`). |
| **Seguridad & Encriptación** | Autenticación con **JWT** (JSON Web Tokens), contraseñas encriptadas con **Bcrypt (10 salt rounds)** y códigos QR con firma criptográfica **HMAC-SHA256**. |
| **Base de Datos & Transacciones** | **MySQL 8.0** con transacciones ACID y bloqueo pesimista (`SELECT ... FOR UPDATE`) para evitar sobreventa de cupos (*race conditions*). |
| **Unicidad de Códigos** | Emisión de identificadores únicos UUID v4 alfanuméricos (`TKT-XXXXXXXX-XXX`) con firma infalsificable. |
| **Módulo de Check-in** | Validador para personal (Staff) con lectura óptica por **Cámara Web/Móvil** y validación de estados (`ACTIVE` -> `CHECKED_IN`, prevención de reingreso). |
| **Pasarela de Pagos** | Pasarela integrada en dos modalidades: **Stripe Elements/API** y **Sandbox Simulado** para pruebas instantáneas. |
| **Monitoreo de Aforo** | Dashboard administrativo con actualización en tiempo real de ocupación física, porcentaje de ventas y capacidad remanente. |
| **Entregable Documental** | [api-spec.md](docs/api-spec.md), [navigation-map.md](docs/navigation-map.md) y [user-guide.md](docs/user-guide.md). |

---

## 📂 Estructura del Repositorio

```
D:\Proyecto final pow\
├── backend/
│   ├── src/
│   │   ├── config/          # Conexión DB MySQL (Pool de conexiones)
│   │   ├── controllers/     # Controladores MVC (Auth, Event, Order, Ticket, CheckIn)
│   │   ├── middlewares/     # JWT y validación de roles (ADMIN, STAFF, CUSTOMER)
│   │   ├── models/          # Entidades y consultas SQL (User, Event, Ticket, etc.)
│   │   ├── routes/          # Rutas RESTful (/api/auth, /api/events, /api/checkin...)
│   │   ├── services/        # Lógica de pago, generación QR y compra atómica
│   │   ├── utils/           # Migraciones, Seed y utilidades criptográficas HMAC
│   │   └── server.js        # Punto de entrada Express
│   ├── database/
│   │   ├── schema.sql       # Script DDL de base de datos
│   │   └── seed.sql         # Datos de demostración
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # Cliente HTTP centralizado
│   │   ├── components/      # Navbar, Modal, componentes reutilizables
│   │   ├── context/         # AuthContext (Sesión y JWT)
│   │   ├── pages/           # Catálogo, Detalle/Compra, Mis Boletos, Dashboard Aforo, Check-in Staff
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
└── docs/
    ├── api-spec.md          # Especificación completa de Endpoints
    ├── navigation-map.md    # Mapa del sitio y flujos por rol
    └── user-guide.md        # Manual de instalación y operación
```

---

## 🚀 Puesta en Marcha Rápida

### 1. Iniciar Base de Datos MySQL
Asegúrate de que tu servicio MySQL esté encendido (por ejemplo en Laragon o XAMPP en el puerto `3306`).

### 2. Configurar y Poblar la Base de Datos
Desde la terminal en `D:\Proyecto final pow\backend`:
```bash
# 1. Crear la base de datos passmaster_db y sus tablas
npm run migrate

# 2. Poblar usuarios de prueba y eventos iniciales
npm run seed
```

### 3. Iniciar Backend
```bash
npm run dev
# Servidor activo en http://localhost:5000/api
```

### 4. Iniciar Frontend
En otra terminal en `D:\Proyecto final pow\frontend`:
```bash
npm run dev
# Aplicación web disponible en http://localhost:5173
```

---

## 🔑 Cuentas de Acceso de Demostración

| Rol | Correo | Contraseña | Capacidades |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@passmaster.com` | `Password123!` | Dashboard de aforo en vivo, creación de eventos y localidades. |
| **Staff de Acceso** | `staff@passmaster.com` | `Password123!` | Lector de cámara QR para Check-in y auditoría de accesos. |
| **Comprador** | `cliente@passmaster.com` | `Password123!` | Compra de entradas en pasarela y visor de boletos digitales con QR. |
