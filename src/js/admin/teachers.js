/* src/js/admin/teachers.js */
import { teacherService } from '../services/teacherService.js';

// Estado local
let teachers = [];
let teacherToDeleteId = null;
let editingTeacherId = null;

// Elementos del DOM
const tableBody = document.getElementById('teachers-table-body');
const teacherModal = document.getElementById('teacher-modal');
const deleteModal = document.getElementById('delete-teacher-modal');
const teacherForm = document.getElementById('teacher-form');

const modalTitle = document.getElementById('modal-teacher-title');
const inputTeacherId = document.getElementById('modal-teacher-id');
const inputTeacherName = document.getElementById('modal-teacher-name');

const btnOpenCreate = document.getElementById('btn-open-create-teacher');
const btnCloseModal = document.getElementById('btn-close-teacher-modal');
const btnCancelModal = document.getElementById('btn-cancel-teacher-modal');

const deleteTeacherName = document.getElementById('delete-teacher-name');
const btnCloseDeleteModal = document.getElementById('btn-close-delete-teacher-modal');
const btnCancelDelete = document.getElementById('btn-cancel-delete-teacher');
const btnConfirmDelete = document.getElementById('btn-confirm-delete-teacher');

// 1. Cargar datos del servicio
async function loadTeachers() {
    if (tableBody) {
        tableBody.innerHTML = `
        <tr id="table-loading-row">
        <td colspan="3" class="text-center table-state-row">
            Cargando listado de profesores...
        </td>
        </tr>
    `;
    }
    teachers = await teacherService.getTeachers();
    renderTeachers();
    }

// 2. Renderizado de la tabla de profesores
function renderTeachers() {
    if (!tableBody) return;

    if (teachers.length === 0) {
        tableBody.innerHTML = `
        <tr>
        <td colspan="3" class="text-center table-state-row">
            No hay profesores dados de alta en el sistema.
        </td>
        </tr>
    `;
        return;
    }

    tableBody.innerHTML = teachers.map(teacher => `
    <tr id="teacher-row-${teacher.id}">
        <td style="white-space: nowrap;">
        <span class="cell-id">#${teacher.id}</span>
        </td>
        <td style="white-space: nowrap;">
        <span style="font-weight: 600; color: var(--color-primary);">${teacher.name}</span>
        </td>
        <td class="text-right" style="white-space: nowrap;">
        <div class="cell-actions">
            <button class="btn-icon" type="button" aria-label="Editar" onclick="window.openEditTeacherModal(${teacher.id})">
            <span class="material-symbols-outlined" style="font-size: 18px;">edit</span>
            </button>
            <button class="btn-icon btn-icon-danger" type="button" aria-label="Eliminar" onclick="window.openDeleteTeacherModal(${teacher.id})">
            <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
            </button>
        </div>
        </td>
    </tr>
    `).join('');
}

// 3. Modales (Crear / Editar)
function openModal(isEdit = false, teacher = null) {
    if (isEdit && teacher) {
        editingTeacherId = teacher.id;
        modalTitle.textContent = 'Editar Profesor';
        inputTeacherId.value = teacher.id;
        inputTeacherName.value = teacher.name;
    } else {
        editingTeacherId = null;
        modalTitle.textContent = 'Añadir Profesor';
        teacherForm.reset();
        inputTeacherId.value = '';
    }

    teacherModal.classList.remove('hidden');
    inputTeacherName.focus();
}

function closeModal() {
    teacherModal.classList.add('hidden');
    editingTeacherId = null;
}

// Exponer funciones para los botones de acción en tabla
window.openEditTeacherModal = function (id) {
    const teacher = teachers.find(t => t.id === id);
    if (teacher) openModal(true, teacher);
};

window.openDeleteTeacherModal = function (id) {
    const teacher = teachers.find(t => t.id === id);
    if (!teacher) return;

    teacherToDeleteId = id;
    deleteTeacherName.textContent = teacher.name;
    deleteModal.classList.remove('hidden');
};

function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    teacherToDeleteId = null;
}

// 4. Asignación de eventos
btnOpenCreate?.addEventListener('click', () => openModal(false));
btnCloseModal?.addEventListener('click', closeModal);
btnCancelModal?.addEventListener('click', closeModal);

btnCloseDeleteModal?.addEventListener('click', closeDeleteModal);
btnCancelDelete?.addEventListener('click', closeDeleteModal);

btnConfirmDelete?.addEventListener('click', async () => {
    if (teacherToDeleteId !== null) {
        await teacherService.deleteTeacher(teacherToDeleteId);
        teachers = teachers.filter(t => t.id !== teacherToDeleteId);
        renderTeachers();
        closeDeleteModal();
    }
});

// Guardar profesor (Creación / Actualización)
teacherForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameVal = inputTeacherName.value.trim();
    if (!nameVal) return;

    const teacherData = { name: nameVal };

    if (editingTeacherId) {
        const updated = await teacherService.updateTeacher(editingTeacherId, teacherData);
        const index = teachers.findIndex(t => t.id === editingTeacherId);
        if (index !== -1) teachers[index] = updated;
    } else {
        const created = await teacherService.createTeacher(teacherData);
        teachers.push(created);
    }

    renderTeachers();
    closeModal();
});

// Cierre mediante Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeDeleteModal();
    }
});

// Carga inicial
loadTeachers();