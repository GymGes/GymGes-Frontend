import { bookingService } from '../services/bookingService.js';
import { memberService } from '../services/memberService.js';
import { scheduleService } from '../services/scheduleService.js';
import { activityService } from '../services/activityService.js';
import { teacherService } from '../services/teacherService.js';
import { paginate, renderPagination } from '../utils/paginate.js';
import { modalService } from '../services/modalService.js';


// Días de la semana para los nombres de turnos
const DAY_NAMES = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo'
};

function formatDateShort(iso) {
    if (!iso) return '';
    const [y, m, d] = String(iso).slice(0, 10).split('-');
    return d && m ? `${d}/${m}` : '';
}

function getScheduleSortKey(schedule) {
    if (!schedule) return '';
    const date = schedule.activityDate || schedule.activity_date || schedule.date || '';
    return `${date}T${schedule.startTime || schedule.start_time || ''}`;
}

// Diccionarios en memoria cargados dinámicamente desde el backend
let ACTIVITIES_MAP = {};
let TEACHERS_MAP = {};

// Estado local
let bookings = [];
let members = [];
let schedules = [];
let bookingToDeleteId = null;
let currentPage = 1;

// Elementos del DOM
const tableBody = document.getElementById('bookings-table-body');
const pagination = document.getElementById('bookings-pagination');
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

function normalizeSchedule(s) {
    let dayOfWeek = s.dayOfWeek ?? s.day_of_week;
    let startTime = s.startTime ?? s.start_time;
    const actId = Number(s.activityId ?? s.activity_type_id ?? s.activity_id ?? 0);
    const teachId = Number(s.teacherId ?? s.teacher_id ?? 0);

    const rawDate = s.activity_date || s.activityDate || s.date;
    if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
            if (dayOfWeek === undefined) {
                dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
            }
            if (!startTime) {
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                startTime = `${hours}:${minutes}`;
            }
        }
    }

    return {
        ...s,
        id: s.id,
        activityId: actId,
        teacherId: teachId,
        dayOfWeek: dayOfWeek || 1,
        startTime: startTime || '00:00'
    };
}

function normalizeMember(m) {
    return {
        ...m,
        codigo: m.codigo || m.code || '',
        nombre: m.nombre || m.first_name || '',
        apellido: m.apellido || m.last_name || '',
        creditos_restantes: m.creditos_restantes ?? m.remaining_credits ?? 0
    };
}

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
        const sortedSchedules = [...schedules].sort((a, b) => {
            const aDate = a.activityDate || a.activity_date || a.date || '';
            const bDate = b.activityDate || b.activity_date || b.date || '';
            return `${aDate}T${a.startTime || a.start_time || ''}`
                .localeCompare(`${bDate}T${b.startTime || b.start_time || ''}`);
        });

        selectClass.innerHTML = `
        <option value="">Selecciona una clase semanal...</option>
        ${sortedSchedules.map(s => {
            const activity = ACTIVITIES_MAP[s.activityId]?.name || 'Actividad';
            const day = DAY_NAMES[s.dayOfWeek] || `Día ${s.dayOfWeek}`;
            const teacher = TEACHERS_MAP[s.teacherId] || 'Sin profesor';
            const dateShort = formatDateShort(s.activityDate || s.activity_date || s.date);
            return `
            <option value="${s.id}">
            ${activity} ·${dateShort ? ` ${dateShort}` : ''} ${day} a las ${s.startTime} (${teacher})
            </option>
        `;
        }).join('')}
    `;
    }
}

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

    try {
        const [loadedBookings, loadedMembers, loadedSchedules, loadedActivities, loadedTeachers] = await Promise.all([
            bookingService.getBookings(),
            memberService.getMembers(),
            scheduleService.getSchedules(),
            activityService.getActivities(),
            teacherService.getTeachers()
        ]);

        // Construir mapas en memoria
        ACTIVITIES_MAP = (loadedActivities || []).reduce((acc, a) => {
            acc[a.id] = a;
            return acc;
        }, {});

        TEACHERS_MAP = (loadedTeachers || []).reduce((acc, t) => {
            acc[t.id] = t.name || t.nombre;
            return acc;
        }, {});

        bookings = loadedBookings || [];
        members = (loadedMembers || []).map(normalizeMember);
        schedules = (loadedSchedules || []).map(normalizeSchedule);

        populateSelects();
        currentPage = 1;
        renderBookings();
    } catch (error) {
        console.error('Error cargando los datos de reservas:', error);
        modalService.error("Error al conectar con la API del servidor.")
    }
}

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
        renderPagination(pagination, paginate([], currentPage), setPage);
        return;
    }

    const sortedBookings = [...bookings].sort((a, b) => {
        const scheduleA = schedules.find(s => s.id === a.clase_id);
        const scheduleB = schedules.find(s => s.id === b.clase_id);
        return getScheduleSortKey(scheduleA).localeCompare(getScheduleSortKey(scheduleB));
    });

    const view = paginate(sortedBookings, currentPage);
    currentPage = view.page;

    tableBody.innerHTML = view.items.map(b => {
        const member = members.find(m => m.codigo === b.socio_codigo);
        const memberName = member ? `${member.nombre} ${member.apellido}` : b.socio_codigo;

        const schedule = schedules.find(s => s.id === b.clase_id);
        const activity = schedule ? ACTIVITIES_MAP[schedule.activityId] : null;
        const activityName = activity ? (activity.name || activity.nombre) : 'Clase no encontrada';
        const dayName = schedule ? (DAY_NAMES[schedule.dayOfWeek] || `Día ${schedule.dayOfWeek}`) : '-';
        const time = schedule ? schedule.startTime : '-';
        const dateShort = formatDateShort(schedule?.activityDate || schedule?.activity_date || schedule?.date);
        const when = schedule ? `${dateShort ? `${dateShort} ` : ''}${dayName} · ${time}` : '-';
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
            <span class="badge-day">${when}</span>
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

    renderPagination(pagination, view, setPage);
}

function setPage(page) {
    currentPage = page;
    renderBookings();
}

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

// Event Listeners
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
            modalService.error(error?.message || 'No se pudo cancelar la reserva.');
            return;
        }
        if (target) {
            const member = members.find(m => m.codigo === target.socio_codigo);
            if (member) member.creditos_restantes += 1;
        }
        bookings = bookings.filter(b => b.id !== bookingToDeleteId);
        currentPage = 1;
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
        modalService.error('No se puede realizar la reserva: el socio seleccionado no dispone de créditos suficientes.');
        return;
    }

    const duplicate = bookings.some(b => b.socio_codigo === socioCodigo && b.clase_id === claseId);
    if (duplicate) {
        modalService.error('Este socio ya cuenta con una reserva activa para esta misma sesión.');
        return;
    }

    let newBooking;
    try {
        newBooking = await bookingService.createBooking({
            socio_codigo: socioCodigo,
            clase_id: claseId
        });
    } catch (error) {
        modalService.error(error?.message || 'No se pudo registrar la reserva.');
        return;
    }

    if (member) member.creditos_restantes -= 1;

    bookings.unshift(newBooking);
    currentPage = 1;
    renderBookings();
    closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeDeleteModal();
    }
});


loadData();