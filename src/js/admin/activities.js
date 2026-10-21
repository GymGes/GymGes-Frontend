import { activityService } from '../services/activityService.js';
import { modalService } from '../services/modalService.js';

// Estado local de actividades en la vista
let activities = [];
let activityToDeleteId = null;
let editingActivityId = null;

// Referencias del DOM
const tableBody = document.getElementById('activities-table-body');
const activityModal = document.getElementById('activity-modal');
const deleteModal = document.getElementById('delete-modal');
const activityForm = document.getElementById('activity-form');

const btnOpenCreate = document.getElementById('btn-open-create');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');

const btnCloseDeleteModal = document.getElementById('btn-close-delete-modal');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');

const dropzoneBox = document.getElementById('dropzone-box');
const fileInput = document.getElementById('activity-file-input');
const dropzonePreview = document.getElementById('dropzone-preview');
const previewFilename = document.getElementById('preview-filename');
const previewImage = document.getElementById('preview-image');

function getErrorMessage(error, fallback) {
    return (
        error?.response?.data?.detail ||
        error?.message ||
        fallback
    );
}

async function loadActivities() {
    if (tableBody) {
        tableBody.innerHTML = `
            <tr id="table-loading-row">
                <td colspan="4" class="text-center table-state-row">
                    Cargando catálogo de actividades...
                </td>
            </tr>
        `;
    }

    try {
        activities = await activityService.getActivities();
        renderActivities();
    } catch (error) {
        console.error('Error al cargar las actividades:', error);

        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center table-state-row">
                        No se ha podido cargar el catálogo de actividades.
                    </td>
                </tr>
            `;
        }

        modalService.error(
            getErrorMessage(
                error,
                'No se han podido cargar las actividades.'
            )
        );
    }
}

function renderActivities() {
    if (!tableBody) return;

    if (activities.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center table-state-row">
                    No hay actividades registradas en el catálogo.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = activities.map(act => `
        <tr id="activity-row-${act.id}">
            <td>
                <div class="cell-activity">
                    <img
                        class="cell-activity-img"
                        src="${act.imageUrl}"
                        alt="${act.name}"
                    />
                    <div class="cell-activity-info">
                        <span class="cell-activity-title">${act.name}</span>
                        <span class="cell-activity-desc">${act.description || ''}</span>
                    </div>
                </div>
            </td>

            <td style="white-space: nowrap;">
                <span style="display: inline-flex; align-items: center; gap: 0.35rem; color: var(--color-text-main);">
                    <span class="material-symbols-outlined" style="font-size: 16px; color: var(--color-secondary);">
                        schedule
                    </span>
                    ${act.duration} min
                </span>
            </td>

            <td style="white-space: nowrap;">
                <strong style="color: var(--color-primary);">${act.capacity}</strong> plazas
            </td>

            <td class="text-right" style="white-space: nowrap;">
                <div class="cell-actions">
                    <button
                        class="btn-icon"
                        type="button"
                        aria-label="Editar"
                        onclick="window.openEditModal(${act.id})"
                    >
                        <span class="material-symbols-outlined" style="font-size: 18px;">
                            edit
                        </span>
                    </button>

                    <button
                        class="btn-icon btn-icon-danger"
                        type="button"
                        aria-label="Eliminar"
                        onclick="window.openDeleteModal(${act.id})"
                    >
                        <span class="material-symbols-outlined" style="font-size: 18px;">
                            delete
                        </span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openModal(isEdit = false, activity = null) {
    const modalTitle = document.getElementById('modal-title');
    const inputName = document.getElementById('modal-act-name');
    const inputDuration = document.getElementById('modal-act-duration');
    const inputCapacity = document.getElementById('modal-act-capacity');
    const inputDesc = document.getElementById('modal-act-desc');

    if (isEdit && activity) {
        editingActivityId = activity.id;

        modalTitle.textContent = 'Editar Tipo de Actividad';
        inputName.value = activity.name;
        inputDuration.value = activity.duration;
        inputCapacity.value = activity.capacity;
        inputDesc.value = activity.description || '';

        previewImage.src = activity.imageUrl;
        previewFilename.textContent = 'Portada actual';
        dropzonePreview.classList.remove('hidden');
    } else {
        editingActivityId = null;

        modalTitle.textContent = 'Añadir Tipo de Actividad';
        activityForm.reset();

        inputDuration.value = 50;
        inputCapacity.value = 16;

        previewImage.removeAttribute('src');
        previewFilename.textContent = 'imagen.jpg';
        dropzonePreview.classList.add('hidden');
    }

    if (fileInput) fileInput.value = '';

    activityModal.classList.remove('hidden');
}

function closeModal() {
    activityModal.classList.add('hidden');
    editingActivityId = null;
}

window.openDeleteModal = function (id) {
    const target = activities.find(a => a.id === id);
    if (!target) return;

    activityToDeleteId = id;

    document.getElementById('delete-activity-name').textContent = target.name;
    deleteModal.classList.remove('hidden');
};

function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    activityToDeleteId = null;
}

window.openEditModal = function (id) {
    const target = activities.find(a => a.id === id);

    if (target) {
        openModal(true, target);
    }
};

//Event listeners
btnOpenCreate?.addEventListener('click', () => openModal(false));
btnCloseModal?.addEventListener('click', closeModal);
btnCancelModal?.addEventListener('click', closeModal);
btnCloseDeleteModal?.addEventListener('click', closeDeleteModal);
btnCancelDelete?.addEventListener('click', closeDeleteModal);

//Eliminar actividad
btnConfirmDelete?.addEventListener('click', async () => {
    if (activityToDeleteId === null) return;

    const idToDelete = activityToDeleteId;

    btnConfirmDelete.disabled = true;

    try {
        await activityService.deleteActivity(idToDelete);

        activities = activities.filter(a => a.id !== idToDelete);

        renderActivities();
        closeDeleteModal();

        modalService.success(
            'La actividad se ha eliminado correctamente.'
        );
    } catch (error) {
        console.error('Error al eliminar la actividad:', error);

        modalService.error(
            getErrorMessage(
                error,
                'No se ha podido eliminar la actividad.'
            )
        );
    } finally {
        btnConfirmDelete.disabled = false;
    }
});

dropzoneBox?.addEventListener('click', () => {
    fileInput?.click();
});

fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];

    if (file) {
        previewImage.src = URL.createObjectURL(file);
        previewFilename.textContent = file.name;
        dropzonePreview.classList.remove('hidden');
    }
});

//Guardar formulario (Crear o Actualizar)
activityForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const activityData = {
        name: document.getElementById('modal-act-name').value.trim(),
        duration: parseInt(
            document.getElementById('modal-act-duration').value,
            10
        ),
        capacity: parseInt(
            document.getElementById('modal-act-capacity').value,
            10
        ),
        description: document.getElementById('modal-act-desc').value.trim(),
        image: fileInput?.files[0] || null
    };

    if (!activityData.name) {
        modalService.warning(
            'Introduce el nombre de la actividad.'
        );
        return;
    }

    if (
        !Number.isInteger(activityData.duration) ||
        activityData.duration <= 0
    ) {
        modalService.warning(
            'La duración debe ser un número entero mayor que cero.'
        );
        return;
    }

    if (
        !Number.isInteger(activityData.capacity) ||
        activityData.capacity <= 0
    ) {
        modalService.warning(
            'La capacidad debe ser un número entero mayor que cero.'
        );
        return;
    }

    const isEditing = editingActivityId !== null;
    const activityId = editingActivityId;

    const submitButton = activityForm.querySelector(
        'button[type="submit"]'
    );

    if (submitButton) submitButton.disabled = true;

    try {
        if (isEditing) {
            const updated = await activityService.updateActivity(
                activityId,
                activityData
            );

            const index = activities.findIndex(
                a => a.id === activityId
            );

            if (index !== -1) {
                activities[index] = updated;
            }

            modalService.success(
                'La actividad se ha actualizado correctamente.'
            );
        } else {
            const created = await activityService.createActivity(
                activityData
            );

            activities.unshift(created);

            modalService.success(
                'La actividad se ha creado correctamente.'
            );
        }

        renderActivities();
        closeModal();
    } catch (error) {
        console.error('Error al guardar la actividad:', error);

        modalService.error(
            getErrorMessage(
                error,
                isEditing
                    ? 'No se ha podido actualizar la actividad.'
                    : 'No se ha podido crear la actividad.'
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


loadActivities();
