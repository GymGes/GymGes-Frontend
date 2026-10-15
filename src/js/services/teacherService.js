/* src/js/services/teacherService.js */
import { api } from '../api/axiosClient.js';

export const teacherService = {
    /**
     * Obtiene el listado completo de profesores
     */
    async getTeachers() {
        return await api.get('/teachers/');
    },

    /**
     * Registra un nuevo profesor
     */
    async createTeacher(teacherData) {
        return await api.post('/teachers/', teacherData);
    },

    /**
     * Actualiza el nombre de un profesor existente
     */
    async updateTeacher(id, teacherData) {
        return await api.put(`/teachers/${id}`, teacherData);
    },

    /**
     * Elimina un profesor por su ID
     */
    async deleteTeacher(id) {
        return await api.delete(`/teachers/${id}`);
    }
};
