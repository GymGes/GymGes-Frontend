/* src/js/services/bookingService.js */
import { api } from '../api/axiosClient.js';

// Mock data inicial alineada con las clases y socios existentes.
// SOLO se usa si el backend no es accesible por red. Si el backend
// responde con un error (409 cupo/duplicada/solape, 400, 406...), ese
// error se propaga para mostrar el motivo real al usuario.
let mockBookings = [
    { id: 1, socio_codigo: '48291034X', clase_id: 1 },
    { id: 2, socio_codigo: '71982341K', clase_id: 2 },
    { id: 3, socio_codigo: '39481205M', clase_id: 3 },
    { id: 4, socio_codigo: '50192843P', clase_id: 1 }
];

// El backend habla { id, member_code, class_id } y el front { id, socio_codigo, clase_id }.
// La traducción se hace aquí, en la frontera, para no tocar el resto del front.
const toFrontend = (b) => ({
    id: b.id,
    socio_codigo: b.member_code,
    clase_id: b.class_id
});

const isNetworkError = (error) => error?.type === 'network';

export const bookingService = {
    /**
     * Obtiene la lista completa de reservas (GET /booking/)
     */
    async getBookings() {
        try {
            const data = await api.get('/booking/');
            return (Array.isArray(data) ? data : []).map(toFrontend);
        } catch (error) {
            if (!isNetworkError(error)) throw error;
            console.warn('Backend API no disponible (usando mock data de reservas):', error.message);
            return [...mockBookings];
        }
    },

    /**
     * Obtiene las reservas de un socio (GET /booking/member/{member_code}).
     * Útil para el espacio personal del socio.
     */
    async getBookingsByMember(memberCode) {
        const code = memberCode.trim().toUpperCase();
        try {
            const data = await api.get(`/booking/member/${code}`);
            return (Array.isArray(data) ? data : []).map(toFrontend);
        } catch (error) {
            if (!isNetworkError(error)) throw error;
            console.warn('Backend API no disponible (filtrando mock data):', error.message);
            return mockBookings.filter(b => b.socio_codigo === code);
        }
    },

    /**
     * Registra una nueva reserva (POST /booking/ { member_code, class_id }).
     * Si el backend rechaza (duplicada, cupo, solape, sin créditos...),
     * se lanza el error con su mensaje para mostrarlo al usuario.
     */
    async createBooking(bookingData) {
        const payload = {
            member_code: bookingData.socio_codigo.trim().toUpperCase(),
            class_id: Number(bookingData.clase_id)
        };
        try {
            return toFrontend(await api.post('/booking/', payload));
        } catch (error) {
            if (!isNetworkError(error)) throw error;
            console.warn('Backend API no disponible (creando en mock data):', error.message);
            const newBooking = {
                id: mockBookings.length > 0 ? Math.max(...mockBookings.map(b => b.id)) + 1 : 1,
                socio_codigo: payload.member_code,
                clase_id: payload.class_id
            };
            mockBookings.unshift(newBooking);
            return newBooking;
        }
    },

    /**
     * Cancela / elimina una reserva por su ID (DELETE /booking/{id}).
     * Ojo: el backend bloquea con 400 si faltan menos de 2h para la clase.
     */
    async deleteBooking(id) {
        try {
            await api.delete(`/booking/${id}`);
            return true;
        } catch (error) {
            if (!isNetworkError(error)) throw error;
            console.warn('Backend API no disponible (eliminando de mock data):', error.message);
            mockBookings = mockBookings.filter(b => b.id !== id);
            return true;
        }
    }
};