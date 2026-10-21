import { scheduleService } from "../services/scheduleService.js";
import { activityService } from "../services/activityService.js";
import { teacherService } from "../services/teacherService.js";
import { paginate, renderPagination } from "../utils/paginate.js";
import { modalService } from "../services/modalService.js";

// Estado local
let schedules = [];
let scheduleToDeleteId = null;
let activitiesMap = {};
let teachersMap = {};
let currentPage = 1;

// Referencias del DOM
const tableBody = document.getElementById("schedules-table-body");
const pagination = document.getElementById("schedules-pagination");
const scheduleModal = document.getElementById("schedule-modal");
const deleteModal = document.getElementById("delete-schedule-modal");
const scheduleForm = document.getElementById("schedule-form");

const btnOpenCreate = document.getElementById("btn-open-create-schedule");
const btnCloseModal = document.getElementById("btn-close-schedule-modal");
const btnCancelModal = document.getElementById("btn-cancel-schedule-modal");

const btnCloseDeleteModal = document.getElementById(
  "btn-close-delete-schedule-modal",
);
const btnCancelDelete = document.getElementById("btn-cancel-delete-schedule");
const btnConfirmDelete = document.getElementById("btn-confirm-delete-schedule");

const inputDate = document.getElementById("modal-date");
const inputTime = document.getElementById("modal-time");

function configureDateInput() {
  if (!inputDate) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 14);

  inputDate.min = formatInputDate(today);
  inputDate.max = formatInputDate(endDate);
}

function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function fillSelect(select, items, placeholder) {
  if (!select) return;

  select.innerHTML = `
        <option value="">${placeholder}</option>
        ${items
          .map(
            (item) => `
            <option value="${item.id}">${item.name}</option>
        `,
          )
          .join("")}
    `;
}

async function loadSchedules() {
  if (!tableBody) return;

  tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center table-state-row">
                Cargando sesiones...
            </td>
        </tr>
    `;

  try {
    const [loadedSchedules, activitiesResponse, teachersResponse] =
      await Promise.all([
        scheduleService.getSchedules(),
        activityService.getActivities(),
        teacherService.getTeachers(),
      ]);

    const activities = Array.isArray(activitiesResponse)
      ? activitiesResponse
      : Array.isArray(activitiesResponse?.data)
        ? activitiesResponse.data
        : [];

    const teachers = Array.isArray(teachersResponse)
      ? teachersResponse
      : Array.isArray(teachersResponse?.data)
        ? teachersResponse.data
        : [];
    activitiesMap = Object.fromEntries(
      activities.map((activity) => [activity.id, activity]),
    );

    teachersMap = Object.fromEntries(
      teachers.map((teacher) => [teacher.id, teacher.name]),
    );

    fillSelect(
      document.getElementById("modal-activity-id"),
      activities,
      "Selecciona una actividad",
    );

    fillSelect(
      document.getElementById("modal-teacher-id"),
      teachers,
      "Selecciona un profesor",
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 14);
    schedules = loadedSchedules
    

    currentPage = 1;
    renderSchedules();
  } catch (error) {
    console.error("Error cargando sesiones:", error);
    modalService.error("No se pudieron cargar los datos. Comprueba que el backend está activo.")

  }
}

function renderSchedules() {
  if (!tableBody) return;

  if (schedules.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center table-state-row">
                    No hay sesiones programadas.
                </td>
            </tr>
        `;
    renderPagination(pagination, paginate([], currentPage), setPage);
    return;
  }

  schedules.sort((a, b) =>
    `${a.activityDate}T${a.startTime}`.localeCompare(
      `${b.activityDate}T${b.startTime}`,
    ),
  );

  const view = paginate(schedules, currentPage);
  currentPage = view.page;

  tableBody.innerHTML = view.items
    .map((schedule) => {
      const activity = activitiesMap[schedule.activityId] || {
        name: `Actividad #${schedule.activityId}`,
        meta: "",
      };

      const teacherName =
        teachersMap[schedule.teacherId] || `Profesor #${schedule.teacherId}`;

      return `
            <tr id="schedule-row-${schedule.id}">
                <td>
                    <span style="font-weight: 600; color: var(--color-primary); display: block;">
                        ${activity.name}
                    </span>
                </td>

                <td style="white-space: nowrap;">
                    <span class="badge-day">
                        ${formatDate(schedule.activityDate)}
                    </span>
                </td>

                <td style="white-space: nowrap;">
                    <div class="cell-time-indicator">
                        <span class="material-symbols-outlined"
                              style="font-size: 16px; color: var(--color-secondary);">
                            schedule
                        </span>
                        <span>${schedule.startTime}</span>
                    </div>
                </td>

                <td style="white-space: nowrap;">
                    <div class="cell-teacher-indicator">
                        <span class="material-symbols-outlined"
                              style="font-size: 16px; color: var(--color-secondary);">
                            person
                        </span>
                        <span>${teacherName}</span>
                    </div>
                </td>

                <td class="text-right" style="white-space: nowrap;">
                    <div class="cell-actions">
                        <button class="btn-icon btn-icon-danger"
                                type="button"
                                aria-label="Eliminar"
                                onclick="window.openDeleteScheduleModal(${schedule.id})">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    })
    .join("");

  renderPagination(pagination, view, setPage);
}

function setPage(page) {
  currentPage = page;
  renderSchedules();
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function openModal(isEdit = false, schedule = null) {
  const inputTime = document.getElementById("modal-time");

  scheduleForm.reset();
  configureDateInput();

  inputDate.value = formatInputDate(new Date());
  inputTime.value = "09:00";

  const modalTitle = document.getElementById("modal-schedule-title");
  if (modalTitle) {
    modalTitle.textContent = "Añadir sesión";
  }

  scheduleModal.classList.remove("hidden");
}

function closeModal() {
  scheduleModal.classList.add("hidden");
}

window.openDeleteScheduleModal = function (id) {
  const target = schedules.find((s) => s.id === id);
  if (!target) return;

  scheduleToDeleteId = id;

  const activity =
    activitiesMap[target.activityId]?.name || `Actividad #${target.activityId}`;
  document.getElementById("delete-schedule-name").textContent =
    `${activity} (${formatDate(target.activityDate)} ${target.startTime})`;

  deleteModal.classList.remove("hidden");
};

function closeDeleteModal() {
  deleteModal.classList.add("hidden");
  scheduleToDeleteId = null;
}

//Event Listeners
btnOpenCreate?.addEventListener("click", () => openModal(false));
btnCloseModal?.addEventListener("click", closeModal);
btnCancelModal?.addEventListener("click", closeModal);

btnCloseDeleteModal?.addEventListener("click", closeDeleteModal);
btnCancelDelete?.addEventListener("click", closeDeleteModal);

btnConfirmDelete?.addEventListener("click", async () => {
  if (scheduleToDeleteId !== null) {
    try {
      await scheduleService.deleteSchedule(scheduleToDeleteId);
      schedules = schedules.filter((s) => s.id !== scheduleToDeleteId);
      currentPage = 1;
      renderSchedules();
      closeDeleteModal();
    } catch (error) {
      console.error("Error eliminando sesión:", error);
      modalService.error(error?.message || "No se pudo eliminar la sesión.")

    }
  }
});

//Guardar formulario (Crear o Actualizar)

scheduleForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const scheduleData = {
    activityId: document.getElementById("modal-activity-id").value,
    activityDate: inputDate.value,
    startTime: inputTime.value,
    teacherId: document.getElementById("modal-teacher-id").value,
  };

  if (
    !scheduleData.activityId ||
    !scheduleData.teacherId ||
    !scheduleData.activityDate ||
    !scheduleData.startTime
  ) {
    modalService.warning("Completa todos los campos.");
    return;
  }

  if (
    scheduleData.activityDate < inputDate.min ||
    scheduleData.activityDate > inputDate.max
  ) {
    modalService.info("Solo puedes crear sesiones desde hoy hasta dentro de 14 días.")
    return;
  }

  try {
    const created = await scheduleService.createSchedule(scheduleData);

    if (
      created.activityDate >= inputDate.min &&
      created.activityDate <= inputDate.max
    ) {
      schedules.push(created);
    }

    currentPage = 1;
    renderSchedules();
    closeModal();
  } catch (error) {
    console.error("Error creando sesión:", error);

    if (error.type === "conflict") {
        modalService.error(error.message)
        return;
    }

    modalService.error(error.message || "No se pudo crear la sesión.");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    closeDeleteModal();
  }
});

configureDateInput();
loadSchedules();
