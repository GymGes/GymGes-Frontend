/* src/js/client/calendar.js */
import { scheduleService } from '../services/scheduleService.js';
import { activityService } from '../services/activityService.js';
import { teacherService } from '../services/teacherService.js';
import { bookingService } from '../services/bookingService.js';
import { modalService } from '../services/modalService.js';

// Imagen neutra de respaldo por si algún registro carece de foto
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop';

const DAY_NAMES = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo'
};

// Estado reactivo
let schedules = [];
let activitiesMap = new Map();
let teachersMap = new Map();
let bookings = [];
let selectedDay = 1;
let selectedSchedule = null;

// Referencias al DOM - Selector y Cartelera
const weekBar = document.getElementById('schedule-week-bar');
const scheduleList = document.getElementById('schedule-list');

// Referencias al DOM - Modal de Confirmación
const bookingModal = document.getElementById('booking-modal');
const bookingForm = document.getElementById('client-booking-form');
const modalActivityName = document.getElementById('modal-activity-name');
const modalActivityDetails = document.getElementById('modal-activity-details');
const modalClassId = document.getElementById('modal-class-id');
const modalSocioCode = document.getElementById('modal-socio-code');
const btnCloseModal = document.getElementById('btn-close-booking-modal');
const btnCancelModal = document.getElementById('btn-cancel-booking-modal');
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
// Referencias al DOM - Modal de Aviso / Sin Créditos
const noticeModal = document.getElementById('notice-modal');
const noticeModalTitle = document.getElementById('notice-modal-title');
const noticeModalActivity = document.getElementById('notice-modal-activity');
const noticeModalDetails = document.getElementById('notice-modal-details');
const noticeModalMessage = document.getElementById('notice-modal-message');
const btnCloseNoticeModal = document.getElementById('btn-close-notice-modal');
const btnNoticeModalBack = document.getElementById('btn-notice-modal-back');

// 1. Selector de fechas de la semana (Lunes a Domingo)
function getWeekDays() {
    const now = new Date();
    const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentDayOfWeek - 1));

    const days = [];
    const shortNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        days.push({
            dayOfWeek: i + 1,
            shortName: shortNames[i],
            dateNumber: d.getDate(),
            fullDate: d
        });
    }
    return { days, todayDayOfWeek: currentDayOfWeek };
}

function renderWeekBar() {
    if (!weekBar) return;

    const { days, todayDayOfWeek } = getWeekDays();
    selectedDay = todayDayOfWeek;

    weekBar.innerHTML = days.map(d => `
    <button
        class="week-day-btn ${d.dayOfWeek === selectedDay ? 'active' : ''}"
        type="button"
        data-day="${d.dayOfWeek}"
        aria-pressed="${d.dayOfWeek === selectedDay}">
        <span class="day-short">${d.shortName}</span>
        <span class="day-num">${d.dateNumber}</span>
    </button>
    `).join('');

    weekBar.querySelectorAll('.week-day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            weekBar.querySelectorAll('.week-day-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            selectedDay = Number(btn.getAttribute('data-day'));
            renderScheduleForDay(selectedDay);
        });
    });
}

// 2. Normalizadores defensivos de sesión
function getScheduleDay(s) {
    if (s.dayOfWeek !== undefined && s.dayOfWeek !== null) return Number(s.dayOfWeek);
    if (s.day_of_week !== undefined && s.day_of_week !== null) return Number(s.day_of_week);

    const rawDate = s.activity_date || s.activityDate || s.date;
    if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
            return d.getDay() === 0 ? 7 : d.getDay();
        }
    }
    return null;
}

function getScheduleTime(s) {
    if (s.startTime) return s.startTime;
    if (s.start_time) return s.start_time;
    if (s.time) return s.time;

    const rawDate = s.activity_date || s.activityDate || s.date;
    if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        }
    }
    return '00:00';
}

function getScheduleActivityId(s) {
    return Number(s.activity_type_id || s.activityTypeId || s.activityId || s.activity_id || 0);
}

function getScheduleTeacherId(s) {
    return Number(s.teacher_id || s.teacherId || 0);
}

function getScheduleSpots(s) {
    if (s.available_spots !== undefined && s.available_spots !== null) return Number(s.available_spots);
    if (s.availableSpots !== undefined && s.availableSpots !== null) return Number(s.availableSpots);
    return 0;
}

// 3. Renderizado de sesiones del día
function renderScheduleForDay(day) {
    if (!scheduleList) return;

    const activeDni = (getCookie(COOKIE_NAME) || '').trim().toUpperCase();
    const dayClasses = schedules.filter(s => getScheduleDay(s) === day);

    if (dayClasses.length === 0) {
        scheduleList.innerHTML = `
        <div class="schedule-state">
            <p>No hay sesiones programadas para este día.</p>
            <p style="font-size: 0.8125rem; margin-top: 0.35rem;">Selecciona otro día en el selector superior.</p>
        </div>
        `;
        return;
    }

    // Agrupar por actividad
    const groupedByActivity = {};
    dayClasses.forEach(s => {
        const actId = getScheduleActivityId(s);
        if (!groupedByActivity[actId]) {
            groupedByActivity[actId] = [];
        }
        groupedByActivity[actId].push(s);
    });

    // Ordenar por hora de inicio
    Object.values(groupedByActivity).forEach(list => {
        list.sort((a, b) => getScheduleTime(a).localeCompare(getScheduleTime(b)));
    });

    scheduleList.innerHTML = Object.entries(groupedByActivity).map(([actIdStr, classList]) => {
        const actId = Number(actIdStr);
        const activity = activitiesMap.get(actId) || {
            name: 'Actividad Pulse',
            duration: 50,
            capacity: 16
        };

        // Prioridad: imagen real de Cloudinary/API -> fallback de seguridad
        const activityImg = activity.imageUrl || activity.image_url || DEFAULT_IMAGE;
        const duration = activity.duration || activity.duracion || 50;
        const maxStudents = activity.capacity || activity.max_students || activity.maxStudents || 16;

        const slotsHtml = classList.map(s => {
            const time = getScheduleTime(s);
            const teacher = teachersMap.get(getScheduleTeacherId(s));
            const teacherName = teacher ? (teacher.name || teacher.nombre) : 'Instructor';
            const spots = getScheduleSpots(s);

            const isReserved = bookings.some(b => {
                const bCode = (b.socio_codigo || '').toUpperCase();
                const bClassId = Number(b.clase_id);
                return activeDni && bCode === activeDni && bClassId === s.id;
            });

            if (isReserved) {
                return `
                <button class="slot-btn slot-reserved" type="button" disabled aria-label="${time} - Reservado">
                    <div class="slot-time-group">
                        <span class="slot-time">${time}</span>
                        <span class="material-symbols-outlined slot-icon" aria-hidden="true">check_circle</span>
                    </div>
                    <span class="slot-badge">Reservado</span>
                </button>
                `;
            }

            if (spots <= 0) {
                return `
                <button class="slot-btn slot-full" type="button" disabled aria-label="${time} - Completo">
                    <span class="slot-time">${time}</span>
                    <span class="slot-details">Completo</span>
                </button>
                `;
            }

            return `
            <button
                class="slot-btn slot-available"
                type="button"
                onclick="window.handleOpenBookingModal(${s.id})">
                <span class="slot-time">${time}</span>
                <span class="slot-details">${teacherName} · ${spots} libres</span>
            </button>
            `;
        }).join('');

        return `
        <article class="schedule-activity-card">
            <div class="activity-info-group">
                <img class="activity-thumb" src="${activityImg}" alt="${activity.name}" loading="lazy" />
                <div class="activity-details">
                    <h2 class="activity-title">${activity.name || activity.nombre || 'Actividad'}</h2>
                    <div class="activity-meta">
                        <span class="meta-item">
                            <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
                            <span>${duration} min</span>
                        </span>
                        <span class="meta-separator" aria-hidden="true">•</span>
                        <span class="meta-item">Aforo máx. ${maxStudents}</span>
                    </div>
                </div>
            </div>

            <div class="slot-list" aria-label="Turnos de ${activity.name}">
                ${slotsHtml}
            </div>
        </article>
        `;
    }).join('');
}

// 4. Modales: Reserva y Aviso
window.handleOpenBookingModal = function (scheduleId) {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    selectedSchedule = schedule;
    const actId = getScheduleActivityId(schedule);
    const activity = activitiesMap.get(actId) || { name: 'Actividad' };
    const teacher = teachersMap.get(getScheduleTeacherId(schedule));
    const teacherName = teacher ? (teacher.name || teacher.nombre) : 'Instructor';
    const time = getScheduleTime(schedule);
    const dayName = DAY_NAMES[getScheduleDay(schedule)] || 'Día';

    modalClassId.value = schedule.id;
    modalActivityName.textContent = activity.name || activity.nombre || 'Actividad';
    modalActivityDetails.textContent = `${dayName} a las ${time} · Impartido por ${teacherName}`;

    const savedDni = (getCookie(COOKIE_NAME) || '').trim().toUpperCase();

if (!savedDni) {
    window.location.href = '../index.html';
    return;
}

modalSocioCode.value = savedDni;
modalSocioCode.readOnly = true;

// Mostrar el modal de reserva
bookingModal.classList.remove('hidden');
};

function closeBookingModal() {
    bookingModal.classList.add('hidden');
    selectedSchedule = null;
}

function openNoticeModal({ title, message, activityName, activityDetails }) {
    if (noticeModalTitle && title) noticeModalTitle.textContent = title;
    if (noticeModalActivity) noticeModalActivity.textContent = activityName || 'Sesión seleccionada';
    if (noticeModalDetails) noticeModalDetails.textContent = activityDetails || '';
    if (noticeModalMessage && message) noticeModalMessage.textContent = message;

    if (noticeModal) noticeModal.classList.remove('hidden');
}

function closeNoticeModal() {
    if (noticeModal) noticeModal.classList.add('hidden');
}

// Listeners de cierre
btnCloseModal?.addEventListener('click', closeBookingModal);
btnCancelModal?.addEventListener('click', closeBookingModal);
btnCloseNoticeModal?.addEventListener('click', closeNoticeModal);
btnNoticeModalBack?.addEventListener('click', closeNoticeModal);

// Procesar Reserva contra bookingService
bookingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const code = (getCookie(COOKIE_NAME) || '').trim().toUpperCase();
    const classId = Number(modalClassId.value);
    const currentActivityName = modalActivityName?.textContent || 'Clase Pulse';
    const currentActivityDetails = modalActivityDetails?.textContent || '';

    if (!code) {
        window.location.href = '../index.html';
        return;
    }

    if (!classId) return;

    if (!code || !classId) return;

    const dniRegex = /^[0-9XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/;
    if (!dniRegex.test(code)) {
        openNoticeModal({
            title: 'Documento no válido',
            message: 'Por favor, introduce un formato de DNI/NIE reglamentario (ej. 12345678Z).',
            activityName: currentActivityName,
            activityDetails: currentActivityDetails
        });
        return;
    }

    try {
        // Contrato estricto según createBooking(bookingData) de bookingService.js
        const newBooking = await bookingService.createBooking({
            socio_codigo: code,
            clase_id: classId
        });

        bookings.push(newBooking);

        if (selectedSchedule) {
            if (typeof selectedSchedule.available_spots === 'number') {
                selectedSchedule.available_spots = Math.max(0, selectedSchedule.available_spots - 1);
            } else if (typeof selectedSchedule.availableSpots === 'number') {
                selectedSchedule.availableSpots = Math.max(0, selectedSchedule.availableSpots - 1);
            }
        }

        closeBookingModal();
        renderScheduleForDay(selectedDay);
        modalService.success(`¡Plaza reservada con éxito para el socio ${code}!`)
    } catch (error) {
        console.error('Error al registrar la reserva:', error);

        closeBookingModal();

        const resData = error.response?.data;
        const detail = typeof resData?.detail === 'string' ? resData.detail : (resData?.message || '');

        // Mensaje enfocado directamente en la falta de saldo/créditos
        let title = 'Créditos Insuficientes';
        let message = 'No te quedan créditos disponibles para realizar esta reserva. Puedes consultar tu saldo actual desde tu espacio de socio.';

        if (detail.toLowerCase().includes('ya') && detail.toLowerCase().includes('reserva')) {
            title = 'Ya tienes plaza';
            message = 'Ya dispones de una reserva confirmada para esta misma sesión.';
        } else if (detail && (detail.toLowerCase().includes('crédit') || detail.toLowerCase().includes('saldo'))) {
            message = detail;
        }

        openNoticeModal({
            title,
            message,
            activityName: currentActivityName,
            activityDetails: currentActivityDetails
        });
    }
});

// Cerrar con Escape cualquiera de los dos modales
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (bookingModal && !bookingModal.classList.contains('hidden')) {
            closeBookingModal();
        }
        if (noticeModal && !noticeModal.classList.contains('hidden')) {
            closeNoticeModal();
        }
    }
});

// 5. Carga inicial
async function initCalendar() {
    renderWeekBar();

    try {
        const [loadedSchedules, loadedActivities, loadedTeachers, loadedBookings] = await Promise.all([
            scheduleService.getSchedules(),
            activityService.getActivities(),
            teacherService.getTeachers(),
            bookingService.getBookings()
        ]);

        schedules = loadedSchedules;
        activitiesMap = new Map(loadedActivities.map(a => [a.id, a]));
        teachersMap = new Map(loadedTeachers.map(t => [t.id, t]));
        bookings = loadedBookings;

        renderScheduleForDay(selectedDay);
    } catch (err) {
        console.error('Error al inicializar la cartelera:', err);
        scheduleList.innerHTML = `
        <div class="schedule-state">
            <p style="color: var(--color-error); font-weight: 600;">No se pudo conectar con el servidor.</p>
            <p style="font-size: 0.8125rem; margin-top: 0.35rem;">Asegúrate de que la API de FastAPI esté levantada en el puerto 8000.</p>
        </div>
        `;
    }
}

const savedDni = (getCookie(COOKIE_NAME) || '').trim().toUpperCase();

if (savedDni) {
    initCalendar();
} else {
    window.location.href = '../index.html';
}