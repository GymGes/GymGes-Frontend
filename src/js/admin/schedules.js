/* src/js/admin/schedules.js */
import {
    scheduleService,
    ACTIVITIES_MAP,
    TEACHERS_MAP,
    DAY_NAMES
} from '../services/scheduleService.js';

// Estado local
let schedules = [];
let scheduleToDeleteId = null;
let editingScheduleId = null;

// Referencias del DOM
const tableBody = document.getElementById('schedules-table-body');
const scheduleModal = document.getElementById('schedule-modal');
const deleteModal = document.getElementById('delete-schedule-modal');
const scheduleForm = document.getElementById('schedule-form');

const btnOpenCreate = document.getElementById('btn-open-create-schedule');
const btnCloseModal = document.getElementById('btn-close-schedule-modal');
const btnCancelModal = document.getElementById('btn-cancel-schedule-modal');

const btnCloseDeleteModal = document.getElementById('btn-close-delete-schedule-modal');
const btnCancelDelete = document.getElementById('btn-cancel-delete-schedule');
const btnConfirmDelete = document.getElementById('btn-confirm-delete-schedule');

const inputDay = document.getElementById('modal-day');
const selectedDayDisplay = document.getElementById('selected-day-display');
const dayButtons = document.querySelectorAll('.calendar-day-btn');

// 1. Selector interactivo de días (Lunes 1 a Domingo 7)
function selectCalendarDay(dayNumber) {
    const day = Number(dayNumber);
    if (inputDay) inputDay.value = day;

    if (selectedDayDisplay) {
        selectedDayDisplay.textContent = `${DAY_NAMES[day]} seleccionado (Día ${day})`;
    }

    dayButtons.forEach(btn => {
        const btnDay = Number(btn.getAttribute('data-day'));
        if (btnDay === day) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

dayButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const day = btn.getAttribute('data-day');
        selectCalendarDay(day);
    });
});

// 2. Cargar datos iniciales
async function loadSchedules() {
    if (tableBody) {
        tableBody.innerHTML = `
      <tr id="table-loading-row">
        <td colspan="5" class="text-center table-state-row">
          Cargando cartelera de horarios...
        </td>
      </tr>
    `;
    }
    schedules = await scheduleService.getSchedules();
    renderSchedules();
}

// 3. Renderizado de la tabla
function renderSchedules() {
    if (!tableBody) return;

    if (schedules.length === 0) {
        tableBody.innerHTML = `
        <tr>
        <td colspan="5" class="text-center table-state-row">
            No hay clases programadas en el cuadrante semanal.
        </td>
        </tr>
    `;
        return;
    }

    tableBody.innerHTML = schedules.map(sch => {
        const activity = ACTIVITIES_MAP[sch.activityId] || { name: 'Actividad', meta: '50 min' };
        const teacherName = TEACHERS_MAP[sch.teacherId] || 'Sin asignar';
        const dayName = DAY_NAMES[sch.dayOfWeek] || `Día ${sch.dayOfWeek}`;

        return `
        <tr id="schedule-row-${sch.id}">
        <td>
            <span style="font-weight: 600; color: var(--color-primary); display: block;">${activity.name}</span>
            <span class="cell-subtext">${activity.meta}</span>
        </td>
        <td style="white-space: nowrap;">
            <span class="badge-day">${dayName} (Día ${sch.dayOfWeek})</span>
        </td>
        <td style="white-space: nowrap;">
            <div class="cell-time-indicator">
            <span class="material-symbols-outlined" style="font-size: 16px; color: var(--color-secondary);">schedule</span>
            <span>${sch.startTime}</span>
            </div>
        </td>
        <td style="white-space: nowrap;">
            <div class="cell-teacher-indicator">
            <span class="material-symbols-outlined" style="font-size: 16px; color: var(--color-secondary);">person</span>
            <span>${teacherName}</span>
            </div>
        </td>
        <td class="text-right" style="white-space: nowrap;">
            <div class="cell-actions">
            <button class="btn-icon" type="button" aria-label="Editar" onclick="window.openEditScheduleModal(${sch.id})">
                <span class="material-symbols-outlined" style="font-size: 18px;">edit</span>
            </button>
            <button class="btn-icon btn-icon-danger" type="button" aria-label="Eliminar" onclick="window.openDeleteScheduleModal(${sch.id})">
                <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
            </button>
            </div>
        </td>
        </tr>
    `;
    }).join('');
    }

// 4. Ciclo de vida de los modales
function openModal(isEdit = false, schedule = null) {
    const modalTitle = document.getElementById('modal-schedule-title');
    const selectActivity = document.getElementById('modal-activity-id');
    const inputTime = document.getElementById('modal-time');
    const selectTeacher = document.getElementById('modal-teacher-id');

    if (isEdit && schedule) {
        editingScheduleId = schedule.id;
        modalTitle.textContent = 'Editar Clase Semanal';
        selectActivity.value = schedule.activityId;
        inputTime.value = schedule.startTime;
        selectTeacher.value = schedule.teacherId;
        selectCalendarDay(schedule.dayOfWeek);
    } else {
        editingScheduleId = null;
        modalTitle.textContent = 'Añadir Clase Semanal';
        scheduleForm.reset();
        inputTime.value = '09:00';
        selectCalendarDay(3); // Por defecto Miércoles
    }

    scheduleModal.classList.remove('hidden');
}

function closeModal() {
    scheduleModal.classList.add('hidden');
    editingScheduleId = null;
}

window.openEditScheduleModal = function (id) {
    const target = schedules.find(s => s.id === id);
    if (target) openModal(true, target);
};

window.openDeleteScheduleModal = function (id) {
    const target = schedules.find(s => s.id === id);
    if (!target) return;

    scheduleToDeleteId = id;
    const activity = ACTIVITIES_MAP[target.activityId]?.name || 'esta clase';
    const dayName = DAY_NAMES[target.dayOfWeek] || '';
    document.getElementById('delete-schedule-name').textContent = `${activity} (${dayName} ${target.startTime})`;

    deleteModal.classList.remove('hidden');
};

function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    scheduleToDeleteId = null;
}

// 5. Event Listeners
btnOpenCreate?.addEventListener('click', () => openModal(false));
btnCloseModal?.addEventListener('click', closeModal);
btnCancelModal?.addEventListener('click', closeModal);

btnCloseDeleteModal?.addEventListener('click', closeDeleteModal);
btnCancelDelete?.addEventListener('click', closeDeleteModal);

btnConfirmDelete?.addEventListener('click', async () => {
    if (scheduleToDeleteId !== null) {
        await scheduleService.deleteSchedule(scheduleToDeleteId);
        schedules = schedules.filter(s => s.id !== scheduleToDeleteId);
        renderSchedules();
        closeDeleteModal();
    }
});

// Guardar formulario (Crear o Actualizar)
scheduleForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const scheduleData = {
        activityId: document.getElementById('modal-activity-id').value,
        dayOfWeek: document.getElementById('modal-day').value,
        startTime: document.getElementById('modal-time').value,
        teacherId: document.getElementById('modal-teacher-id').value
    };

    if (editingScheduleId) {
        const updated = await scheduleService.updateSchedule(editingScheduleId, scheduleData);
        const index = schedules.findIndex(s => s.id === editingScheduleId);
        if (index !== -1) schedules[index] = updated;
    } else {
        const created = await scheduleService.createSchedule(scheduleData);
        schedules.unshift(created);
    }

    renderSchedules();
    closeModal();
});

// Cerrar con Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeDeleteModal();
    }
});

// Inicializar carga de la tabla
loadSchedules();