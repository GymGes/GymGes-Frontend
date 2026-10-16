/* src/js/user.js - Mi Espacio del socio, conectado al backend */
import { api } from './api/axiosClient.js';
import { bookingService } from './services/bookingService.js';

// Estado de la sesión del socio
let memberCode = sessionStorage.getItem('gymges_member_code') || null;
let member = null;
let weeklyClasses = [];
let activitiesById = {};
let teachersById = {};
let myBookings = [];

// Elementos del DOM
const loginSection = document.getElementById('login-section');
const loginForm = document.getElementById('login-form');
const loginInput = document.getElementById('input-member-code');
const loginError = document.getElementById('login-error');
const memberArea = document.getElementById('member-area');
const memberName = document.getElementById('member-name');
const memberDetail = document.getElementById('member-detail');
const memberCredits = document.getElementById('member-credits');
const classesBody = document.getElementById('classes-table-body');
const bookingsBody = document.getElementById('bookings-table-body');

document.getElementById('btn-logout')?.addEventListener('click', () => {
    sessionStorage.removeItem('gymges_member_code');
    memberCode = null;
    member = null;
    myBookings = [];
    memberArea.classList.add('hidden');
    loginSection.classList.remove('hidden');
    loginInput.value = '';
});

const formatDateTime = (iso) => new Date(iso).toLocaleString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
});

const showLoginError = (message) => {
    loginError.textContent = message;
    loginError.classList.remove('hidden');
};

// 1. Identificación: el socio entra solo con su código.
// Se busca en GET /members/ (listado) para no depender de rutas individuales.
async function login(code) {
    const list = await api.get('/members/');
    const found = (Array.isArray(list) ? list : []).find(
        (m) => String(m.code || '').toUpperCase() === code
    );
    if (!found) {
        throw { type: 'not_found', message: `No existe ningún socio con el código ${code}.` };
    }
    return found;
}

// 2. Carga de la programación semanal con nombres de actividad y profesor.
async function loadCatalog() {
    const [classes, activities, teachers] = await Promise.all([
        api.get('/weekly-classes/'),
        api.get('/activity-types/'),
        api.get('/teachers/')
    ]);
    weeklyClasses = Array.isArray(classes) ? classes : [];
    activitiesById = Object.fromEntries((activities || []).map((a) => [a.id, a]));
    teachersById = Object.fromEntries((teachers || []).map((t) => [t.id, t.name]));
}

const classLabel = (wc) => activitiesById[wc.activity_type_id]?.name || 'Clase';

// 3. Render de datos personales.
function renderMember() {
    memberName.textContent = `${member.first_name} ${member.last_name}`;
    memberDetail.textContent = `Código ${member.code} · ${member.city} · ${member.address}`;
    memberCredits.textContent = `Saldo disponible: ${member.remaining_credits} crédito(s). Cada reserva descuenta 1.`;
}

// 4. Render de clases disponibles con botón Reservar.
function renderClasses() {
    if (weeklyClasses.length === 0) {
        classesBody.innerHTML = `
            <tr><td colspan="5" class="text-center table-state-row">
                No hay clases programadas esta semana.
            </td></tr>`;
        return;
    }
    const bookedIds = new Set(myBookings.map((b) => b.clase_id));
    classesBody.innerHTML = weeklyClasses.map((wc) => {
        const already = bookedIds.has(wc.id);
        const full = wc.available_spots <= 0;
        const disabled = already || full;
        const reason = already ? 'Reservada' : (full ? 'Completa' : 'Reservar');
        return `
        <tr>
            <td style="font-weight: 600;">${classLabel(wc)}</td>
            <td style="white-space: nowrap;">${formatDateTime(wc.activity_date)}</td>
            <td>${teachersById[wc.teacher_id] || 'Sin asignar'}</td>
            <td>${wc.available_spots}</td>
            <td class="text-right" style="white-space: nowrap;">
                <button class="btn btn-primary" type="button" data-book-class="${wc.id}"
                    ${disabled ? 'disabled' : ''}>${reason}</button>
            </td>
        </tr>`;
    }).join('');

    classesBody.querySelectorAll('[data-book-class]').forEach((btn) => {
        btn.addEventListener('click', () => bookClass(Number(btn.dataset.bookClass)));
    });
}

// 5. Reservar: delega en bookingService (muestra el motivo del backend si falla).
async function bookClass(classId) {
    if (member.remaining_credits <= 0) {
        alert('No tienes créditos suficientes para reservar.');
        return;
    }
    try {
        const created = await bookingService.createBooking({
            socio_codigo: memberCode,
            clase_id: classId
        });
        myBookings.unshift(created);
        member.remaining_credits -= 1;
        const wc = weeklyClasses.find((c) => c.id === classId);
        if (wc) wc.available_spots -= 1;
        renderMember();
        renderClasses();
        renderBookings();
    } catch (error) {
        alert(error?.message || 'No se pudo registrar la reserva.');
    }
}

// 6. Render de mis reservas con botón Cancelar.
function renderBookings() {
    if (myBookings.length === 0) {
        bookingsBody.innerHTML = `
            <tr><td colspan="4" class="text-center table-state-row">
                Aún no tienes reservas. ¡Elige una clase de la lista superior!
            </td></tr>`;
        return;
    }
    bookingsBody.innerHTML = myBookings.map((b) => {
        const wc = weeklyClasses.find((c) => c.id === b.clase_id);
        const when = wc ? formatDateTime(wc.activity_date) : '-';
        const teacher = wc ? (teachersById[wc.teacher_id] || 'Sin asignar') : '-';
        return `
        <tr>
            <td style="font-weight: 600;">${wc ? classLabel(wc) : 'Clase no encontrada'}</td>
            <td style="white-space: nowrap;">${when}</td>
            <td>${teacher}</td>
            <td class="text-right" style="white-space: nowrap;">
                <button class="btn btn-secondary" type="button"
                    data-cancel-booking="${b.id}">Cancelar</button>
            </td>
        </tr>`;
    }).join('');

    bookingsBody.querySelectorAll('[data-cancel-booking]').forEach((btn) => {
        btn.addEventListener('click', () => cancelBooking(Number(btn.dataset.cancelBooking)));
    });
}

// 7. Cancelar: el backend impide hacerlo con menos de 2h (muestra el aviso).
async function cancelBooking(bookingId) {
    const target = myBookings.find((b) => b.id === bookingId);
    try {
        await bookingService.deleteBooking(bookingId);
    } catch (error) {
        alert(error?.message || 'No se pudo cancelar la reserva.');
        return;
    }
    myBookings = myBookings.filter((b) => b.id !== bookingId);
    member.remaining_credits += 1;
    const wc = target && weeklyClasses.find((c) => c.id === target.clase_id);
    if (wc) wc.available_spots += 1;
    renderMember();
    renderClasses();
    renderBookings();
}

// Arranque: login y carga del espacio personal.
async function enterMemberArea(code) {
    member = await login(code);
    memberCode = code;
    sessionStorage.setItem('gymges_member_code', code);
    await loadCatalog();
    myBookings = await bookingService.getBookingsByMember(code);
    loginSection.classList.add('hidden');
    memberArea.classList.remove('hidden');
    renderMember();
    renderClasses();
    renderBookings();
}

loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    const code = loginInput.value.trim().toUpperCase();
    if (!code) return;
    try {
        await enterMemberArea(code);
    } catch (error) {
        showLoginError(error?.message || 'No se pudo acceder. Revisa el código e inténtalo de nuevo.');
    }
});

// Si ya había sesión, se restaura directamente.
if (memberCode) {
    enterMemberArea(memberCode).catch((error) => {
        sessionStorage.removeItem('gymges_member_code');
        memberCode = null;
        showLoginError(error?.message || 'La sesión anterior ya no es válida.');
    });
}
