/* src/js/admin/bookings.js */
import { bookingService } from '../services/bookingService.js';
import { memberService } from '../services/memberService.js';
import {
    scheduleService,
    ACTIVITIES_MAP,
    TEACHERS_MAP,
    DAY_NAMES
} from '../services/scheduleService.js';

// Estado local
let bookings = [];
let members = [];
let schedules = [];
let bookingToDeleteId = null;

// Elementos del DOM
const tableBody = document.getElementById('bookings-table-body');
const bookingModal = document.getElementById('booking-modal');
const deleteModal = document.getElementById('delete-booking-modal');
const bookingForm = document.getElementById('booking-form');

const selectMember = document.getElementById('modal-booking-member');
const selectClass = document.getElementById('modal-booking-class');
const memberCreditsInfo = document.getElementById('member-credits-info');

const btnOpenCreate = document.getElementById('btn-open-create-booking');
const btnCloseModal = document.getElementById('btn-close-booking-modal');
const btnCancelModal = document.getElementById('btn-cancel-booking-modal');

const deleteBookingName = document.getElementById('delete-booking-name');
const btnCloseDeleteModal = document.getElementById('btn-close-delete-booking-modal');
const btnCancelDelete = document.getElementById('btn-cancel-delete-booking');
const btnConfirmDelete = document.getElementById('btn-confirm-delete-booking');

// 1. Cargar desplegables del modal (Socios y Clases disponibles)
function populateSelects() {
    if (selectMember) {
        selectMember.innerHTML = `
        <option value="">Selecciona un socio...</option>
        ${members.map(m => `
        <option value="${m.codigo}" data-credits="${m.creditos_restantes}">
            ${m.nombre}${m.apellido} (${m.codigo}) ·${m.creditos_restantes} créditos
        </option>
        `).join('')}
    `;
    }

    if (selectClass) {
        selectClass.innerHTML = `
        <option value="">Selecciona una clase semanal...</option>
        ${schedules.map(s => {
            const activity = ACTIVITIES_MAP[s.activityId]?.name || 'Actividad';
            const day = DAY_NAMES[s.dayOfWeek] || `Día ${s.dayOfWeek}`;
            const teacher = TEACHERS_MAP[s.teacherId] || 'Sin profesor';
            return `
            <option value="${s.id}">
            ${activity} ·${day} a las ${s.startTime} (${teacher})
            </option>
        `;
        }).join('')}
    `;
    }
}

// Advertencia visual de créditos al seleccionar un socio
selectMember?.addEventListener('change', () => {
    const selectedOption = selectMember.options[selectMember.selectedIndex];
    const credits = Number(selectedOption?.getAttribute('data-credits') || 0);

    if (!selectMember.value) {
        memberCreditsInfo.textContent = '';
        return;
    }

    if (credits <= 0) {
        memberCreditsInfo.textContent = '⚠️ Este socio no dispone de créditos restantes para reservar.';
        memberCreditsInfo.style.color = 'var(--color-error, #ba1a1a)';
    } else {
        memberCreditsInfo.textContent = `Saldo disponible: ${credits} crédito(s). Se descontará 1 al confirmar.`;
        memberCreditsInfo.style.color = 'var(--color-secondary)';
    }
});

// 2. Carga inicial de datos
async function loadData() {
    if (tableBody) {
        tableBody.innerHTML = `
        <tr id="table-loading-row">
        <td colspan="6" class="text-center table-state-row">
            Cargando registro de reservas...
        </td>
        </tr>
    `;
    }

    const [loadedBookings, loadedMembers, loadedSchedules] = await Promise.all([
        bookingService.getBookings(),
        memberService.getMembers(),
        scheduleService.getSchedules()
    ]);

    bookings = loadedBookings;
    members = loadedMembers;
    schedules = loadedSchedules;

    populateSelects();
    renderBookings();
}

// 3. Renderizado de la tabla de reservas
function renderBookings() {
    if (!tableBody) return;

    if (bookings.length === 0) {
        tableBody.innerHTML = `
        <tr>
        <td colspan="6" class="text-center table-state-row">
            No hay reservas registradas en el sistema.
        </td>
        </tr>
    `;
        return;
    }

    tableBody.innerHTML = bookings.map(b => {
        const member = members.find(m => m.codigo === b.socio_codigo);
        const memberName = member ? `${member.nombre} ${member.apellido}` : b.socio_codigo;

        const schedule = schedules.find(s => s.id === b.clase_id);
        const activity = schedule ? ACTIVITIES_MAP[schedule.activityId] : null;
        const activityName = activity ? activity.name : 'Clase no encontrada';
        const dayName = schedule ? (DAY_NAMES[schedule.dayOfWeek] || `Día ${schedule.dayOfWeek}`) : '-';
        const time = schedule ? schedule.startTime : '-';
        const teacherName = schedule ? (TEACHERS_MAP[schedule.teacherId] || 'Sin asignar') : '-';

        return `
        <tr id="booking-row-${b.id}">
        <td style="white-space: nowrap;">
            <span class="cell-id">#${b.id}</span>
        </td>
        <td style="white-space: nowrap;">
            <span style="font-weight: 600; color: var(--color-primary); display: block;">${memberName}</span>
            <span class="badge-code" style="margin-top: 2px;">${b.socio_codigo}</span>
        </td>
        <td style="white-space: nowrap;">
            <span style="font-weight: 600; color: var(--color-primary);">${activityName}</span>
        </td>
        <td style="white-space: nowrap;">
            <span class="badge-day">${dayName} · ${time}</span>
        </td>
        <td style="white-space: nowrap;">
            <div class="cell-teacher-indicator">
            <span class="material-symbols-outlined" style="font-size: 16px; color: var(--color-secondary);">person</span>
            <span>${teacherName}</span>
            </div>
        </td>
        <td class="text-right" style="white-space: nowrap;">
            <div class="cell-actions">
            <button class="btn-icon btn-icon-danger" type="button" aria-label="Cancelar reserva" onclick="window.openDeleteBookingModal(${b.id})">
                <span class="material-symbols-outlined" style="font-size: 18px;">event_busy</span>
            </button>
            </div>
        </td>
        </tr>
    `;
    }).join('');
}

// 4. Ciclo de vida de los modales
function openModal() {
    bookingForm.reset();
    memberCreditsInfo.textContent = '';
    populateSelects();
    bookingModal.classList.remove('hidden');
}

function closeModal() {
    bookingModal.classList.add('hidden');
}

window.openDeleteBookingModal = function (id) {
    const target = bookings.find(b => b.id === id);
    if (!target) return;

    bookingToDeleteId = id;
    const member = members.find(m => m.codigo === target.socio_codigo);
    const schedule = schedules.find(s => s.id === target.clase_id);
    const actName = schedule ? (ACTIVITIES_MAP[schedule.activityId]?.name || 'Clase') : 'Clase';
    const memName = member ? `${member.nombre} ${member.apellido}` : target.socio_codigo;

    deleteBookingName.textContent = `${memName} - ${actName}`;
    deleteModal.classList.remove('hidden');
};

function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    bookingToDeleteId = null;
}

// 5. Event Listeners
btnOpenCreate?.addEventListener('click', openModal);
btnCloseModal?.addEventListener('click', closeModal);
btnCancelModal?.addEventListener('click', closeModal);

btnCloseDeleteModal?.addEventListener('click', closeDeleteModal);
btnCancelDelete?.addEventListener('click', closeDeleteModal);

btnConfirmDelete?.addEventListener('click', async () => {
    if (bookingToDeleteId !== null) {
        const target = bookings.find(b => b.id === bookingToDeleteId);
        try {
            await bookingService.deleteBooking(bookingToDeleteId);
        } catch (error) {
            // El backend rechaza con 400 si faltan menos de 2h para la clase
            alert(error?.message || 'No se pudo cancelar la reserva.');
            return;
        }

        // Reembolsar 1 crédito en la sesión local al cancelar
        if (target) {
            const member = members.find(m => m.codigo === target.socio_codigo);
            if (member) member.creditos_restantes += 1;
        }

        bookings = bookings.filter(b => b.id !== bookingToDeleteId);
        renderBookings();
        closeDeleteModal();
    }
});

// Guardar nueva reserva
bookingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const socioCodigo = selectMember.value;
    const claseId = Number(selectClass.value);

    if (!socioCodigo || !claseId) return;

    const member = members.find(m => m.codigo === socioCodigo);
    if (member && member.creditos_restantes <= 0) {
        alert('No se puede realizar la reserva: el socio seleccionado no dispone de créditos suficientes.');
        return;
    }

    // Comprobar si ya tiene una reserva para la misma clase
    const duplicate = bookings.some(b => b.socio_codigo === socioCodigo && b.clase_id === claseId);
    if (duplicate) {
        alert('Este socio ya cuenta con una reserva activa para esta misma sesión.');
        return;
    }

    let newBooking;
    try {
        newBooking = await bookingService.createBooking({
            socio_codigo: socioCodigo,
            clase_id: claseId
        });
    } catch (error) {
        // El backend informa del motivo: duplicada, cupo lleno, solape, sin créditos...
        alert(error?.message || 'No se pudo registrar la reserva.');
        return;
    }

    // Descontar 1 crédito en la sesión local
    if (member) member.creditos_restantes -= 1;

    bookings.unshift(newBooking);
    renderBookings();
    closeModal();
});

// Cerrar con Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeDeleteModal();
    }
});

// Cargar datos
loadData();