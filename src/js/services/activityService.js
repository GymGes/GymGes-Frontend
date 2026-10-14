/* src/js/services/activityService.js */
import { api } from '../api/axiosClient.js';

// Datos de respaldo en memoria si el backend aún no está levantado
let mockActivities = [
    {
        id: 1,
        name: 'Crossfit Studio',
        duration: 50,
        capacity: 16,
        description: 'Entrenamiento funcional de alta cadencia combinando halterofilia y gimnásticos.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCbKlWkvNFcFZV6Uq59uuc6qEAlkyNXUsSfkZFTCAQfMLwYYjeSKbdGb9J7uEdvHKsPkcKVTt0s7_PNSRylpoS22kKZgQl1x_IYKYfyi-pZrO0R-CoED3AVCNyJTiuk4wHtrB4qu9ybiG2NXjCKMpwTNRMFN0waoAYTXlwnuwTbuzs9hj0fTc538UOhH_lTF45zBu4mbNUeS4teVRlTf_uedIzOowaLT3WqO42BFUoZAH8pMw2js_osw'
    },
    {
        id: 2,
        name: 'Hyrox Conditioning',
        duration: 50,
        capacity: 20,
        description: 'Preparación atlética integral que fusiona carrera y trineo de empuje.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmnvv3hDgfaufGsKgGb1gkc9DhRk0Ojt4uh56G55qsJ_9kR1JIQ4tSaSKUNRl4vbekBmjAKGhwRv2KpxCm5LUzInEqxDuY1VO2xbSvEHLg0ur-qOWi3W06Uc8MpGipWE1BmqC6EwHKBGTWjApPcntbQk86aXTRyU1Wy5I37WgyKa-ZnoYks-LTgBkK980VapacREkhMR2-Y-YhgkNAqaR6ZyHBiFoTEJ6F_FAOS2REXF6Y8ccUF7R6Sg'
    },
    {
        id: 3,
        name: 'HIIT Circuit',
        duration: 50,
        capacity: 18,
        description: 'Circuitos dinámicos por intervalos de alta intensidad metabólica.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyUGoypimWzJIwc6qnHC5lwHfaWZwGTE1elGN7VpqtjDSQjM8dupED9_jMN2RnIWUFEEJmgnxjDK1j_RT7nHr2y_VroohgZFzGHbKIuJ_ThlcWEEYMdOnC5QfLaXKpX6ytHQvUapyUqq2U6u76CjUi_82kMznwNK4HE4ripXsuUgYYlLeEEF0zHS0zJbclriQ93KXWWJNhAQwID7IDgU4GFWbhP4UQtvPnVc9ZATAdxbhyj3ALvJVbrg'
    },
    {
        id: 4,
        name: 'Vinyasa Yoga',
        duration: 50,
        capacity: 14,
        description: 'Fluidez postural consciente y control respiratorio guiado.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIcYNQeYAUYurrzMAJB9Y_DfOUAyaAQfWYAI1Ec1A3AjmGG8-pP4NKcukujD5NoaIh_zH23IsEL-n2aT2VOlwkKvuA0TKGtdoEbo8ckyg_vqZsFKVGDyjlhKoDCClJb0DVS_9QslmcgeWg_aXsqZErbGVgJGqD3Hz1ROq957fY9LwtW0y1zsFehabsIJvm96NNJZMuVZ_MZ8Kz-m1RxVi62N6pzMj07uoV8yK4yufWeC4_9QzW95pjgw'
    },
    {
        id: 5,
        name: 'Pilates Reformer',
        duration: 50,
        capacity: 12,
        description: 'Precisión biomecánica sobre camas de muelles.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1bqNH9tL8RqMEgH0Y0nofwXOuMu3j-GbUP7A5KOG1-LxoTDI-Te_gESBbGleROmyES9AgAHLGrr-pQuUeMmhntqlb_Oo8YdcTFhpGUbsqCTktd4LfOc3lF23hv7Ii4ONML8yg2uzlHxTSCcVP1J2whvA3MSKGfFz5uGtJzCWA3PYUrSMZ2aY1qGVTjQCv7jbPbpzwvOMNisnaoT6MD3uwjBvWOhb4ECCbEq8M-sTnLgyAURrztLdiLQ'
    }
];

export const activityService = {
    /**
     * Obtiene la lista completa de actividades
     */
    async getActivities() {
        try {
            return await api.get('/activities');
        } catch (error) {
            console.warn('Backend API no disponible (usando mock data):', error.message);
            return [...mockActivities];
        }
    },

    /**
     * Crea una nueva actividad
     */
    async createActivity(activityData) {
        try {
            return await api.post('/activities', activityData);
        } catch (error) {
            console.warn('Backend API no disponible (creando en mock data):', error.message);
            const newActivity = {
                id: Date.now(),
                ...activityData,
                imageUrl: activityData.imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCbKlWkvNFcFZV6Uq59uuc6qEAlkyNXUsSfkZFTCAQfMLwYYjeSKbdGb9J7uEdvHKsPkcKVTt0s7_PNSRylpoS22kKZgQl1x_IYKYfyi-pZrO0R-CoED3AVCNyJTiuk4wHtrB4qu9ybiG2NXjCKMpwTNRMFN0waoAYTXlwnuwTbuzs9hj0fTc538UOhH_lTF45zBu4mbNUeS4teVRlTf_uedIzOowaLT3WqO42BFUoZAH8pMw2js_osw'
            };
            mockActivities.unshift(newActivity);
            return newActivity;
        }
    },

    /**
     * Actualiza los datos de una actividad existente
     */
    async updateActivity(id, activityData) {
        try {
            return await api.put(`/activities/${id}`, activityData);
        } catch (error) {
            console.warn('Backend API no disponible (actualizando en mock data):', error.message);
            const index = mockActivities.findIndex(a => a.id === id);
            if (index !== -1) {
                mockActivities[index] = { ...mockActivities[index], ...activityData };
                return mockActivities[index];
            }
            throw error;
        }
    },

    /**
     * Elimina una actividad por su ID
     */
    async deleteActivity(id) {
        try {
            await api.delete(`/activities/${id}`);
            return true;
        } catch (error) {
            console.warn('Backend API no disponible (eliminando de mock data):', error.message);
            mockActivities = mockActivities.filter(a => a.id !== id);
            return true;
        }
    }
};