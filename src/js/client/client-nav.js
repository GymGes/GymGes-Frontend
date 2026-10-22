/**
 * src/js/client/client-nav.js
 * Controlador del menú de navegación móvil (drawer)
 */

export function initClientNav() {
    const drawer = document.getElementById('client-mobile-drawer');
    const backdrop = document.getElementById('client-nav-backdrop');
    const btnOpen = document.getElementById('btn-open-client-nav');
    const btnClose = document.getElementById('btn-close-client-nav');

    if (!drawer || !backdrop || !btnOpen) {
        return;
    }

    function openNav() {
        drawer.classList.add('is-open');
        backdrop.classList.add('is-active');
        btnOpen.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        drawer.classList.remove('is-open');
        backdrop.classList.remove('is-active');
        btnOpen.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    btnOpen.addEventListener('click', openNav);

    if (btnClose) {
        btnClose.addEventListener('click', closeNav);
    }

    backdrop.addEventListener('click', closeNav);

    // Cierre accesible mediante la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
            closeNav();
        }
    });

    // Cerrar automáticamente si la pantalla se redimensiona a escritorio
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768 && drawer.classList.contains('is-open')) {
            closeNav();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClientNav);
} else {
    initClientNav();
}