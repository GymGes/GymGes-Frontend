/* src/js/admin/plans.js */
import { planService } from '../services/planService.js';

// Estado local
let plans = [];
let planToDeleteId = null;
let editingPlanId = null;

// Elementos del DOM
const tableBody = document.getElementById('plans-table-body');
const planModal = document.getElementById('plan-modal');
const deleteModal = document.getElementById('delete-plan-modal');
const planForm = document.getElementById('plan-form');

const modalTitle = document.getElementById('modal-plan-title');
const inputPlanId = document.getElementById('modal-plan-id');
const inputPlanName = document.getElementById('modal-plan-name');
const inputPlanCredits = document.getElementById('modal-plan-credits');

const btnOpenCreate = document.getElementById('btn-open-create-plan');
const btnCloseModal = document.getElementById('btn-close-plan-modal');
const btnCancelModal = document.getElementById('btn-cancel-plan-modal');

const deletePlanName = document.getElementById('delete-plan-name');
const btnCloseDeleteModal = document.getElementById('btn-close-delete-plan-modal');
const btnCancelDelete = document.getElementById('btn-cancel-delete-plan');
const btnConfirmDelete = document.getElementById('btn-confirm-delete-plan');

// 1. Cargar datos del servicio
async function loadPlans() {
    if (tableBody) {
        tableBody.innerHTML = `
        <tr id="table-loading-row">
        <td colspan="4" class="text-center table-state-row">
            Cargando catálogo de planes...
        </td>
        </tr>
    `;
    }
    plans = await planService.getPlans();
    renderPlans();
    }

// 2. Renderizar la tabla de planes
function renderPlans() {
    if (!tableBody) return;

    if (plans.length === 0) {
        tableBody.innerHTML = `
        <tr>
        <td colspan="4" class="text-center table-state-row">
            No hay planes configurados en el sistema.
        </td>
        </tr>
    `;
        return;
    }

    tableBody.innerHTML = plans.map(plan => `
    <tr id="plan-row-${plan.id}">
        <td style="white-space: nowrap;">
        <span class="cell-id">#${plan.id}</span>
        </td>
        <td style="white-space: nowrap;">
        <span style="font-weight: 600; color: var(--color-primary);">${plan.name}</span>
        </td>
        <td style="white-space: nowrap;">
        <span class="badge-day" style="background-color: rgba(33, 100, 140, 0.12); color: var(--color-secondary);">
            <span class="material-symbols-outlined" style="font-size: 14px; margin-right: 4px;">token</span>
            ${plan.credits} créditos
        </span>
        </td>
        <td class="text-right" style="white-space: nowrap;">
        <div class="cell-actions">
            <button class="btn-icon" type="button" aria-label="Editar" onclick="window.openEditPlanModal(${plan.id})">
            <span class="material-symbols-outlined" style="font-size: 18px;">edit</span>
            </button>
            <button class="btn-icon btn-icon-danger" type="button" aria-label="Eliminar" onclick="window.openDeletePlanModal(${plan.id})">
            <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
            </button>
        </div>
        </td>
    </tr>
    `).join('');
}

// 3. Modales (Crear / Editar)
function openModal(isEdit = false, plan = null) {
    if (isEdit && plan) {
        editingPlanId = plan.id;
        modalTitle.textContent = 'Editar Plan';
        inputPlanId.value = plan.id;
        inputPlanName.value = plan.name;
        inputPlanCredits.value = plan.credits;
    } else {
        editingPlanId = null;
        modalTitle.textContent = 'Añadir Plan';
        planForm.reset();
        inputPlanId.value = '';
        inputPlanCredits.value = '8';
    }

    planModal.classList.remove('hidden');
    inputPlanName.focus();
}

function closeModal() {
    planModal.classList.add('hidden');
    editingPlanId = null;
}

// Funciones globales para invocar desde los botones de la tabla
window.openEditPlanModal = function (id) {
    const plan = plans.find(p => p.id === id);
    if (plan) openModal(true, plan);
};

window.openDeletePlanModal = function (id) {
    const plan = plans.find(p => p.id === id);
    if (!plan) return;

    planToDeleteId = id;
    deletePlanName.textContent = plan.name;
    deleteModal.classList.remove('hidden');
};

function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    planToDeleteId = null;
}

// 4. Asignación de eventos
btnOpenCreate?.addEventListener('click', () => openModal(false));
btnCloseModal?.addEventListener('click', closeModal);
btnCancelModal?.addEventListener('click', closeModal);

btnCloseDeleteModal?.addEventListener('click', closeDeleteModal);
btnCancelDelete?.addEventListener('click', closeDeleteModal);

btnConfirmDelete?.addEventListener('click', async () => {
    if (planToDeleteId !== null) {
        await planService.deletePlan(planToDeleteId);
        plans = plans.filter(p => p.id !== planToDeleteId);
        renderPlans();
        closeDeleteModal();
    }
});

// Guardar plan (Crear o Actualizar)
planForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameVal = inputPlanName.value.trim();
    const creditsVal = parseInt(inputPlanCredits.value, 10);

    if (!nameVal || isNaN(creditsVal)) return;

    const planData = {
        name: nameVal,
        credits: creditsVal
    };

    if (editingPlanId) {
        const updated = await planService.updatePlan(editingPlanId, planData);
        const index = plans.findIndex(p => p.id === editingPlanId);
        if (index !== -1) plans[index] = updated;
    } else {
        const created = await planService.createPlan(planData);
        plans.push(created);
    }

    renderPlans();
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
loadPlans();