/* src/js/services/planService.js */
import { api } from '../api/axiosClient.js';

export const planService = {
    async getPlans() {
        return await api.get('/plans/');
    },


    async createPlan(planData) {
        return await api.post('/plans/', planData);
    },


    async updatePlan(id, planData) {
        return await api.put(`/plans/${id}`, planData);
    },


    async deletePlan(id) {
        return await api.delete(`/plans/${id}`);
    }
};
