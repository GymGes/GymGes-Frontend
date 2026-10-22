/* src/js/client/user.js */
import { bookingService } from '../services/bookingService.js';
import { memberService } from '../services/memberService.js';
import { scheduleService } from '../services/scheduleService.js';
import { activityService } from '../services/activityService.js';
import { teacherService } from '../services/teacherService.js';
import { modalService } from '../services/modalService.js';
// Estado de la vista
let currentMember = null;
let schedules = [];
let activitiesMap = new Map();
let teachersMap = new Map();
let memberBookings = [];
let bookingToCancelId = null;
let activeBookingsTab = 'upcoming';

// Elementos del DOM - Contenedores
const memberDashboard = document.getElementById('member-dashboard');
const btnLogout = document.getElementById('btn-logout');

// Elementos del DOM - Ficha del Socio
const memberName = document.getElementById('member-name');
const memberCode = document.getElementById('member-code');
const memberAge = document.getElementById('member-age');
const memberCity = document.getElementById('member-city');
const memberAddress = document.getElementById('member-address');
const memberCredits = document.getElementById('member-credits');

// Elementos del DOM - Reservas
const bookingsHeading = document.getElementById('bookings-heading');
const bookingsCount = document.getElementById('bookings-count');
const bookingsSubtitle = document.getElementById('bookings-subtitle');
const bookingsList = document.getElementById('bookings-list');
const tabUpcoming = document.getElementById('bookings-tab-upcoming');
const tabHistory = document.getElementById('bookings-tab-history');

// Elementos del DOM - Modal de Cancelación
const cancelModal = document.getElementById('cancel-modal');
const cancelModalActivity = document.getElementById('cancel-modal-activity');
const cancelModalTime = document.getElementById('cancel-modal-time');
const btnCloseCancelModal = document.getElementById('btn-close-cancel-modal');
const btnCancelModalBack = document.getElementById('btn-cancel-modal-back');
const btnConfirmCancelBooking = document.getElementById('btn-confirm-cancel-booking');

const DAY_NAMES = { 1: 'LUN', 2: 'MAR', 3: 'MIÉ', 4: 'JUE', 5: 'VIE', 6: 'SÁB', 7: 'DOM' };
const COOKIE_NAME = 'pulse_member_dni';

function getCookie(name) {
    const prefix = `${name}=`;
    const cookie = document.cookie
        .split('; ')
        .find(item => item.startsWith(prefix));

    return cookie
        ? decodeURIComponent(cookie.slice(prefix.length))
        : null;
}

function deleteMemberCookie() {
    document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}


// 2. Normalización de fechas y horarios
function getScheduleParts(schedule) {
    if (!schedule) return { label: '-', time: '--:--', long: '-', date: '' };

    const rawDate = schedule.activityDate || schedule.activity_date;
    let time = schedule.startTime || schedule.start_time || '00:00';
    let label = 'SESIÓN';
    let long = 'Fecha no disponible';
    let date = '';

    if (rawDate) {
        const d = new Date(`${String(rawDate).slice(0, 10)}T00:00:00`);
        if (!isNaN(d.getTime())) {
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);

            const isSameDay = (d1, d2) =>
                d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate();

            if (isSameDay(d, today)) {
                label = 'HOY';
                date = '';
            } else if (isSameDay(d, tomorrow)) {
                label = 'MAÑANA';
                date = '';
            } else {
                const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
                label = DAY_NAMES[dayOfWeek] || 'DÍA';
                date = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            }

            long = d.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            }) + ` a las ${time}`;
        }
    } else if (schedule.dayOfWeek || schedule.day_of_week) {
        const dow = Number(schedule.dayOfWeek || schedule.day_of_week);
        label = DAY_NAMES[dow] || 'DÍA';
        long = `${label} a las ${time}`;
    }

    return { label, time, long, date };
}

// 3. Renderizado de la ficha del socio
function renderProfile(member) {
    if (!member) return;

    const firstName = member.nombre || member.first_name || '';
    const lastName = member.apellido || member.last_name || '';
    if (memberName) {
        memberName.textContent = `${firstName} ${lastName}`.trim() || 'Socio PulseGym';
    }

    if (memberCode) memberCode.textContent = member.codigo || member.code || '-';

    const age = member.edad ?? member.age;
    if (memberAge) {
        memberAge.textContent = (typeof age === 'number' && age > 0) ? `${age} años` : '-';
    }

    if (memberCity) memberCity.textContent = member.ciudad || member.city || '-';
    if (memberAddress) memberAddress.textContent = member.direccion || member.address || '-';

    const credits = member.creditos_restantes ?? member.remaining_credits ?? 0;
    if (memberCredits) {
        memberCredits.textContent = `${credits} crédito(s)`;
    }
}

// 4. Renderizado de reservas (activas e historial del mes)
function getSessionStart(schedule) {
    if (!schedule) return null;

    const rawDate = schedule.activityDate || schedule.activity_date;
    if (!rawDate) return null;

    const time = schedule.startTime || schedule.start_time || '00:00';
    const sessionStart = new Date(`${String(rawDate).slice(0, 10)}T${time}:00`);

    return isNaN(sessionStart.getTime()) ? null : sessionStart;
}

function getBookingsForActiveTab() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const upcoming = [];
    const history = [];

    memberBookings.forEach(booking => {
        const schedule = schedules.find(s => s.id === booking.clase_id);
        const sessionStart = getSessionStart(schedule);

        if (!sessionStart || sessionStart >= now) {
            upcoming.push({ booking, schedule, sessionStart });
        } else if (sessionStart >= monthStart) {
            history.push({ booking, schedule, sessionStart });
        }
    });

    const sortByDate = (a, b) => {
        const timeA = a.sessionStart ? a.sessionStart.getTime() : 0;
        const timeB = b.sessionStart ? b.sessionStart.getTime() : 0;
        return timeA - timeB;
    };

    if (activeBookingsTab === 'history') {
        history.sort((a, b) => sortByDate(b, a));
        return { items: history, isHistory: true };
    }

    upcoming.sort(sortByDate);
    return { items: upcoming, isHistory: false };
}

function renderBookings() {
    const { items, isHistory } = getBookingsForActiveTab();

    if (bookingsHeading) {
        bookingsHeading.textContent = isHistory ? 'Historial de Reservas' : 'Mis Reservas';
    }

    if (bookingsSubtitle) {
        bookingsSubtitle.textContent = isHistory
            ? 'Consulta las clases a las que has asistido.'
            : 'Consulta tus próximas sesiones y gestiona tus reservas.';
    }

    if (bookingsCount) {
        bookingsCount.textContent = isHistory
            ? `${items.length} Este mes`
            : `${items.length} Activas`;
    }

    if (!bookingsList) return;

    if (items.length === 0) {
        bookingsList.innerHTML = isHistory
            ? `
            <div class="empty-bookings-box">
                <p>No tienes clases en tu historial de este mes.</p>
                <p style="font-size: 0.8125rem; margin-top: 0.35rem; color: #72787e;">
                    Aquí aparecerán las reservas de las clases que ya hayan finalizado.
                </p>
            </div>
        `
            : `
            <div class="empty-bookings-box">
                <p>No tienes reservas activas en este momento.</p>
                <p style="font-size: 0.8125rem; margin-top: 0.35rem; color: #72787e;">
                    Usa «Reservar Nueva Clase» para consultar el horario semanal.
                </p>
            </div>
        `;
        return;
    }

    bookingsList.innerHTML = items.map(({ booking: b, schedule }, index) => {
        const actId = Number(schedule?.activity_type_id || schedule?.activityId || 0);
        const teachId = Number(schedule?.teacher_id || schedule?.teacherId || 0);

        const activity = activitiesMap.get(actId) || { name: 'Clase Pulse', duration: 50 };
        const teacher = teachersMap.get(teachId) || { name: 'Instructor' };
        const { label, time, date } = getScheduleParts(schedule);
        const stripeClass = index % 2 === 0 ? 'stripe-blue' : 'stripe-gold';

        const boxLabel = date ? `${date} ${label}` : label;

        const actionMarkup = isHistory
            ? `
                <span class="booking-status-completed">
                    <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
                    <span>Completada</span>
                </span>
            `
            : `
                <button class="btn-cancel-action" type="button" data-id="${b.id}">
                    <span class="material-symbols-outlined" aria-hidden="true">event_busy</span>
                    <span>Cancelar Reserva</span>
                </button>
            `;

        return `
            <article class="booking-item-card ${isHistory ? 'booking-item-history' : ''}" id="booking-card-${b.id}">
                <div class="card-left-stripe ${stripeClass}"></div>
                <div class="booking-main-info">
                    <div class="booking-time-square">
                        <span class="time-square-label">${boxLabel}</span>
                        <span class="time-square-time">${time}</span>
                    </div>
                    <div class="booking-details-group">
                        <h3 class="booking-activity-title">${activity.name}</h3>
                        <div class="booking-meta-line">
                            <span class="meta-icon-item">
                                <span class="material-symbols-outlined" aria-hidden="true">person</span>
                                <span>${teacher.name}</span>
                            </span>
                            <span class="meta-separator">•</span>
                            <span class="meta-icon-item">
                                <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
                                <span>${activity.duration || 50} min</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div>
                    ${actionMarkup}
                </div>
            </article>
        `;
    }).join('');

    if (!isHistory) {
        bookingsList.querySelectorAll('.btn-cancel-action').forEach(btn => {
            btn.addEventListener('click', () => openCancelModal(Number(btn.dataset.id)));
        });
    }
}

function setActiveBookingsTab(tab) {
    activeBookingsTab = tab === 'history' ? 'history' : 'upcoming';

    [
        [tabUpcoming, 'upcoming'],
        [tabHistory, 'history']
    ].forEach(([button, name]) => {
        if (!button) return;

        const isActive = activeBookingsTab === name;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', String(isActive));
    });

    renderBookings();
}

tabUpcoming?.addEventListener('click', () => setActiveBookingsTab('upcoming'));
tabHistory?.addEventListener('click', () => setActiveBookingsTab('history'));

// 5. Modal de Cancelación
function openCancelModal(bookingId) {
    const booking = memberBookings.find(b => b.id === bookingId);
    if (!booking) return;

    bookingToCancelId = bookingId;
    const schedule = schedules.find(s => s.id === booking.clase_id);
    const actId = Number(schedule?.activity_type_id || schedule?.activityId || 0);
    const teachId = Number(schedule?.teacher_id || schedule?.teacherId || 0);

    const activity = activitiesMap.get(actId) || { name: 'Clase' };
    const teacher = teachersMap.get(teachId) || { name: 'Instructor' };
    const { long } = getScheduleParts(schedule);

    if (cancelModalActivity) cancelModalActivity.textContent = activity.name;
    if (cancelModalTime) cancelModalTime.textContent = `${long} · Impartido por ${teacher.name}`;
    if (cancelModal) cancelModal.classList.remove('hidden');
}

function closeCancelModal() {
    if (cancelModal) cancelModal.classList.add('hidden');
    bookingToCancelId = null;
}

btnCloseCancelModal?.addEventListener('click', closeCancelModal);
btnCancelModalBack?.addEventListener('click', closeCancelModal);

btnConfirmCancelBooking?.addEventListener('click', async () => {
    if (!bookingToCancelId) return;

    try {
        await bookingService.deleteBooking(bookingToCancelId);

        if (currentMember) {
            if (typeof currentMember.creditos_restantes === 'number') {
                currentMember.creditos_restantes += 1;
            } else if (typeof currentMember.remaining_credits === 'number') {
                currentMember.remaining_credits += 1;
            }
            renderProfile(currentMember);
        }

        memberBookings = memberBookings.filter(b => b.id !== bookingToCancelId);
        renderBookings();
        closeCancelModal();
    } catch (err) {
        console.error('Error al cancelar la reserva:', err);

        modalService.error(
            'No se pudo cancelar la reserva.'
        );
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cancelModal && !cancelModal.classList.contains('hidden')) {
        closeCancelModal();
    }
});

// 6. Proceso de autenticación y carga
async function loadMember(code) {
    const normalizedCode = String(code).trim().toUpperCase();

    try {
        const [
            membersList,
            loadedSchedules,
            loadedActivities,
            loadedTeachers
        ] = await Promise.all([
            memberService.getMembers(),
            scheduleService.getSchedules(),
            activityService.getActivities(),
            teacherService.getTeachers()
        ]);

        const member = (membersList || []).find(m => {
            const memberCode = String(m.codigo || m.code || '')
                .trim()
                .toUpperCase();

            return memberCode === normalizedCode;
        });

        if (!member) {
            deleteMemberCookie();
            localStorage.removeItem(COOKIE_NAME);
            window.location.href = '../index.html';
            return;
        }

        currentMember = member;
        schedules = loadedSchedules || [];

        activitiesMap = new Map(
            (loadedActivities || []).map(a => [a.id, a])
        );

        teachersMap = new Map(
            (loadedTeachers || []).map(t => [t.id, t])
        );

        try {
            memberBookings = await bookingService.getBookingsByMember(normalizedCode) || [];
        } catch {
            memberBookings = [];
        }

        renderProfile(currentMember);
        renderBookings();

        memberDashboard?.classList.remove('hidden');
        document.querySelectorAll('.nav-link.hidden').forEach(link => {
            link.classList.remove('hidden');
        });

    } catch (err) {
        console.error('Error al cargar el espacio del socio:', err);

        modalService.error(
            'No se han podido cargar tus datos. Comprueba tu conexión e inténtalo de nuevo.'
        );
    }
}

btnLogout?.addEventListener('click', () => {
    deleteMemberCookie();
    localStorage.removeItem(COOKIE_NAME);

    currentMember = null;
    memberBookings = [];

    window.location.href = '../index.html';
});

// 7. Auto-login si ya existe DNI en la sesión del navegador
const savedDni = (getCookie(COOKIE_NAME) || localStorage.getItem(COOKIE_NAME) || '')
    .trim()
    .toUpperCase();

if (savedDni) {
    loadMember(savedDni);
} else {
    window.location.href = '../index.html';
}