import { normalizeApiError } from "./normalizeApiError.js";
import { API_BASE_URL } from "../config/endpointsConfig.js";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.response.use(
  (res) => (res.status === 204 ? true : res.data),
  (error) => Promise.reject(normalizeApiError(error))
);
