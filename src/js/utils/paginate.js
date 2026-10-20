export const PAGE_SIZE = 50;

export function paginate(items, page = 1, pageSize = PAGE_SIZE) {
    const list = Array.isArray(items) ? items : [];
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const start = (currentPage - 1) * pageSize;

    return {
        items: list.slice(start, start + pageSize),
        page: currentPage,
        pageSize,
        total,
        totalPages,
        hasPrev: currentPage > 1,
        hasNext: currentPage < totalPages
    };
}

export function renderPagination(container, state, onChange) {
    if (!container) return;

    if (!state || state.total <= state.pageSize) {
        container.innerHTML = '';
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    container.innerHTML = `
        <span class="table-pagination-info">
            Página ${state.page} de ${state.totalPages} · ${state.total} registros
        </span>
        <div class="table-pagination-actions">
            <button class="table-pagination-btn" type="button" data-page="prev" ${state.hasPrev ? '' : 'disabled'} aria-label="Página anterior">
                <span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>
            </button>
            <button class="table-pagination-btn" type="button" data-page="next" ${state.hasNext ? '' : 'disabled'} aria-label="Página siguiente">
                <span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>
            </button>
        </div>
    `;

    container.querySelector('[data-page="prev"]')?.addEventListener('click', () => {
        if (state.hasPrev) onChange(state.page - 1);
    });
    container.querySelector('[data-page="next"]')?.addEventListener('click', () => {
        if (state.hasNext) onChange(state.page + 1);
    });
}
