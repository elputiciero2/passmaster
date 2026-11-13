-- =============================================================================
-- PassMaster Initial Seed Data
-- =============================================================================

USE `passmaster_db`;

-- Contraseña para los 3 usuarios por defecto: Password123!
-- Generada con bcrypt (10 rounds): $2b$10$wO3nC7yD6rI3O/4rZgLg0.bF0Vn9U3Gf9e7hF8j0K2L1M3N4O5P6Q (ejemplo estándar)
-- Recomendado ejecutar 'npm run seed' en backend para regenerar con salting en tiempo real.

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`) VALUES
(1, 'Administrador PassMaster', 'admin@passmaster.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN'),
(2, 'Personal Check-in Acceso A', 'staff@passmaster.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'STAFF'),
(3, 'Cliente Demo', 'cliente@passmaster.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CUSTOMER')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- Evento de demostración
INSERT INTO `events` (`id`, `title`, `description`, `location`, `event_date`, `banner_url`, `max_capacity`, `status`, `created_by`) VALUES
(1, 'TechFest Global Summit 2026', 'El mayor evento de tecnología, desarrollo de software y computación cuántica de la región.', 'Centro de Convenciones Metropolitano - Gran Salón A', '2026-12-15 09:00:00', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop', 500, 'PUBLISHED', 1),
(2, 'Concierto ElectroVibe 2026', 'Noche inolvidable de música electrónica y experiencias inmersivas con DJs internacionales.', 'Arena Live Park, Escenario Principal', '2026-11-28 20:00:00', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop', 300, 'PUBLISHED', 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- Localidades / Tiers para el Evento 1
INSERT INTO `ticket_tiers` (`id`, `event_id`, `name`, `description`, `price`, `total_quantity`, `available_quantity`) VALUES
(1, 1, 'Entrada General', 'Acceso a conferencias generales y zona de stands comerciales.', 75000.00, 350, 350),
(2, 1, 'Pase VIP + Afterparty', 'Asientos preferenciales frontales y cóctel de clausura.', 180000.00, 100, 100),
(3, 1, 'Early Bird Estudiante', 'Tarifa reducida para estudiantes con credencial vigente.', 45000.00, 50, 50),
(4, 2, 'Pista General', 'Acceso a pista principal.', 75000.00, 200, 200),
(5, 2, 'Palco VIP', 'Zona elevada exclusiva con barra libre.', 180000.00, 100, 100)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `price` = VALUES(`price`);
