import { api } from '../api/axiosClient.js';

const toFrontend = (b) => ({
    id: b.id,
    socio_codigo: b.member_code,
    clase_id: b.class_id
});

const isNetworkError = (error) => error?.type === 'network';

export const bookingService = {

    async getBookings() {
        const data = await api.get('/booking/');
        return (Array.isArray(data) ? data : []).map(toFrontend);
    },

    /**
     * Útil para el espacio personal del socio. Si el backend aún no expone
     * esa ruta (404), se filtra en cliente a partir de la lista completa.
     */
    async getBookingsByMember(memberCode) {
        const code = memberCode.trim().toUpperCase();
        try {
            const data = await api.get(`/booking/member/${code}`);
            return (Array.isArray(data) ? data : []).map(toFrontend);
        } catch (error) {
            if (error?.type === 'not_found') {
                const all = await this.getBookings();
                return all.filter(b => b.socio_codigo === code);
            }
            throw error;
        }
    },

    
    async createBooking(bookingData) {
        const payload = {
            member_code: bookingData.socio_codigo.trim().toUpperCase(),
            class_id: Number(bookingData.clase_id)
        };
        return toFrontend(await api.post('/booking/', payload));
    },

    /**
     * Cancela / elimina una reserva por su ID (DELETE /booking/{id}).
     */
    async deleteBooking(id) {
        await api.delete(`/booking/${id}`);
        return true;
    }
};