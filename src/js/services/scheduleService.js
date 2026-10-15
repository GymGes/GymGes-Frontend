import { api } from '../api/axiosClient.js';

export const ACTIVITIES_MAP = {
    1: { name: 'Crossfit Studio', meta: '50 min · Máx. 16 alumnos' },
    2: { name: 'Hyrox Conditioning', meta: '50 min · Máx. 20 alumnos' },
    3: { name: 'HIIT Circuit', meta: '50 min · Máx. 18 alumnos' },
    4: { name: 'Vinyasa Yoga', meta: '50 min · Máx. 14 alumnos' },
    5: { name: 'Pilates Reformer', meta: '50 min · Máx. 12 alumnos' }
};

export const TEACHERS_MAP = {
    1: 'Marc Soler',
    2: 'Elena Gómez',
    3: 'Clara Vega',
    4: 'David Rivas'
};

export const DAY_NAMES = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo'
};

let mockSchedules = [
    {
        id: 1,
        activityId: 2,
        dayOfWeek: 3,
        startTime: '07:30',
        teacherId: 1
    },
    {
        id: 2,
        activityId: 1,
        dayOfWeek: 3,
        startTime: '09:00',
        teacherId: 2
    },
    {
        id: 3,
        activityId: 5,
        dayOfWeek: 3,
        startTime: '18:00',
        teacherId: 3
    },
    {
        id: 4,
        activityId: 4,
        dayOfWeek: 4,
        startTime: '18:00',
        teacherId: 1
    }
];

export const scheduleService = {
    async getSchedules() {
        try {
            return await api.get('/schedules');
        } catch (error) {
            console.warn('Backend API no disponible (usando mock data de horarios):', error.message);
            return [...mockSchedules];
        }
    },


    async createSchedule(scheduleData) {
        try {
            return await api.post('/schedules', scheduleData);
        } catch (error) {
            console.warn('Backend API no disponible (creando en mock data):', error.message);
            const newSchedule = {
                id: Date.now(),
                activityId: Number(scheduleData.activityId),
                dayOfWeek: Number(scheduleData.dayOfWeek),
                startTime: scheduleData.startTime,
                teacherId: Number(scheduleData.teacherId)
            };
            mockSchedules.unshift(newSchedule);
            return newSchedule;
        }
    },


    async updateSchedule(id, scheduleData) {
        try {
            return await api.put(`/schedules/${id}`, scheduleData);
        } catch (error) {
            console.warn('Backend API no disponible (actualizando en mock data):', error.message);
            const index = mockSchedules.findIndex(s => s.id === id);
            if (index !== -1) {
                mockSchedules[index] = {
                    ...mockSchedules[index],
                    activityId: Number(scheduleData.activityId),
                    dayOfWeek: Number(scheduleData.dayOfWeek),
                    startTime: scheduleData.startTime,
                    teacherId: Number(scheduleData.teacherId)
                };
                return mockSchedules[index];
            }
            throw error;
        }
    },


    async deleteSchedule(id) {
        try {
            await api.delete(`/schedules/${id}`);
            return true;
        } catch (error) {
            console.warn('Backend API no disponible (eliminando de mock data):', error.message);
            mockSchedules = mockSchedules.filter(s => s.id !== id);
            return true;
        }
    }
};