/* src/js/services/planService.js */
import { api } from '../api/axiosClient.js';

// Datos simulados iniciales (Mock data mientras se conecta FastAPI)
let mockPlans = [
    { id: 1, name: 'Plan Básico (4 Clases)', credits: 4 },
    { id: 2, name: 'Plan Estándar (8 Clases)', credits: 8 },
    { id: 3, name: 'Plan Pro (12 Clases)', credits: 12 },
    { id: 4, name: 'Plan Full Access (30 Clases)', credits: 30 }
];

export const planService = {
    /**
     * Obtiene la lista completa de planes de suscripción
     */
    async getPlans() {
        try {
            return await api.get('/plans');
        } catch (error) {
            console.warn('Backend API no disponible (usando mock data de planes):', error.message);
            return [...mockPlans];
        }
    },

    /**
     * Crea un nuevo plan en el catálogo
     */
    async createPlan(planData) {
        try {
            return await api.post('/plans', planData);
        } catch (error) {
            console.warn('Backend API no disponible (creando en mock data):', error.message);
            const newPlan = {
                id: mockPlans.length > 0 ? Math.max(...mockPlans.map(p => p.id)) + 1 : 1,
                name: planData.name.trim(),
                credits: Number(planData.credits)
            };
            mockPlans.push(newPlan);
            return newPlan;
        }
    },

    /**
     * Actualiza los datos de un plan existente
     */
    async updatePlan(id, planData) {
        try {
            return await api.put(`/plans/${id}`, planData);
        } catch (error) {
            console.warn('Backend API no disponible (actualizando en mock data):', error.message);
            const index = mockPlans.findIndex(p => p.id === id);
            if (index !== -1) {
                mockPlans[index] = {
                    ...mockPlans[index],
                    name: planData.name.trim(),
                    credits: Number(planData.credits)
                };
                return mockPlans[index];
            }
            throw error;
        }
    },

    /**
     * Elimina un plan por su ID
     */
    async deletePlan(id) {
        try {
            await api.delete(`/plans/${id}`);
            return true;
        } catch (error) {
            console.warn('Backend API no disponible (eliminando de mock data):', error.message);
            mockPlans = mockPlans.filter(p => p.id !== id);
            return true;
        }
    }
};