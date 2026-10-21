import { planService } from '../services/planService.js';
import { modalService } from '../services/modalService.js';

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

function getErrorMessage(error, fallback) {
    return (
        error?.response?.data?.detail ||
        error?.message ||
        fallback
    );
}

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

    try {
        plans = await planService.getPlans();
        renderPlans();
    } catch (error) {
        console.error('Error al cargar los planes:', error);

        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center table-state-row">
                        No se ha podido cargar el catálogo de planes.
                    </td>
                </tr>
            `;
        }

        modalService.error(
            getErrorMessage(
                error,
                'No se ha podido cargar el catálogo de planes.'
            )
        );
    }
}

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
                <span style="font-weight: 600; color: var(--color-primary);">
                    ${plan.name}
                </span>
            </td>

            <td style="white-space: nowrap;">
                <span
                    class="badge-day"
                    style="background-color: rgba(33, 100, 140, 0.12); color: var(--color-secondary);"
                >
                    <span
                        class="material-symbols-outlined"
                        style="font-size: 14px; margin-right: 4px;"
                    >token</span>
                    ${plan.credits} créditos
                </span>
            </td>

            <td class="text-right" style="white-space: nowrap;">
                <div class="cell-actions">
                    <button
                        class="btn-icon"
                        type="button"
                        aria-label="Editar"
                        onclick="window.openEditPlanModal(${plan.id})"
                    >
                        <span class="material-symbols-outlined" style="font-size: 18px;">
                            edit
                        </span>
                    </button>

                    <button
                        class="btn-icon btn-icon-danger"
                        type="button"
                        aria-label="Eliminar"
                        onclick="window.openDeletePlanModal(${plan.id})"
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

function openModal(isEdit = false, plan = null) {
    if (!planModal || !planForm) return;

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
    planModal?.classList.add('hidden');
    editingPlanId = null;
}

window.openEditPlanModal = function (id) {
    const plan = plans.find(p => p.id === id);

    if (plan) {
        openModal(true, plan);
    }
};

window.openDeletePlanModal = function (id) {
    const plan = plans.find(p => p.id === id);

    if (!plan) return;

    planToDeleteId = id;
    deletePlanName.textContent = plan.name;
    deleteModal.classList.remove('hidden');
};

function closeDeleteModal() {
    deleteModal?.classList.add('hidden');
    planToDeleteId = null;
}

// Event Listeners
btnOpenCreate?.addEventListener('click', () => openModal(false));
btnCloseModal?.addEventListener('click', closeModal);
btnCancelModal?.addEventListener('click', closeModal);
btnCloseDeleteModal?.addEventListener('click', closeDeleteModal);
btnCancelDelete?.addEventListener('click', closeDeleteModal);

//Eliminar plan
btnConfirmDelete?.addEventListener('click', async () => {
    if (planToDeleteId === null) return;

    const idToDelete = planToDeleteId;
    btnConfirmDelete.disabled = true;

    try {
        await planService.deletePlan(idToDelete);

        plans = plans.filter(p => p.id !== idToDelete);

        renderPlans();
        closeDeleteModal();

        modalService.success(
            'El plan se ha eliminado correctamente.'
        );
    } catch (error) {
        console.error('Error al eliminar el plan:', error);

        modalService.error(
            getErrorMessage(
                error,
                'No se ha podido eliminar el plan.'
            )
        );
    } finally {
        btnConfirmDelete.disabled = false;
    }
});

//Guardar plan (Crear o Actualizar)
planForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameVal = inputPlanName.value.trim();
    const creditsVal = Number(inputPlanCredits.value);

    if (!nameVal) {
        modalService.warning(
            'Introduce el nombre del plan.'
        );
        inputPlanName.focus();
        return;
    }

    if (
        inputPlanCredits.value.trim() === '' ||
        !Number.isInteger(creditsVal) ||
        creditsVal < 0
    ) {
        modalService.warning(
            'Introduce una cantidad válida de créditos.'
        );
        inputPlanCredits.focus();
        return;
    }

    const planData = {
        name: nameVal,
        credits: creditsVal
    };

    const isEditing = editingPlanId !== null;
    const planId = editingPlanId;

    const submitButton = planForm.querySelector(
        'button[type="submit"]'
    );

    if (submitButton) submitButton.disabled = true;

    try {
        if (isEditing) {
            const updated = await planService.updatePlan(
                planId,
                planData
            );

            const index = plans.findIndex(p => p.id === planId);

            if (index !== -1) {
                plans[index] = updated;
            }

            modalService.success(
                'El plan se ha actualizado correctamente.'
            );
        } else {
            const created = await planService.createPlan(planData);

            plans.push(created);

            modalService.success(
                'El plan se ha creado correctamente.'
            );
        }

        renderPlans();
        closeModal();
    } catch (error) {
        console.error('Error al guardar el plan:', error);

        modalService.error(
            getErrorMessage(
                error,
                isEditing
                    ? 'No se ha podido actualizar el plan.'
                    : 'No se ha podido crear el plan.'
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

loadPlans();
