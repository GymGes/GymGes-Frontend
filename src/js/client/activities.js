import { activityService } from '../services/activityService.js';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop';

const gridContainer = document.getElementById('activities-grid');

function renderCard(activity) {
    const name = activity.name || activity.nombre || 'Actividad';
    const description = activity.description || activity.descripcion || 'Sesión guiada en grupos reducidos con atención técnica personalizada.';
    const duration = activity.duration || activity.duracion || 50;
    
    const maxStudents = activity.capacity || activity.max_students || 16;
    
    const imgSrc = activity.imageUrl || activity.image_url || DEFAULT_IMAGE;

    return `
        <article class="activity-card">
            <figure class="card-media">
                <img class="card-img" src="${imgSrc}" alt="${name}" loading="lazy" />
                <span class="card-badge">Máx. ${maxStudents} personas</span>
            </figure>
            <div class="card-meta">
                <span class="card-duration">
                    <span class="material-symbols-outlined" aria-hidden="true">schedule</span> ${duration} min
                </span>
            </div>
            <h2 class="card-title">${name}</h2>
            <p class="card-desc">${description}</p>
        </article>
    `;
}

async function loadActivities() {
    if (!gridContainer) return;

    try {
        const activities = await activityService.getActivities();

        if (!Array.isArray(activities) || activities.length === 0) {
            gridContainer.innerHTML = `
                <p class="schedule-state" style="grid-column: 1 / -1;">
                    No hay disciplinas disponibles en este momento.
                </p>
            `;
            return;
        }

        gridContainer.innerHTML = activities.map(renderCard).join('');
    } catch (error) {
        console.error('Error al cargar catálogo de actividades:', error);
        gridContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--color-error);">
                <p style="font-weight: 600;">No se pudo conectar con el catálogo de disciplinas.</p>
                <p style="font-size: 0.8125rem; margin-top: 0.35rem; color: var(--color-text-muted);">
                    Verifica la conexión con el servidor e inténtalo de nuevo.
                </p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', loadActivities);