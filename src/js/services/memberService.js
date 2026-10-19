
import { api } from '../api/axiosClient.js';

function mapMemberFromApi(member) {
    return {
        codigo: member.code,
        nombre: member.first_name,
        apellido: member.last_name,
        edad: member.age,
        ciudad: member.city,
        direccion: member.address,
        plan_id: member.plan_id,
        creditos_restantes: member.remaining_credits
    };
}

function mapMemberToCreateApi(memberData) {
    return {
        code: memberData.codigo.trim().toUpperCase(),
        first_name: memberData.nombre.trim(),
        last_name: memberData.apellido.trim(),
        age: Number(memberData.edad),
        city: memberData.ciudad.trim(),
        address: memberData.direccion.trim(),
        plan_id: Number(memberData.plan_id)
    };
}

function mapMemberToUpdateApi(memberData) {
    return {
        first_name: memberData.nombre.trim(),
        last_name: memberData.apellido.trim(),
        age: Number(memberData.edad),
        city: memberData.ciudad.trim(),
        address: memberData.direccion.trim(),
        plan_id: Number(memberData.plan_id)
    };
}

export const memberService = {

    async getMembers() {
        const members = await api.get('/members/');
        return members.map(mapMemberFromApi);
    },

    async getMemberByCode(code) {
        const member = await api.get(
        `/members/${encodeURIComponent(code.trim().toUpperCase())}`
        );

        return mapMemberFromApi(member);
    },

    async createMember(memberData) {
        const member = await api.post(
            '/members/',
            mapMemberToCreateApi(memberData)
        );

        return mapMemberFromApi(member);
    },

    async updateMember(codigo, memberData) {
        const member = await api.put(
            `/members/${encodeURIComponent(codigo)}`,
            mapMemberToUpdateApi(memberData)
        );

        return mapMemberFromApi(member);
    },

    async deleteMember(codigo) {
        await api.delete(
            `/members/${encodeURIComponent(codigo)}`
        );

        return true;
    }
};