import { memberService } from './../services/memberService.js';

const COOKIE_NAME = 'pulse_member_dni';
const COOKIE_MAX_AGE = 60 * 60 * 8;

function createAccessModal() {
  if (document.getElementById('member-access-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'member-access-modal';
  modal.className = 'modal-backdrop hidden';

  modal.innerHTML = `
    <section
      class="modal-card modal-card-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-access-title"
    >
      <header class="modal-header">
        <div class="modal-header-info">
          <h2 id="member-access-title" class="modal-title">
            Acceso Socio
          </h2>

          <p id="member-access-subtitle" class="modal-subtitle">
            Introduce tu DNI para acceder a tu espacio personal.
          </p>
        </div>

        <button
          type="button"
          id="member-access-close"
          class="btn-icon"
          aria-label="Cerrar"
        >
          <span class="material-symbols-outlined">close</span>
        </button>
      </header>

      <form id="member-access-form">
        <div class="form-group">
          <label class="form-label" for="member-access-dni">
            DNI <span class="required">*</span>
          </label>

          <input
            class="form-input"
            id="member-access-dni"
            name="dni"
            type="text"
            placeholder="12345678A"
            autocomplete="username"
            maxlength="9"
            required
          />
        </div>

        <p
          id="member-access-error"
          class="hidden"
          role="alert"
          style="color: var(--color-error); margin-top: 0.75rem;"
        ></p>

        <footer class="modal-footer">
          <button
            type="button"
            id="member-access-cancel"
            class="btn-pill btn-pill-navy"
          >
            Cancelar
          </button>

          <button
            type="submit"
            id="member-access-submit"
            class="btn-pill btn-pill-gold"
          >
            Entrar
          </button>
        </footer>
      </form>
    </section>
  `;

  document.body.appendChild(modal);
}

function getCookie(name) {
  const prefix = `${name}=`;

  const item = document.cookie
    .split('; ')
    .find(cookie => cookie.startsWith(prefix));

  return item
    ? decodeURIComponent(item.slice(prefix.length))
    : null;
}

function saveCookie(dni) {
  document.cookie =
    `${COOKIE_NAME}=${encodeURIComponent(dni)}; ` +
    `Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function deleteCookie() {
  document.cookie =
    `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function setPrivateLinksVisibility(isAuthenticated) {
  const privateLinks = document.querySelectorAll(
    '.nav-link[href*="calendar.html"], .nav-link[href*="user.html"]'
  );

  privateLinks.forEach(link => {
    link.classList.toggle('hidden', !isAuthenticated);
  });
}

function initClientAccess() {
  createAccessModal();

  const modal = document.getElementById('member-access-modal');
  const form = document.getElementById('member-access-form');
  const dniInput = document.getElementById('member-access-dni');
  const errorElement = document.getElementById('member-access-error');
  const submitButton = document.getElementById('member-access-submit');
  const closeButton = document.getElementById('member-access-close');
  const cancelButton = document.getElementById('member-access-cancel');
  const calendarButton = document.getElementById('calendar-button');

  function openModal() {
    errorElement.textContent = '';
    errorElement.classList.add('hidden');

    form.reset();
    modal.classList.remove('hidden');
    dniInput.focus();
  }

  function closeModal() {
    modal.classList.add('hidden');
  }

  function showError(message) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
  }

  const accessButton = document.getElementById('btn-member-access');

  accessButton?.addEventListener('click', event => {
    event.preventDefault();
    const dni = getCookie(COOKIE_NAME);

    if (dni) {
      const isHomePage =
        location.pathname.endsWith('/index.html') ||
        location.pathname === '/' ||
        location.pathname.endsWith('/');

      if (isHomePage) {
        location.href = 'pages/user.html';
      } else if (location.pathname.endsWith('/user.html')) {
        location.reload();
      } else {
        location.href = 'user.html';
      }

      return;
    }

    document.getElementById('member-access-subtitle').textContent = 'Introduce tu DNI para acceder a tu espacio personal.';
    openModal();
  });

  closeButton.addEventListener('click', closeModal);
  cancelButton.addEventListener('click', closeModal);

  modal.addEventListener('click', event => {
    if (event.target === modal) {
      closeModal();
    }
  });

  if (calendarButton) {
    calendarButton.addEventListener('click', event => {
      const dni = getCookie(COOKIE_NAME);
      if (!dni) {
        event.preventDefault();
        document.getElementById('member-access-subtitle').textContent = 'Para consultar el horario, debes iniciar sesión.';
        openModal();
      }
    });
  }

  document.addEventListener('keydown', event => {
    if (
      event.key === 'Escape' &&
      !modal.classList.contains('hidden')
    ) {
      closeModal();
    }
  });

  // Validar el DNI al enviar el formulario
  form.addEventListener('submit', async event => {
    event.preventDefault();

    const dni = dniInput.value.trim().toUpperCase();

    if (!dni) {
      showError('Introduce tu DNI.');
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Validando...';
    errorElement.textContent = '';
    errorElement.classList.add('hidden');

    try {
      const member = await memberService.getMemberByCode(dni);

      if (!member) {
        showError('No existe ningún socio con ese DNI.');
        return;
      }

      const memberCode = String(
        member.codigo ?? member.code ?? ''
      ).trim().toUpperCase();

      if (memberCode !== dni) {
        showError('No se ha podido validar el socio.');
        return;
      }

      saveCookie(dni);
      setPrivateLinksVisibility(true);
      closeModal();

      const isHomePage =
        location.pathname.endsWith('/index.html') ||
        location.pathname === '/' ||
        location.pathname.endsWith('/');

      if (isHomePage) {
        location.href = 'pages/user.html';
      } else if (location.pathname.endsWith('/user.html')) {
        location.reload();
      }
    } catch (error) {
      if (
        error?.type === 'not_found' ||
        error?.status === 404
      ) {
        showError('No existe ningún socio con ese DNI.');
      } else {
        showError(
          error?.message ||
          'No se ha podido validar el acceso al socio.'
        );
      }
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Entrar';
    }
  });

  setPrivateLinksVisibility(Boolean(getCookie(COOKIE_NAME)));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initClientAccess);
} else {
  initClientAccess();
}

export {
  getCookie,
  saveCookie,
  deleteCookie,
  setPrivateLinksVisibility
};