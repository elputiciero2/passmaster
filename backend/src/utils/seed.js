const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

async function runSeed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'passmaster_db'
  });

  try {
    console.log('[Seed] Conectando a passmaster_db para poblar datos de prueba...');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    // 1. Insertar usuarios
    const users = [
      ['Administrador PassMaster', 'admin@passmaster.com', passwordHash, 'ADMIN'],
      ['Personal Check-in Acceso A', 'staff@passmaster.com', passwordHash, 'STAFF'],
      ['Cliente Demo', 'cliente@passmaster.com', passwordHash, 'CUSTOMER']
    ];

    for (const u of users) {
      await connection.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), password_hash = VALUES(password_hash)`,
        u
      );
    }
    console.log('[Seed] Usuarios demo creados con éxito:');
    console.log('   - Admin:    admin@passmaster.com / Password123!');
    console.log('   - Staff:    staff@passmaster.com / Password123!');
    console.log('   - Cliente:  cliente@passmaster.com / Password123!');

    // 2. Insertar Eventos
    const [adminRow] = await connection.query(`SELECT id FROM users WHERE email = 'admin@passmaster.com' LIMIT 1`);
    const adminId = adminRow[0].id;

    const [event1] = await connection.query(
      `INSERT INTO events (title, description, location, event_date, banner_url, max_capacity, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title)`,
      [
        'TechFest Global Summit 2026',
        'El mayor evento de tecnología, desarrollo de software y computación cuántica de la región con conferencias internacionales.',
        'Centro de Convenciones Metropolitano - Gran Salón A',
        '2026-12-15 09:00:00',
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop',
        500,
        'PUBLISHED',
        adminId
      ]
    );

    const [event2] = await connection.query(
      `INSERT INTO events (title, description, location, event_date, banner_url, max_capacity, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title)`,
      [
        'Concierto ElectroVibe 2026',
        'Noche inolvidable de música electrónica y experiencias inmersivas con DJs internacionales.',
        'Arena Live Park, Escenario Principal',
        '2026-11-28 20:00:00',
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop',
        300,
        'PUBLISHED',
        adminId
      ]
    );

    // Obtener IDs de eventos
    const [eventsList] = await connection.query(`SELECT id, title FROM events LIMIT 2`);
    const e1Id = eventsList[0].id;
    const e2Id = eventsList[1]?.id || e1Id;

    // 3. Insertar Tiers para los eventos
    const tiers = [
      [e1Id, 'Entrada General', 'Acceso a conferencias generales y zona de stands comerciales.', 45.00, 350, 350],
      [e1Id, 'Pase VIP + Afterparty', 'Asientos preferenciales frontales y cóctel de clausura.', 120.00, 100, 100],
      [e1Id, 'Early Bird Estudiante', 'Tarifa reducida con acreditación académica vigente.', 25.00, 50, 50],
      [e2Id, 'Pista General', 'Acceso a pista principal.', 35.00, 200, 200],
      [e2Id, 'Palco VIP Open Bar', 'Zona elevada exclusiva con barra libre.', 95.00, 100, 100]
    ];

    for (const t of tiers) {
      await connection.query(
        `INSERT INTO ticket_tiers (event_id, name, description, price, total_quantity, available_quantity)
         VALUES (?, ?, ?, ?, ?, ?)`,
        t
      );
    }

    console.log('[Seed] Eventos y localidades de prueba insertados con éxito.');
  } catch (err) {
    console.error('[Seed Error]:', err.message);
  } finally {
    await connection.end();
  }
}

runSeed();
