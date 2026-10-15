/* src/js/services/teacherService.js */
import { api } from '../api/axiosClient.js';

// Datos simulados iniciales (Mock data mientras se conecta FastAPI)
let mockTeachers = [
    { id: 1, name: 'Marc Soler' },
    { id: 2, name: 'Elena Gómez' },
    { id: 3, name: 'Clara Vega' },
    { id: 4, name: 'David Rivas' }
];

export const teacherService = {
    /**
     * Obtiene el listado completo de profesores
     */
    async getTeachers() {
        try {
            return await api.get('/teachers');
        } catch (error) {
            console.warn('Backend API no disponible (usando mock data de profesores):', error.message);
            return [...mockTeachers];
        }
    },

    /**
     * Registra un nuevo profesor
     */
    async createTeacher(teacherData) {
        try {
            return await api.post('/teachers', teacherData);
        } catch (error) {
            console.warn('Backend API no disponible (creando en mock data):', error.message);
            const newTeacher = {
                id: mockTeachers.length > 0 ? Math.max(...mockTeachers.map(t => t.id)) + 1 : 1,
                name: teacherData.name.trim()
            };
            mockTeachers.push(newTeacher);
            return newTeacher;
        }
    },

    /**
     * Actualiza el nombre de un profesor existente
     */
    async updateTeacher(id, teacherData) {
        try {
            return await api.put(`/teachers/${id}`, teacherData);
        } catch (error) {
            console.warn('Backend API no disponible (actualizando en mock data):', error.message);
            const index = mockTeachers.findIndex(t => t.id === id);
            if (index !== -1) {
                mockTeachers[index] = {
                    ...mockTeachers[index],
                    name: teacherData.name.trim()
                };
                return mockTeachers[index];
            }
            throw error;
        }
    },

    /**
     * Elimina un profesor por su ID
     */
    async deleteTeacher(id) {
        try {
            await api.delete(`/teachers/${id}`);
            return true;
        } catch (error) {
            console.warn('Backend API no disponible (eliminando de mock data):', error.message);
            mockTeachers = mockTeachers.filter(t => t.id !== id);
            return true;
        }
    }
};