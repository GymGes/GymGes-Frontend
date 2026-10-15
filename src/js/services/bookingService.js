/* src/js/services/bookingService.js */
import { api } from '../api/axiosClient.js';

// Mock data inicial alineada con las clases y socios existentes
let mockBookings = [
    { id: 1, socio_codigo: '48291034X', clase_id: 1 },
    { id: 2, socio_codigo: '71982341K', clase_id: 2 },
    { id: 3, socio_codigo: '39481205M', clase_id: 3 },
    { id: 4, socio_codigo: '50192843P', clase_id: 1 }
];

export const bookingService = {
    /**
     * Obtiene la lista completa de reservas
     */
    async getBookings() {
        try {
            return await api.get('/bookings');
        } catch (error) {
            console.warn('Backend API no disponible (usando mock data de reservas):', error.message);
            return [...mockBookings];
        }
    },

    /**
     * Registra una nueva reserva
     */
    async createBooking(bookingData) {
        try {
            return await api.post('/bookings', bookingData);
        } catch (error) {
            console.warn('Backend API no disponible (creando en mock data):', error.message);
            const newBooking = {
                id: mockBookings.length > 0 ? Math.max(...mockBookings.map(b => b.id)) + 1 : 1,
                socio_codigo: bookingData.socio_codigo.trim().toUpperCase(),
                clase_id: Number(bookingData.clase_id)
            };
            mockBookings.unshift(newBooking);
            return newBooking;
        }
    },

    /**
     * Cancela / elimina una reserva por su ID
     */
    async deleteBooking(id) {
        try {
            await api.delete(`/bookings/${id}`);
            return true;
        } catch (error) {
            console.warn('Backend API no disponible (eliminando de mock data):', error.message);
            mockBookings = mockBookings.filter(b => b.id !== id);
            return true;
        }
    }
};