# PassMaster - Guía de Usuario e Instalación

Manual técnico y operativo para la puesta en marcha y utilización del sistema **PassMaster**.

---

## 1. Requisitos Previos del Sistema

- **Node.js**: v18.0 o superior (recomendado v20+).
- **MySQL Server**: v8.0 o superior (ejecutándose en Laragon, XAMPP o servicio de Windows en el puerto `3306`).
- **Navegador Web Moderno**: Chrome, Firefox o Edge con permisos de cámara para el escaneo de entradas.

---

## 2. Configuración y Puesta en Marcha

### Paso 1: Configurar la Base de Datos MySQL
1. Inicia el servicio de MySQL (por ejemplo, desde la interfaz de **Laragon** pulsando *"Iniciar Todo"*, o en **XAMPP** iniciando el módulo *MySQL*).
2. Abre la consola o terminal y dirígete al directorio del backend:
   ```bash
   cd "D:\Proyecto final pow\backend"
   ```
3. Ejecuta la migración automática para crear la base de datos `passmaster_db` y todas sus tablas:
   ```bash
   npm run migrate
   ```
4. Poblar los datos de prueba iniciales (usuarios, eventos y localidades de demostración):
   ```bash
   npm run seed
   ```

### Paso 2: Credenciales de Demostración
El script de seed crea automáticamente 3 cuentas con la contraseña predeterminada: `Password123!`

| Rol | Correo Electrónico | Contraseña | Funcionalidad Principal |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@passmaster.com` | `Password123!` | Creación de eventos, monitoreo de aforo en tiempo real, gestión de órdenes. |
| **Personal Staff** | `staff@passmaster.com` | `Password123!` | Módulo de Check-in con cámara, validación de códigos de entrada. |
| **Cliente / Comprador** | `cliente@passmaster.com` | `Password123!` | Compra de entradas en pasarela de pago, visualización de boletos con QR. |

### Paso 3: Iniciar el Servidor Backend
```bash
cd "D:\Proyecto final pow\backend"
npm run dev
```
El servidor quedará a la escucha en `http://localhost:5000/api`.

### Paso 4: Iniciar el Frontend (React + Vite)
```bash
cd "D:\Proyecto final pow\frontend"
npm install
npm run dev
```
La aplicación web abrirá en `http://localhost:5173`.

---

## 3. Guía Operativa

### A. Para el Comprador de Entradas
1. Ingresa a la plataforma y explora los eventos destacados.
2. Haz clic en un evento para revisar la información y seleccionar las localidades (General, VIP, etc.).
3. Haz clic en **"Comprar Entradas"**.
4. Completa el formulario de pago seguro. Para pruebas rápidas, el sistema incluye el modo **Sandbox Simulado**, aprobando la transacción al instante.
5. Ve a **"Mis Boletos"** en el menú superior para ver tu entrada con el código QR firmado.

### B. Para el Personal de Check-in (Staff)
1. Inicia sesión con la cuenta `staff@passmaster.com`.
2. Dirígete a la pestaña **"Control de Check-in"**.
3. Selecciona el evento correspondiente.
4. Pulsa **"Activar Cámara"** y apunta al código QR del cliente (o ingresa manualmente el código que figura en el boleto).
5. Observa el veredicto visual:
   - **Verde**: Entrada válida. El sistema descuenta el aforo disponible y registra el ingreso.
   - **Rojo**: El boleto ya fue escaneado antes (evita duplicidad fraudulenta).

### C. Para el Administrador
1. Inicia sesión con `admin@passmaster.com`.
2. Accede al **Dashboard Administrativo**.
3. Revisa la gráfica de aforo en tiempo real: total de boletos emitidos vs. asistentes que han ingresado físicamente.
4. Utiliza el botón **"Nuevo Evento"** para publicar convocatorias con capacidad y precios personalizados.
