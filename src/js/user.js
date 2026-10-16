/* src/js/user.js - Mi Espacio del socio, conectado al backend.
   Trabaja sobre pages/user.html (base Tailwind del equipo) sin alterar su diseño:
   solo rellena perfil y reservas con datos reales y cancela contra la API. */
import { api } from './api/axiosClient.js';
import { bookingService } from './services/bookingService.js';

// Estado de la sesión del socio
let memberCode = sessionStorage.getItem('gymges_member_code') || null;
let member = null;
let weeklyClasses = [];
let activitiesById = {};
let teachersById = {};
let myBookings = [];
let cancelTargetId = null;

// Elementos del DOM (ids añadidos sobre el HTML base)
const dniInput = document.getElementById('dni-input');
const enterLink = document.getElementById('btn-enter-space');
const loginError = document.getElementById('login-error');
const bookingsList = document.getElementById('bookings-list');
const bookingsCount = document.getElementById('bookings-count');

const showLoginError = (message) => {
    if (!loginError) return;
    loginError.textContent = message;
    loginError.classList.remove('hidden');
};

const hideLoginError = () => loginError?.classList.add('hidden');

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

// 2. Catálogo para resolver nombres de actividad/profesor de cada reserva.
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

// 3. Ficha de perfil con los datos reales del backend.
function renderProfile() {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    set('member-name', `${member.first_name} ${member.last_name}`);
    set('member-code', member.code);
    set('member-age', `${member.age} años`);
    set('member-city', member.city);
    set('member-address', member.address);
    set('member-credits', `${member.remaining_credits} crédito(s)`);
}

// 4. Etiqueta del día (HOY / MAÑANA / día de la semana) y hora.
function dayParts(iso) {
    const d = new Date(iso);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const sameDay = (a, b) => a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const label = sameDay(d, today) ? 'HOY'
        : (sameDay(d, tomorrow) ? 'MAÑANA'
            : d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '').toUpperCase());
    const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const long = d.toLocaleString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    });
    return { label, time, long };
}

// 5. Tarjeta de reserva con el mismo markup del HTML base.
function bookingCard(booking, index) {
    const wc = weeklyClasses.find((c) => c.id === booking.clase_id);
    const activity = wc ? activitiesById[wc.activity_type_id]?.name || 'Clase' : 'Clase no encontrada';
    const teacher = wc ? (teachersById[wc.teacher_id] || 'Sin asignar') : '-';
    const duration = wc ? `${activitiesById[wc.activity_type_id]?.duration || ''} min`.trim() : '';
    const parts = wc ? dayParts(wc.activity_date) : { label: '-', time: '--:--', long: '-' };
    const accent = index % 2 === 0 ? 'bg-secondary' : 'bg-tertiary-fixed-dim';
    return `
    <div id="booking-card-${booking.id}"
      class="group bg-surface-container-lowest rounded-xl p-space-lg shadow-sm ring-1 ring-outline-variant/30 transition-all hover:shadow-md relative overflow-hidden">
      <div class="absolute top-0 left-0 bottom-0 w-1.5 ${accent}"></div>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div class="flex items-center gap-space-md">
          <div class="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-surface-container text-primary font-headline-sm text-headline-sm leading-tight flex-shrink-0">
            <span class="text-[11px] font-bold uppercase tracking-wider text-secondary">${parts.label}</span>
            <span class="font-bold text-headline-sm">${parts.time}</span>
          </div>
          <div class="flex flex-col justify-center">
            <h3 class="font-headline-sm text-headline-sm text-primary font-bold tracking-tight">${activity}</h3>
            <div class="flex items-center gap-2.5 mt-1 text-on-surface-variant font-body-sm text-[13px]">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] text-secondary">person</span>
                <span>${teacher}</span>
              </span>
              <span class="text-outline-variant">•</span>
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                <span>${duration}</span>
              </span>
            </div>
          </div>
        </div>
        <div class="flex flex-col items-start md:items-end justify-center pt-space-xs md:pt-0">
          <button data-cancel-id="${booking.id}"
            class="group/btn inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg border border-secondary text-secondary hover:bg-secondary/10 font-label-md text-label-md font-semibold transition-all duration-200 active:scale-95">
            <span class="material-symbols-outlined text-[18px] group-hover/btn:text-error transition-colors">event_busy</span>
            <span class="group-hover/btn:text-error transition-colors">Cancelar Reserva</span>
          </button>
        </div>
      </div>
    </div>`;
}

// 6. Listado de reservas + contador.
function renderBookings() {
    if (bookingsCount) {
        bookingsCount.innerHTML = `${myBookings.length}<br>Activas`;
    }
    if (myBookings.length === 0) {
        bookingsList.innerHTML = `
        <div class="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm ring-1 ring-outline-variant/30">
          <p class="font-body-md text-body-md text-on-surface-variant">
            Aún no tienes reservas activas. Usa «Reservar Nueva Clase» para elegir horario.
          </p>
        </div>`;
        return;
    }
    bookingsList.innerHTML = myBookings.map((b, i) => bookingCard(b, i)).join('');
    bookingsList.querySelectorAll('[data-cancel-id]').forEach((btn) => {
        btn.addEventListener('click', () => openCancelModal(Number(btn.dataset.cancelId)));
    });
}

// 7. Modal de cancelación (mismo modal del HTML base, ahora contra el backend).
// Se exponen en window porque el HTML las invoca con onclick.
function openCancelModal(bookingId) {
    const booking = myBookings.find((b) => b.id === bookingId);
    if (!booking) return;
    cancelTargetId = bookingId;
    const wc = weeklyClasses.find((c) => c.id === booking.clase_id);
    const activity = wc ? activitiesById[wc.activity_type_id]?.name || 'Clase' : 'Clase';
    const when = wc ? dayParts(wc.activity_date).long : '';
    const teacher = wc ? (teachersById[wc.teacher_id] || '') : '';
    document.getElementById('cancel-modal-activity').textContent = activity;
    document.getElementById('cancel-modal-time').textContent = `${when} · ${teacher}`.trim();
    document.getElementById('cancel-modal').classList.remove('hidden');
}

function closeCancelModal() {
    document.getElementById('cancel-modal').classList.add('hidden');
    cancelTargetId = null;
}

async function confirmCancelBooking() {
    if (!cancelTargetId) return;
    const target = myBookings.find((b) => b.id === cancelTargetId);
    try {
        await bookingService.deleteBooking(cancelTargetId);
    } catch (error) {
        // El backend impide cancelar con menos de 2h: se muestra el motivo.
        alert(error?.message || 'No se pudo cancelar la reserva.');
        return;
    }
    const card = document.getElementById(`booking-card-${cancelTargetId}`);
    closeCancelModal();
    myBookings = myBookings.filter((b) => b.id !== cancelTargetId);
    if (member) {
        member.remaining_credits += 1;
        renderProfile();
    }
    renderBookings();
    if (card) {
        card.style.transition = 'all 0.4s ease';
        card.style.opacity = '0';
        card.style.transform = 'translateY(-10px)';
        setTimeout(() => card.remove(), 400);
        renderBookings();
    }
}

window.openCancelModal = openCancelModal;
window.closeCancelModal = closeCancelModal;
window.confirmCancelBooking = confirmCancelBooking;

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCancelModal();
});

// 8. Entrada al espacio: valida el código contra el backend antes de mostrar el panel.
async function enterMemberArea(code) {
    member = await login(code);
    memberCode = code;
    sessionStorage.setItem('gymges_member_code', code);
    await loadCatalog();
    myBookings = await bookingService.getBookingsByMember(code);
    renderProfile();
    renderBookings();
    location.hash = 'member-dashboard';
}

enterLink?.addEventListener('click', async (e) => {
    e.preventDefault();
    hideLoginError();
    const code = dniInput.value.trim().toUpperCase();
    if (!code) {
        showLoginError('Introduce tu código de socio para entrar.');
        return;
    }
    enterLink.style.opacity = '0.6';
    enterLink.style.pointerEvents = 'none';
    try {
        await enterMemberArea(code);
    } catch (error) {
        showLoginError(error?.message || 'No se pudo acceder. Revisa el código e inténtalo de nuevo.');
    } finally {
        enterLink.style.opacity = '';
        enterLink.style.pointerEvents = '';
    }
});

document.getElementById('btn-logout')?.addEventListener('click', () => {
    sessionStorage.removeItem('gymges_member_code');
    memberCode = null;
    member = null;
    myBookings = [];
});

// Sesión persistente: si ya había entrado, se restaura el panel.
if (memberCode) {
    const code = memberCode;
    (async () => {
        try {
            await enterMemberArea(code);
        } catch (error) {
            sessionStorage.removeItem('gymges_member_code');
            memberCode = null;
            if (location.hash === '#member-dashboard') history.replaceState(null, '', ' ');
            showLoginError(error?.message || 'La sesión anterior ya no es válida.');
        }
    })();
} else if (location.hash === '#member-dashboard') {
    history.replaceState(null, '', ' ');
}
