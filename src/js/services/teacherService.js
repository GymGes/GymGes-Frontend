import { api } from '../api/axiosClient.js';

export const teacherService = {
    async getTeachers() {
        return await api.get('/teachers/');
    },


    async createTeacher(teacherData) {
        return await api.post('/teachers/', teacherData);
    },


    async updateTeacher(id, teacherData) {
        return await api.put(`/teachers/${id}`, teacherData);
    },


    async deleteTeacher(id) {
        return await api.delete(`/teachers/${id}`);
    }
};
