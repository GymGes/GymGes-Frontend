import { teacherService } from '../services/teacherService.js';
import { modalService } from '../services/modalService.js';
import { paginate, renderPagination } from '../utils/paginate.js';

// Estado local
let teachers = [];
let teacherToDeleteId = null;
let editingTeacherId = null;
let currentPage = 1;

// Elementos del DOM
const tableBody = document.getElementById('teachers-table-body');
const pagination = document.getElementById('teachers-pagination');
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

function getErrorMessage(error, fallback) {
    return (
        error?.response?.data?.detail ||
        error?.message ||
        fallback
    );
}

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

    try {
        teachers = await teacherService.getTeachers();

        currentPage = 1;
        renderTeachers();
    } catch (error) {
        console.error('Error al cargar los profesores:', error);

        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center table-state-row">
                        No se pudo cargar el listado de profesores.
                    </td>
                </tr>
            `;
        }

        modalService.error(
            getErrorMessage(
                error,
                'No se ha podido cargar el listado de profesores.'
            )
        );
    }
}

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

        renderPagination(pagination, paginate([], currentPage), setPage);
        return;
    }

    const view = paginate(teachers, currentPage);
    currentPage = view.page;

    tableBody.innerHTML = view.items.map(teacher => `
        <tr id="teacher-row-${teacher.id}">
            <td style="white-space: nowrap;">
                <span class="cell-id">#${teacher.id}</span>
            </td>
            <td style="white-space: nowrap;">
                <span style="font-weight: 600; color: var(--color-primary);">
                    ${teacher.name}
                </span>
            </td>
            <td class="text-right" style="white-space: nowrap;">
                <div class="cell-actions">
                    <button
                        class="btn-icon"
                        type="button"
                        aria-label="Editar"
                        onclick="window.openEditTeacherModal(${teacher.id})"
                    >
                        <span class="material-symbols-outlined" style="font-size: 18px;">
                            edit
                        </span>
                    </button>

                    <button
                        class="btn-icon btn-icon-danger"
                        type="button"
                        aria-label="Eliminar"
                        onclick="window.openDeleteTeacherModal(${teacher.id})"
                    >
                        <span class="material-symbols-outlined" style="font-size: 18px;">
                            delete
                        </span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    renderPagination(pagination, view, setPage);
}

function setPage(page) {
    currentPage = page;
    renderTeachers();
}

function openModal(isEdit = false, teacher = null) {
    if (!teacherModal || !teacherForm) return;

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
    teacherModal?.classList.add('hidden');
    editingTeacherId = null;
}

window.openEditTeacherModal = function (id) {
    const teacher = teachers.find(t => t.id === id);

    if (teacher) {
        openModal(true, teacher);
    }
};

window.openDeleteTeacherModal = function (id) {
    const teacher = teachers.find(t => t.id === id);

    if (!teacher) return;

    teacherToDeleteId = id;
    deleteTeacherName.textContent = teacher.name;
    deleteModal.classList.remove('hidden');
};

function closeDeleteModal() {
    deleteModal?.classList.add('hidden');
    teacherToDeleteId = null;
}

//Event listener
btnOpenCreate?.addEventListener('click', () => openModal(false));
btnCloseModal?.addEventListener('click', closeModal);
btnCancelModal?.addEventListener('click', closeModal);

btnCloseDeleteModal?.addEventListener('click', closeDeleteModal);
btnCancelDelete?.addEventListener('click', closeDeleteModal);

//Eliminar profesor
btnConfirmDelete?.addEventListener('click', async () => {
    if (teacherToDeleteId === null) return;

    const idToDelete = teacherToDeleteId;
    btnConfirmDelete.disabled = true;

    try {
        await teacherService.deleteTeacher(idToDelete);

        teachers = teachers.filter(t => t.id !== idToDelete);

        currentPage = Math.min(
            currentPage,
            Math.max(1, Math.ceil(teachers.length / 10))
        );

        renderTeachers();
        closeDeleteModal();

        modalService.success(
            'El profesor se ha eliminado correctamente.'
        );
    } catch (error) {
        console.error('Error al eliminar el profesor:', error);

        modalService.error(
            getErrorMessage(
                error,
                'No se ha podido eliminar el profesor.'
            )
        );
    } finally {
        btnConfirmDelete.disabled = false;
    }
});

//Guardar profesor (Creación / Actualización)
teacherForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameVal = inputTeacherName.value.trim();

    if (!nameVal) {
        modalService.warning(
            'Introduce el nombre del profesor.'
        );
        inputTeacherName.focus();
        return;
    }

    const teacherData = { name: nameVal };
    const isEditing = editingTeacherId !== null;
    const teacherId = editingTeacherId;

    const submitButton = teacherForm.querySelector(
        'button[type="submit"]'
    );

    if (submitButton) submitButton.disabled = true;

    try {
        if (isEditing) {
            const updated = await teacherService.updateTeacher(
                teacherId,
                teacherData
            );

            const index = teachers.findIndex(t => t.id === teacherId);

            if (index !== -1) {
                teachers[index] = updated;
            }

            modalService.success(
                'El profesor se ha actualizado correctamente.'
            );
        } else {
            const created = await teacherService.createTeacher(
                teacherData
            );

            teachers.push(created);

            modalService.success(
                'El profesor se ha creado correctamente.'
            );
        }

        currentPage = 1;
        renderTeachers();
        closeModal();
    } catch (error) {
        console.error('Error al guardar el profesor:', error);

        modalService.error(
            getErrorMessage(
                error,
                isEditing
                    ? 'No se ha podido actualizar el profesor.'
                    : 'No se ha podido crear el profesor.'
            )
        );
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeDeleteModal();
    }
});

loadTeachers();
