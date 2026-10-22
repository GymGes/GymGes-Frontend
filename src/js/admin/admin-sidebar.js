/**
 * src/js/admin/admin-sidebar.js
 * Controlador para el menú lateral responsive (Drawer)
 */

export function initAdminSidebar() {
    const sidebar = document.getElementById("admin-sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    const btnOpen = document.getElementById("btn-open-sidebar");
    const btnClose = document.getElementById("btn-close-sidebar");

    if (!sidebar || !backdrop || !btnOpen) {
        return;
    }

    function openSidebar() {
        sidebar.classList.add("is-open");
        backdrop.classList.add("is-active");
        btnOpen.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
    }

    function closeSidebar() {
        sidebar.classList.remove("is-open");
        backdrop.classList.remove("is-active");
        btnOpen.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
    }

    btnOpen.addEventListener("click", openSidebar);

    if (btnClose) {
        btnClose.addEventListener("click", closeSidebar);
    }

    backdrop.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && sidebar.classList.contains("is-open")) {
            closeSidebar();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 992 && sidebar.classList.contains("is-open")) {
            closeSidebar();
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdminSidebar);
} else {
    initAdminSidebar();
}