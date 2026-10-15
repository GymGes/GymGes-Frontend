/* src/js/services/planService.js */
import { api } from '../api/axiosClient.js';

export const planService = {
    /**
     * Obtiene la lista completa de planes de suscripción
     */
    async getPlans() {
        return await api.get('/plans/');
    },

    /**
     * Crea un nuevo plan en el catálogo
     */
    async createPlan(planData) {
        return await api.post('/plans/', planData);
    },

    /**
     * Actualiza los datos de un plan existente
     */
    async updatePlan(id, planData) {
        return await api.put(`/plans/${id}`, planData);
    },

    /**
     * Elimina un plan por su ID
     */
    async deletePlan(id) {
        return await api.delete(`/plans/${id}`);
    }
};
