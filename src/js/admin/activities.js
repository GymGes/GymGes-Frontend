/* src/js/admin/activities.js */

// 1. Datos simulados (Mock data con la estructura de la base de datos)
let activities = [
    {
        id: 1,
        name: 'Crossfit Studio',
        duration: 50,
        capacity: 16,
        description: 'Entrenamiento funcional de alta cadencia combinando halterofilia y gimnásticos.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCbKlWkvNFcFZV6Uq59uuc6qEAlkyNXUsSfkZFTCAQfMLwYYjeSKbdGb9J7uEdvHKsPkcKVTt0s7_PNSRylpoS22kKZgQl1x_IYKYfyi-pZrO0R-CoED3AVCNyJTiuk4wHtrB4qu9ybiG2NXjCKMpwTNRMFN0waoAYTXlwnuwTbuzs9hj0fTc538UOhH_lTF45zBu4mbNUeS4teVRlTf_uedIzOowaLT3WqO42BFUoZAH8pMw2js_osw'
    },
    {
        id: 2,
        name: 'Hyrox Conditioning',
        duration: 50,
        capacity: 20,
        description: 'Preparación atlética integral que fusiona carrera y trineo de empuje.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmnvv3hDgfaufGsKgGb1gkc9DhRk0Ojt4uh56G55qsJ_9kR1JIQ4tSaSKUNRl4vbekBmjAKGhwRv2KpxCm5LUzInEqxDuY1VO2xbSvEHLg0ur-qOWi3W06Uc8MpGipWE1BmqC6EwHKBGTWjApPcntbQk86aXTRyU1Wy5I37WgyKa-ZnoYks-LTgBkK980VapacREkhMR2-Y-YhgkNAqaR6ZyHBiFoTEJ6F_FAOS2REXF6Y8ccUF7R6Sg'
    },
    {
        id: 3,
        name: 'HIIT Circuit',
        duration: 50,
        capacity: 18,
        description: 'Circuitos dinámicos por intervalos de alta intensidad metabólica.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyUGoypimWzJIwc6qnHC5lwHfaWZwGTE1elGN7VpqtjDSQjM8dupED9_jMN2RnIWUFEEJmgnxjDK1j_RT7nHr2y_VroohgZFzGHbKIuJ_ThlcWEEYMdOnC5QfLaXKpX6ytHQvUapyUqq2U6u76CjUi_82kMznwNK4HE4ripXsuUgYYlLeEEF0zHS0zJbclriQ93KXWWJNhAQwID7IDgU4GFWbhP4UQtvPnVc9ZATAdxbhyj3ALvJVbrg'
    },
    {
        id: 4,
        name: 'Vinyasa Yoga',
        duration: 50,
        capacity: 14,
        description: 'Fluidez postural consciente y control respiratorio guiado.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIcYNQeYAUYurrzMAJB9Y_DfOUAyaAQfWYAI1Ec1A3AjmGG8-pP4NKcukujD5NoaIh_zH23IsEL-n2aT2VOlwkKvuA0TKGtdoEbo8ckyg_vqZsFKVGDyjlhKoDCClJb0DVS_9QslmcgeWg_aXsqZErbGVgJGqD3Hz1ROq957fY9LwtW0y1zsFehabsIJvm96NNJZMuVZ_MZ8Kz-m1RxVi62N6pzMj07uoV8yK4yufWeC4_9QzW95pjgw'
    },
    {
        id: 5,
        name: 'Pilates Reformer',
        duration: 50,
        capacity: 12,
        description: 'Precisión biomecánica sobre camas de muelles.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1bqNH9tL8RqMEgH0Y0nofwXOuMu3j-GbUP7A5KOG1-LxoTDI-Te_gESBbGleROmyES9AgAHLGrr-pQuUeMmhntqlb_Oo8YdcTFhpGUbsqCTktd4LfOc3lF23hv7Ii4ONML8yg2uzlHxTSCcVP1J2whvA3MSKGfFz5uGtJzCWA3PYUrSMZ2aY1qGVTjQCv7jbPbpzwvOMNisnaoT6MD3uwjBvWOhb4ECCbEq8M-sTnLgyAURrztLdiLQ'
    }
];

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

let activityToDeleteId = null;
let editingActivityId = null;

// 2. Renderizado dinámico de la tabla
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
          <img class="cell-activity-img" src="${act.imageUrl}" alt="${act.name}" />
          <div class="cell-activity-info">
            <span class="cell-activity-title">${act.name}</span>
            <span class="cell-activity-desc">${act.description}</span>
          </div>
        </div>
      </td>
      <td style="white-space: nowrap;">
        <span style="display: inline-flex; align-items: center; gap: 0.35rem; color: var(--color-text-main);">
          <span class="material-symbols-outlined" style="font-size: 16px; color: var(--color-secondary);">schedule</span>
          ${act.duration} min
        </span>
      </td>
      <td style="white-space: nowrap;">
        <strong style="color: var(--color-primary);">${act.capacity}</strong> plazas
      </td>
      <td class="text-right" style="white-space: nowrap;">
        <div class="cell-actions">
          <button class="btn-icon" type="button" aria-label="Editar" onclick="window.openEditModal(${act.id})">
            <span class="material-symbols-outlined" style="font-size: 18px;">edit</span>
          </button>
          <button class="btn-icon btn-icon-danger" type="button" aria-label="Eliminar" onclick="window.openDeleteModal(${act.id})">
            <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// 3. Control del Modal de Crear / Editar
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
        inputDesc.value = activity.description;

        dropzonePreview.classList.remove('hidden');
        previewFilename.textContent = `${activity.name.toLowerCase().replace(/\s+/g, '_')}_cover.jpg`;
    } else {
        editingActivityId = null;
        modalTitle.textContent = 'Añadir Tipo de Actividad';
        activityForm.reset();
        inputDuration.value = 50;
        inputCapacity.value = 16;
        dropzonePreview.classList.add('hidden');
    }

    activityModal.classList.remove('hidden');
}

function closeModal() {
    activityModal.classList.add('hidden');
    editingActivityId = null;
}

// 4. Control del Modal de Confirmación de Borrado
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
    if (target) openModal(true, target);
};

// 5. Event Listeners
btnOpenCreate?.addEventListener('click', () => openModal(false));
btnCloseModal?.addEventListener('click', closeModal);
btnCancelModal?.addEventListener('click', closeModal);

btnCloseDeleteModal?.addEventListener('click', closeDeleteModal);
btnCancelDelete?.addEventListener('click', closeDeleteModal);

btnConfirmDelete?.addEventListener('click', () => {
    if (activityToDeleteId !== null) {
        activities = activities.filter(a => a.id !== activityToDeleteId);
        renderActivities();
        closeDeleteModal();
    }
});

// Dropzone y selección de archivo
dropzoneBox?.addEventListener('click', () => fileInput?.click());
fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        previewFilename.textContent = file.name;
        dropzonePreview.classList.remove('hidden');
    }
});

// Guardar formulario (Crear o Actualizar)
activityForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('modal-act-name').value.trim();
    const duration = parseInt(document.getElementById('modal-act-duration').value, 10);
    const capacity = parseInt(document.getElementById('modal-act-capacity').value, 10);
    const description = document.getElementById('modal-act-desc').value.trim();

    if (editingActivityId) {
        const act = activities.find(a => a.id === editingActivityId);
        if (act) {
            act.name = name;
            act.duration = duration;
            act.capacity = capacity;
            act.description = description;
        }
    } else {
        activities.unshift({
            id: Date.now(),
            name,
            duration,
            capacity,
            description,
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCbKlWkvNFcFZV6Uq59uuc6qEAlkyNXUsSfkZFTCAQfMLwYYjeSKbdGb9J7uEdvHKsPkcKVTt0s7_PNSRylpoS22kKZgQl1x_IYKYfyi-pZrO0R-CoED3AVCNyJTiuk4wHtrB4qu9ybiG2NXjCKMpwTNRMFN0waoAYTXlwnuwTbuzs9hj0fTc538UOhH_lTF45zBu4mbNUeS4teVRlTf_uedIzOowaLT3WqO42BFUoZAH8pMw2js_osw'
        });
    }

    renderActivities();
    closeModal();
});

// Cerrar con Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeDeleteModal();
    }
});

// Inicializar tabla al cargar
renderActivities();