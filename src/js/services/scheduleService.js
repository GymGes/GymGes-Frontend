/* src/js/services/scheduleService.js */
import { api } from '../api/axiosClient.js';

function mapWeeklyClass(item) {

    const [activityDate, timePart] = item.activity_date.split('T');

    return {
        id: item.id,
        activityId: item.activity_type_id,
        teacherId: item.teacher_id,
        activityDate,
        startTime: timePart.slice(0, 5),
        availableSpots: item.available_spots,
    };
}
// Convierte los datos del formulario al formato de FastAPI
function mapPayload(data) {
    return {
        activity_type_id: Number(data.activityId),
        teacher_id: Number(data.teacherId),
        activity_date: `${data.activityDate}T${data.startTime}:00`,
    };
}
export const scheduleService = {
    /**
     * Obtiene la lista de horarios semanales
     */
    async getSchedules() {
        const response = await api.get('/weekly-classes/');
        return response.data.map(mapWeeklyClass);
    },

    /**
     * Crea una nueva asignación horaria
     */
    async createSchedule(scheduleData) {
        const response = await api.post(
            '/weekly-classes/',
            mapPayload(scheduleData)
        );

        return mapWeeklyClass(response.data);
    },

    /**
     * Actualiza una asignación horaria existente
     */
    // async updateSchedule(id, scheduleData) {
    //     try {
    //         return await api.put(`/schedules/${id}`, scheduleData);
    //     } catch (error) {
    //         console.warn('Backend API no disponible (actualizando en mock data):', error.message);
    //         const index = mockSchedules.findIndex(s => s.id === id);
    //         if (index !== -1) {
    //             mockSchedules[index] = {
    //                 ...mockSchedules[index],
    //                 activityId: Number(scheduleData.activityId),
    //                 dayOfWeek: Number(scheduleData.dayOfWeek),
    //                 startTime: scheduleData.startTime,
    //                 teacherId: Number(scheduleData.teacherId)
    //             };
    //             return mockSchedules[index];
    //         }
    //         throw error;
    //     }
    // },

    /**
     * Elimina un horario por su ID
     */
      async deleteSchedule(id) {
        await api.delete(`/weekly-classes/${id}`);
        return true;
    },
    
};