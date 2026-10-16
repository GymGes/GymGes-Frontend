import { api } from '../api/axiosClient.js';

function mapWeeklyClass(item) {
    const [activityDate, timePart = "00:00:00"] = item.activity_date.split("T");

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

    const schedules = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
            ? response.data
            : [];

    return schedules.map(mapWeeklyClass);
},
    /**
     * Crea una nueva asignación horaria
     */

async createSchedule(scheduleData) {
    const response = await api.post(
        "/weekly-classes/",
        mapPayload(scheduleData)
    );

    // Admite Axios normal o un interceptor que devuelve response.data
    const created = response?.data ?? response;

    if (!created || !created.activity_date) {
        console.error("Respuesta inesperada al crear sesión:", response);
        throw new Error(
            "El backend no ha devuelto la sesión creada correctamente."
        );
    }

    return mapWeeklyClass(created);
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