import { api } from '../api/axiosClient.js';

const ACTIVITY_PLACEHOLDER = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCbKlWkvNFcFZV6Uq59uuc6qEAlkyNXUsSfkZFTCAQfMLwYYjeSKbdGb9J7uEdvHKsPkcKVTt0s7_PNSRylpoS22kKZgQl1x_IYKYfyi-pZrO0R-CoED3AVCNyJTiuk4wHtrB4qu9ybiG2NXjCKMpwTNRMFN0waoAYTXlwnuwTbuzs9hj0fTc538UOhH_lTF45zBu4mbNUeS4teVRlTf_uedIzOowaLT3WqO42BFUoZAH8pMw2js_osw';

function fromApi(activity) {
    return {
        id: activity.id,
        name: activity.name,
        duration: activity.duration,
        capacity: activity.max_students,
        description: activity.description,
        imageUrl: activity.image_url || ACTIVITY_PLACEHOLDER
    };
}

function toApi(activityData) {
    const formData = new FormData();
    formData.append('name', activityData.name);
    formData.append('duration', activityData.duration);
    formData.append('max_students', activityData.capacity);
    formData.append('description', activityData.description ?? '');
    if (activityData.image) {
        formData.append('image', activityData.image);
    }
    return formData;
}

export const activityService = {
    async getActivities() {
        const activities = await api.get('/activity-types/');
        return activities.map(fromApi);
    },


    async createActivity(activityData) {
        const created = await api.post('/activity-types/', toApi(activityData));
        return fromApi(created);
    },


    async updateActivity(id, activityData) {
        const updated = await api.put(`/activity-types/${id}`, toApi(activityData));
        return fromApi(updated);
    },


    async deleteActivity(id) {
        return await api.delete(`/activity-types/${id}`);
    }
};
