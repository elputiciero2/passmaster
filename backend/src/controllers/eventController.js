const Event = require('../models/Event');
const TicketTier = require('../models/TicketTier');

class EventController {
  static async getAll(req, res) {
    try {
      const { status, search } = req.query;
      const events = await Event.getAll({ status, search });
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
      const { id } = req.params;
      const event = await Event.findById(id);

      if (!event) {
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
      const { title, description, location, event_date, banner_url, max_capacity, status, tiers } = req.body;

      if (!title || !location || !event_date) {
        return res.status(400).json({
          success: false,
          message: 'Título, ubicación y fecha son campos requeridos.'
        });
      }

      const eventId = await Event.create({
        title,
        description,
        location,
        event_date,
        banner_url,
        max_capacity: max_capacity || 100,
        status: status || 'PUBLISHED',
        created_by: req.user.id
      });

      // Crear tiers si se proporcionaron
      if (Array.isArray(tiers) && tiers.length > 0) {
        for (const tier of tiers) {
          await TicketTier.create({
            event_id: eventId,
            name: tier.name,
            description: tier.description,
            price: tier.price || 0,
            total_quantity: tier.total_quantity || 50,
            available_quantity: tier.total_quantity || 50
          });
        }
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
      const { id } = req.params;
      const { title, description, location, event_date, banner_url, max_capacity, status, tiers } = req.body;

      const event = await Event.findById(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Evento no encontrado.'
        });
      }

      await Event.update(id, {
        title: title || event.title,
        description: description !== undefined ? description : event.description,
        location: location || event.location,
        event_date: event_date || event.event_date,
        banner_url: banner_url !== undefined ? banner_url : event.banner_url,
        max_capacity: max_capacity || event.max_capacity,
        status: status || event.status
      });

      // Si se enviaron tiers para actualizar
      if (Array.isArray(tiers) && tiers.length > 0) {
        const existingTiers = event.tiers || [];
        for (const tier of tiers) {
          if (tier.id) {
            // Actualizar tier existente
            await TicketTier.update(tier.id, {
              name: tier.name,
              description: tier.description,
              price: tier.price,
              total_quantity: tier.total_quantity,
              available_quantity: tier.available_quantity !== undefined ? tier.available_quantity : tier.total_quantity
            });
          } else {
            // Crear nuevo tier
            await TicketTier.create({
              event_id: id,
              name: tier.name,
              description: tier.description,
              price: tier.price || 0,
              total_quantity: tier.total_quantity || 100,
              available_quantity: tier.total_quantity || 100
            });
          }
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
      const { id } = req.params;
      const success = await Event.delete(id);

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
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar evento.',
        error: error.message
      });
    }
  }

  static async getRealtimeStats(req, res) {
    try {
      const { id } = req.params;
      const stats = await Event.getRealtimeOccupancy(id);

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
