/* src/js/services/memberService.js */
import { api } from '../api/axiosClient.js';

// Datos simulados iniciales (Mock data mientras se conecta FastAPI)
let mockMembers = [
    {
        codigo: '48291034X',
        nombre: 'Lucía',
        apellido: 'Méndez Serra',
        edad: 31,
        ciudad: 'Barcelona',
        direccion: 'Carrer de Balmes 142, 2º 1ª',
        plan_id: 2,
        creditos_restantes: 6
    },
    {
        codigo: '71982341K',
        nombre: 'Carlos',
        apellido: 'Delgado Ramos',
        edad: 28,
        ciudad: 'Barcelona',
        direccion: 'Carrer de Provença 88, 3º B',
        plan_id: 3,
        creditos_restantes: 10
    },
    {
        codigo: '39481205M',
        nombre: 'Marta',
        apellido: 'Puig Navarro',
        edad: 35,
        ciudad: 'Hospitalet',
        direccion: 'Av. Carrilet 45, 1º 2ª',
        plan_id: 1,
        creditos_restantes: 2
    },
    {
        codigo: '50192843P',
        nombre: 'Javier',
        apellido: 'Ortiz Lozano',
        edad: 42,
        ciudad: 'Badalona',
        direccion: 'Carrer del Mar 12, Pral.',
        plan_id: 4,
        creditos_restantes: 28
    }
];

export const memberService = {
    /**
     * Obtiene la lista completa de socios
     */
    async getMembers() {
        try {
            return await api.get('/members');
        } catch (error) {
            console.warn('Backend API no disponible (usando mock data de socios):', error.message);
            return [...mockMembers];
        }
    },

    /**
     * Registra un nuevo socio
     */
    async createMember(memberData) {
        try {
            return await api.post('/members', memberData);
        } catch (error) {
            console.warn('Backend API no disponible (creando en mock data):', error.message);
            const newMember = {
                codigo: memberData.codigo.trim().toUpperCase(),
                nombre: memberData.nombre.trim(),
                apellido: memberData.apellido.trim(),
                edad: Number(memberData.edad),
                ciudad: memberData.ciudad.trim(),
                direccion: memberData.direccion.trim(),
                plan_id: Number(memberData.plan_id),
                creditos_restantes: Number(memberData.creditos_restantes)
            };
            mockMembers.unshift(newMember);
            return newMember;
        }
    },

    /**
     * Actualiza los datos de un socio por su código (PK)
     */
    async updateMember(codigo, memberData) {
        try {
            return await api.put(`/members/${codigo}`, memberData);
        } catch (error) {
            console.warn('Backend API no disponible (actualizando en mock data):', error.message);
            const index = mockMembers.findIndex(m => m.codigo === codigo);
            if (index !== -1) {
                mockMembers[index] = {
                    ...mockMembers[index],
                    nombre: memberData.nombre.trim(),
                    apellido: memberData.apellido.trim(),
                    edad: Number(memberData.edad),
                    ciudad: memberData.ciudad.trim(),
                    direccion: memberData.direccion.trim(),
                    plan_id: Number(memberData.plan_id),
                    creditos_restantes: Number(memberData.creditos_restantes)
                };
                return mockMembers[index];
            }
            throw error;
        }
    },

    /**
     * Elimina un socio por su código
     */
    async deleteMember(codigo) {
        try {
            await api.delete(`/members/${codigo}`);
            return true;
        } catch (error) {
            console.warn('Backend API no disponible (eliminando de mock data):', error.message);
            mockMembers = mockMembers.filter(m => m.codigo !== codigo);
            return true;
        }
    }
};