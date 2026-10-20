
const MODAL_ID = 'pulse-notification-modal';

const TYPES = {
    error: {
        title: 'Ha ocurrido un error',
        icon: 'error_outline'
    },
    success: {
        title: 'Operación completada',
        icon: 'check_circle'
    },
    warning: {
        title: 'Atención',
        icon: 'warning_amber'
    },
    info: {
        title: 'Información',
        icon: 'info'
    }
};



function createModal() {
    let modal = document.getElementById(MODAL_ID);

    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'modal-backdrop hidden';
    modal.setAttribute('role', 'alertdialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'notification-title');
    modal.setAttribute('aria-describedby', 'notification-message');

    modal.innerHTML = `
        <div class="modal-card modal-card-sm">
            <header class="modal-header">
                <div class="modal-title-with-icon">
                    <div class="icon-badge-danger" id="notification-icon" aria-hidden="true">
                        <span class="material-symbols-outlined">error</span>
                    </div>
                    <h3 id="notification-title" class="modal-title">
                        Notificación
                    </h3>
                </div>

                <button
                    id="notification-close"
                    class="btn-icon"
                    type="button"
                    aria-label="Cerrar notificación"
                >
                    <span class="material-symbols-outlined" aria-hidden="true">
                        close
                    </span>
                </button>
            </header>

            <div class="modal-body-content">
                <p id="notification-message" class="modal-body-text"></p>
            </div>

            <footer class="modal-footer">
                <button
                    id="notification-accept"
                    class="btn btn-primary"
                    type="button"
                >
                    Aceptar
                </button>
            </footer>
        </div>
    `;

    document.body.appendChild(modal);

    const close = () => {
        modal.classList.add('hidden');
    };

    modal.querySelector('#notification-close')
        .addEventListener('click', close);

    modal.querySelector('#notification-accept')
        .addEventListener('click', close);

    modal.addEventListener('click', event => {
        if (event.target === modal) close();
    });

    modal._closeNotification = close;

    return modal;
}



function show(type, message, customTitle) {
    const config = TYPES[type] || TYPES.info;
    const modal = createModal();

    modal.querySelector('#notification-title').textContent =
        customTitle || config.title;

    modal.querySelector('#notification-message').textContent =
        String(message ?? '');

    const iconContainer = modal.querySelector('#notification-icon');

    const icon = iconContainer.querySelector('.material-symbols-outlined');
    icon.textContent = config.icon;

    // Adaptar el color del icono al tipo de notificación.
    iconContainer.className = `icon-badge-${type}`;

    modal.classList.remove('hidden');

    modal.querySelector('#notification-accept').focus();
}


export const modalService = {
    show,
    error: (message, title) => show('error', message, title),
    success: (message, title) => show('exito en la operación', message, title),
    warning: (message, title) => show('warning', message, title),
    info: (message, title) => show('info', message, title)
};
