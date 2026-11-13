const Event = require('../models/Event');
const TicketTier = require('../models/TicketTier');
const { isStr, toNumber, toInt, isHttpUrl } = require('../utils/validate');

const STATUSES = ['DRAFT', 'PUBLISHED', 'FINISHED', 'CANCELLED'];
const MAX_ID = 4294967295;

// Visitantes y compradores solo ven eventos publicados; borradores y cancelados son internos
const seesAllEvents = (req) => !!req.user && ['ADMIN', 'STAFF'].includes(req.user.role);

/**
 * Valida y limpia el cuerpo de creación o edición de un evento.
 * Devuelve { error } o { data } con solo los campos enviados.
 */
function parseEventInput(body, { partial }) {
  if (!body || typeof body !== 'object') return { error: 'Cuerpo de la petición inválido.' };

  const data = {};
  const has = (key) => body[key] !== undefined && body[key] !== null;

  for (const [key, max] of [['title', 200], ['location', 255]]) {
    if (has(key)) {
      if (!isStr(body[key], max)) return { error: `El campo ${key} es inválido o demasiado largo.` };
      data[key] = body[key].trim();
    } else if (!partial) {
      return { error: 'Título, ubicación y fecha son campos requeridos.' };
    }
  }

  if (has('event_date')) {
    if (!isStr(body.event_date, 40) || Number.isNaN(Date.parse(body.event_date))) {
      return { error: 'La fecha del evento es inválida.' };
    }
    data.event_date = body.event_date;
  } else if (!partial) {
    return { error: 'Título, ubicación y fecha son campos requeridos.' };
  }

  if (has('description')) {
    if (typeof body.description !== 'string' || body.description.length > 5000) {
      return { error: 'La descripción es inválida o demasiado larga.' };
    }
    data.description = body.description;
  }

  if (body.banner_url === '' || body.banner_url === null) {
    data.banner_url = null;
  } else if (has('banner_url')) {
    if (!isHttpUrl(body.banner_url)) return { error: 'La imagen debe ser una URL http o https.' };
    data.banner_url = body.banner_url;
  }

  if (has('max_capacity')) {
    data.max_capacity = toInt(body.max_capacity, 1, 1000000);
    if (data.max_capacity === null) return { error: 'El aforo máximo debe ser un entero entre 1 y 1.000.000.' };
  }

  if (has('status')) {
    if (!STATUSES.includes(body.status)) return { error: 'Estado de evento inválido.' };
    data.status = body.status;
  }

  if (has('tiers')) {
    if (!Array.isArray(body.tiers) || body.tiers.length > 20) return { error: 'Listado de localidades inválido (máximo 20).' };

    data.tiers = [];
    for (const tier of body.tiers) {
      if (!tier || typeof tier !== 'object') return { error: 'Localidad inválida.' };

      const price = toNumber(tier.price);
      const clean = {
        id: tier.id === undefined || tier.id === null ? null : toInt(tier.id, 1, MAX_ID),
        name: isStr(tier.name, 100) ? tier.name.trim() : null,
        description: typeof tier.description === 'string' ? tier.description.slice(0, 255) : null,
        price: Number.isFinite(price) && price >= 0 && price <= 1000000 ? price : null,
        total_quantity: toInt(tier.total_quantity, 1, 1000000)
      };

      if ((tier.id !== undefined && tier.id !== null && clean.id === null) || clean.name === null || clean.price === null || clean.total_quantity === null) {
        return { error: 'Cada localidad requiere nombre, precio entre 0 y 1.000.000 y cupos enteros entre 1 y 1.000.000.' };
      }
      data.tiers.push(clean);
    }
  }

  return { data };
}

class EventController {
  static async getAll(req, res) {
    try {
      const { status, search } = req.query;
      const events = await Event.getAll({
        status: seesAllEvents(req) ? (STATUSES.includes(status) ? status : null) : 'PUBLISHED',
        search: typeof search === 'string' && search.trim() ? search.trim().slice(0, 100) : null
      });
      return res.json({
        success: true,
        data: events
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al listar eventos.',
        error: error.message
      });
    }
  }

  static async getById(req, res) {
    try {
      const id = toInt(req.params.id, 1, MAX_ID);
      const event = id === null ? null : await Event.findById(id);

      if (!event || (event.status !== 'PUBLISHED' && !seesAllEvents(req))) {
        return res.status(404).json({
          success: false,
          message: 'Evento no encontrado.'
        });
      }

      return res.json({
        success: true,
        data: event
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener detalles del evento.',
        error: error.message
      });
    }
  }

  static async create(req, res) {
    try {
      const { error, data } = parseEventInput(req.body, { partial: false });
      if (error) {
        return res.status(400).json({ success: false, message: error });
      }

      const eventId = await Event.create({
        title: data.title,
        description: data.description || null,
        location: data.location,
        event_date: data.event_date,
        banner_url: data.banner_url || null,
        max_capacity: data.max_capacity || 100,
        status: data.status || 'PUBLISHED',
        created_by: req.user.id
      });

      for (const tier of data.tiers || []) {
        await TicketTier.create({
          event_id: eventId,
          name: tier.name,
          description: tier.description,
          price: tier.price,
          total_quantity: tier.total_quantity,
          available_quantity: tier.total_quantity
        });
      }

      const createdEvent = await Event.findById(eventId);

      return res.status(201).json({
        success: true,
        message: 'Evento creado exitosamente.',
        data: createdEvent
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al crear evento.',
        error: error.message
      });
    }
  }

  static async update(req, res) {
    try {
      const id = toInt(req.params.id, 1, MAX_ID);
      const event = id === null ? null : await Event.findById(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento no encontrado.'
        });
      }

      const { error, data } = parseEventInput(req.body, { partial: true });
      if (error) {
        return res.status(400).json({ success: false, message: error });
      }

      // Validar todas las localidades antes de escribir nada
      const existingTiers = new Map(event.tiers.map((tier) => [tier.id, tier]));
      const tierChanges = [];
      for (const tier of data.tiers || []) {
        if (tier.id === null) {
          tierChanges.push({ tier, sold: 0 });
          continue;
        }

        const current = existingTiers.get(tier.id);
        if (!current) {
          return res.status(400).json({
            success: false,
            message: `La localidad ${tier.id} no pertenece a este evento.`
          });
        }

        const sold = current.total_quantity - current.available_quantity;
        if (tier.total_quantity < sold) {
          return res.status(400).json({
            success: false,
            message: `"${current.name}" ya vendió ${sold} entradas; sus cupos no pueden ser menos.`
          });
        }
        tierChanges.push({ tier, sold });
      }

      await Event.update(id, {
        title: data.title || event.title,
        description: data.description !== undefined ? data.description : event.description,
        location: data.location || event.location,
        event_date: data.event_date || event.event_date,
        banner_url: data.banner_url !== undefined ? data.banner_url : event.banner_url,
        max_capacity: data.max_capacity || event.max_capacity,
        status: data.status || event.status
      });

      for (const { tier, sold } of tierChanges) {
        // La disponibilidad se calcula aquí: nunca se acepta la que envíe el cliente
        const fields = {
          name: tier.name,
          description: tier.description,
          price: tier.price,
          total_quantity: tier.total_quantity,
          available_quantity: tier.total_quantity - sold
        };

        if (tier.id === null) {
          await TicketTier.create({ event_id: id, ...fields });
        } else {
          await TicketTier.update(tier.id, fields);
        }
      }

      const updated = await Event.findById(id);

      return res.json({
        success: true,
        message: 'Evento actualizado exitosamente.',
        data: updated
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar evento.',
        error: error.message
      });
    }
  }

  static async delete(req, res) {
    try {
      const id = toInt(req.params.id, 1, MAX_ID);
      const success = id !== null && await Event.delete(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Evento no encontrado o ya eliminado.'
        });
      }

      return res.json({
        success: true,
        message: 'Evento eliminado exitosamente.'
      });
    } catch (error) {
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({
          success: false,
          message: 'El evento ya tiene boletos vendidos y no se puede eliminar. Cambie su estado a Cancelado o Finalizado.'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar evento.',
        error: error.message
      });
    }
  }

  static async getRealtimeStats(req, res) {
    try {
      const id = toInt(req.params.id, 1, MAX_ID);
      const stats = id === null ? null : await Event.getRealtimeOccupancy(id);

      if (!stats) {
        return res.status(404).json({
          success: false,
          message: 'Evento no encontrado para estadísticas de aforo.'
        });
      }

      const effectiveCapacity = stats.total_configured > 0 ? stats.total_configured : stats.max_capacity;

      const occupancyPercentage = effectiveCapacity > 0
        ? Math.round((stats.total_checked_in / effectiveCapacity) * 100)
        : 0;

      const salesPercentage = effectiveCapacity > 0
        ? Math.round((stats.total_sold / effectiveCapacity) * 100)
        : 0;

      return res.json({
        success: true,
        data: {
          ...stats,
          effective_capacity: effectiveCapacity,
          occupancy_percentage: occupancyPercentage,
          sales_percentage: salesPercentage
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas de aforo en tiempo real.',
        error: error.message
      });
    }
  }
}

module.exports = EventController;
