const API_BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('passmaster_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Error ${response.status}: Petición fallida`);
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  me: () => request('/auth/me'),

  // Events
  getEvents: (params = '') => request(`/events${params ? '?' + params : ''}`),
  getEventById: (id) => request(`/events/${id}`),
  createEvent: (eventData) => request('/events', { method: 'POST', body: JSON.stringify(eventData) }),
  updateEvent: (id, eventData) => request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(eventData) }),
  deleteEvent: (id) => request(`/events/${id}`, { method: 'DELETE' }),
  getEventOccupancy: (id) => request(`/events/${id}/occupancy`),

  // Orders & Payment
  checkout: (items, paymentInfo) => request('/orders/checkout', { method: 'POST', body: JSON.stringify({ items, paymentInfo }) }),
  getMyOrders: () => request('/orders/my-orders'),
  getAllOrders: () => request('/orders'),

  // Tickets
  getMyTickets: () => request('/tickets/my-tickets'),
  getTicketById: (id) => request(`/tickets/${id}`),

  // Check-In (Staff / Admin)
  verifyCheckIn: (qrData, eventId, deviceInfo) => request('/checkin/verify', { method: 'POST', body: JSON.stringify({ qrData, eventId, deviceInfo }) }),
  getCheckInLogs: (eventId) => request(`/checkin/logs/${eventId}`)
};
