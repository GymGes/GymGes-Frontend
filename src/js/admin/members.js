/* src/js/admin/members.js */
import { memberService } from '../services/memberService.js';
import { planService } from '../services/planService.js';

// Estado local
let members = [];
let plans = [];
let memberToDeleteCode = null;
let editingMemberCode = null;
let displayedMembers = null;

// Elementos del DOM
const tableBody = document.getElementById('members-table-body');
const memberSearchForm = document.getElementById('member-search-form');
const memberSearchCodeInput = document.getElementById('member-search-code');
const btnShowAllMembers = document.getElementById('btn-show-all-members');
const memberSearchFeedback = document.getElementById('member-search-feedback');
const memberModal = document.getElementById('member-modal');
const deleteModal = document.getElementById('delete-member-modal');
const memberForm = document.getElementById('member-form');

const modalTitle = document.getElementById('modal-member-title');
const inputCode = document.getElementById('modal-member-code');
const inputName = document.getElementById('modal-member-name');
const inputSurname = document.getElementById('modal-member-surname');
const selectPlan = document.getElementById('modal-member-plan');
const inputCredits = document.getElementById('modal-member-credits');
const inputAge = document.getElementById('modal-member-age');
const inputCity = document.getElementById('modal-member-city');
const inputAddress = document.getElementById('modal-member-address');

const btnOpenCreate = document.getElementById('btn-open-create-member');
const btnCloseModal = document.getElementById('btn-close-member-modal');
const btnCancelModal = document.getElementById('btn-cancel-member-modal');

const deleteMemberName = document.getElementById('delete-member-name');
const btnCloseDeleteModal = document.getElementById('btn-close-delete-member-modal');
const btnCancelDelete = document.getElementById('btn-cancel-delete-member');
const btnConfirmDelete = document.getElementById('btn-confirm-delete-member');

// 1. Cargar planes disponibles y rellenar el <select>
async function loadPlansOptions() {
    plans = await planService.getPlans();
    if (selectPlan && plans.length > 0) {
        selectPlan.innerHTML = plans.map(p => `
        <option value="${p.id}" data-credits="${p.credits}">
        ${p.name} (${p.credits} Créditos)
        </option>
    `).join('');
    }
    }

// Al cambiar de plan en el formulario de alta, auto-completar los créditos sugeridos
selectPlan?.addEventListener('change', () => {
    if (!editingMemberCode) {
        const selectedOption = selectPlan.options[selectPlan.selectedIndex];
        const defaultCredits = selectedOption?.getAttribute('data-credits');
        if (defaultCredits && inputCredits) {
            inputCredits.value = defaultCredits;
        }
    }
});

// 2. Cargar socios iniciales
async function loadMembers() {
    if (tableBody) {
        tableBody.innerHTML = `
        <tr id="table-loading-row">
        <td colspan="7" class="text-center table-state-row">
            Cargando registro de socios...
        </td>
        </tr>
    `;
    }
    await loadPlansOptions();
    members = await memberService.getMembers();
    renderMembers();
    }

// 3. Renderizado de la tabla de socios
function renderMembers(membersToRender = displayedMembers ?? members) {
    if (!tableBody) return;

    if (membersToRender.length === 0) {
    const emptyMessage = displayedMembers !== null
        ? 'No se ha encontrado ningún socio para ese código.'
        : 'No hay socios dados de alta en el sistema.';

    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center table-state-row">
                ${emptyMessage}
            </td>
        </tr>
    `;
    return;
}

    tableBody.innerHTML = membersToRender.map(member => {
        const plan = plans.find(p => p.id === member.plan_id);
        const planName = plan ? plan.name : 'Plan General';

        return `
        <tr id="member-row-${member.codigo}">
        <td style="white-space: nowrap;">
            <span class="badge-code">${member.codigo}</span>
        </td>
        <td style="white-space: nowrap;">
            <span style="font-weight: 600; color: var(--color-primary);">${member.nombre} ${member.apellido}</span>
        </td>
        <td style="white-space: nowrap;">
            <span>${member.edad} años</span>
        </td>
        <td style="white-space: nowrap;">
            <span style="font-weight: 600; color: var(--color-primary); display: block;">${planName}</span>
            <span class="badge-credits">
            <span class="material-symbols-outlined" style="font-size: 14px;">token</span>
            ${member.creditos_restantes} créditos
            </span>
        </td>
        <td style="white-space: nowrap;">
            <span>${member.ciudad}</span>
        </td>
        <td style="white-space: nowrap;">
            <span class="cell-subtext" style="max-width: 14rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 0;">
            ${member.direccion}
            </span>
        </td>
        <td class="text-right" style="white-space: nowrap;">
            <div class="cell-actions">
            <button class="btn-icon" type="button" aria-label="Editar" onclick="window.openEditMemberModal('${member.codigo}')">
                <span class="material-symbols-outlined" style="font-size: 18px;">edit</span>
            </button>
            <button class="btn-icon btn-icon-danger" type="button" aria-label="Eliminar" onclick="window.openDeleteMemberModal('${member.codigo}')">
                <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
            </button>
            </div>
        </td>
        </tr>
    `;
    }).join('');
}

// 4. Modales (Crear / Editar)
function openModal(isEdit = false, member = null) {
    if (isEdit && member) {
        editingMemberCode = member.codigo;
        modalTitle.textContent = 'Editar Ficha de Socio';

        inputCode.value = member.codigo;
        inputCode.readOnly = true;
        inputCode.style.opacity = '0.65';
        inputCode.style.cursor = 'not-allowed';

        inputName.value = member.nombre;
        inputSurname.value = member.apellido;
        selectPlan.value = member.plan_id;
        inputCredits.value = member.creditos_restantes;
        inputAge.value = member.edad;
        inputCity.value = member.ciudad;
        inputAddress.value = member.direccion;
    } else {
        editingMemberCode = null;
        modalTitle.textContent = 'Añadir Socio';
        memberForm.reset();

        inputCode.readOnly = false;
        inputCode.style.opacity = '1';
        inputCode.style.cursor = 'text';

        inputAge.value = 30;
        if (selectPlan.options.length > 0) {
            selectPlan.selectedIndex = 0;
            inputCredits.value = selectPlan.options[0].getAttribute('data-credits') || 8;
        }
    }

    memberModal.classList.remove('hidden');
    if (!isEdit) inputCode.focus();
}

function closeModal() {
    memberModal.classList.add('hidden');
    editingMemberCode = null;
}

// Funciones globales para invocar desde los botones de fila
window.openEditMemberModal = function (codigo) {
    const member = members.find(m => m.codigo === codigo);
    if (member) openModal(true, member);
};

window.openDeleteMemberModal = function (codigo) {
    const member = members.find(m => m.codigo === codigo);
    if (!member) return;

    memberToDeleteCode = codigo;
    deleteMemberName.textContent = `${member.nombre} ${member.apellido} (${member.codigo})`;
    deleteModal.classList.remove('hidden');
};

function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    memberToDeleteCode = null;
}

memberSearchForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const code = memberSearchCodeInput.value.trim().toUpperCase();
    memberSearchFeedback.textContent = '';

    if (!code) {
        memberSearchFeedback.textContent = 'Introduce el código del socio.';
        return;
    }

    if (code.length !== 9) {
        memberSearchFeedback.textContent =
            'El código del socio debe tener 9 caracteres.';
        return;
    }

    memberSearchFeedback.textContent = 'Buscando socio...';

    try {
        const member = await memberService.getMemberByCode(code);

        const existingIndex = members.findIndex(
            currentMember => currentMember.codigo === member.codigo
        );

        if (existingIndex !== -1) {
            members[existingIndex] = member;
        } else {
            members.push(member);
        }

        displayedMembers = [member];
        renderMembers();

        memberSearchFeedback.textContent =
            `Socio encontrado: ${member.nombre} ${member.apellido}.`;
    } catch (error) {
        if (error?.type === 'not_found') {
            displayedMembers = [];
            renderMembers();

            memberSearchFeedback.textContent =
                'No se ha encontrado ningún socio con ese código.';
        } else {
            memberSearchFeedback.textContent =
                error?.message || 'No se pudo realizar la búsqueda.';
        }
    }
});

btnShowAllMembers?.addEventListener('click', async () => {
    memberSearchCodeInput.value = '';
    displayedMembers = null;
    memberSearchFeedback.textContent = 'Cargando listado de socios...';

    try {
        members = await memberService.getMembers();
        renderMembers();
        memberSearchFeedback.textContent = 'Mostrando todos los socios.';
    } catch (error) {
        memberSearchFeedback.textContent =
            error?.message || 'No se pudo cargar el listado de socios.';
    }
});

// 5. Asignación de eventos
btnOpenCreate?.addEventListener('click', () => openModal(false));
btnCloseModal?.addEventListener('click', closeModal);
btnCancelModal?.addEventListener('click', closeModal);

btnCloseDeleteModal?.addEventListener('click', closeDeleteModal);
btnCancelDelete?.addEventListener('click', closeDeleteModal);

btnConfirmDelete?.addEventListener('click', async () => {
    if (memberToDeleteCode) {
        await memberService.deleteMember(memberToDeleteCode);
        members = members.filter(m => m.codigo !== memberToDeleteCode);
        displayedMembers = null;
        renderMembers();
        closeDeleteModal();
    }
});

// Guardar socio (Crear o Actualizar)
memberForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const memberData = {
        codigo: inputCode.value.trim().toUpperCase(),
        nombre: inputName.value.trim(),
        apellido: inputSurname.value.trim(),
        edad: parseInt(inputAge.value, 10),
        ciudad: inputCity.value.trim(),
        direccion: inputAddress.value.trim(),
        plan_id: parseInt(selectPlan.value, 10),
        creditos_restantes: parseInt(inputCredits.value, 10)
    };

    if (editingMemberCode) {
        const updated = await memberService.updateMember(editingMemberCode, memberData);
        const index = members.findIndex(m => m.codigo === editingMemberCode);
        if (index !== -1) members[index] = updated;
    } else {
        // Validar duplicado de código/DNI en mock local
        const exists = members.some(m => m.codigo === memberData.codigo);
        if (exists) {
            alert(`Ya existe un socio registrado con el código / DNI: ${memberData.codigo}`);
            return;
        }
        const created = await memberService.createMember(memberData);
        members.unshift(created);
    }

    displayedMembers = null;
    renderMembers();
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
loadMembers();