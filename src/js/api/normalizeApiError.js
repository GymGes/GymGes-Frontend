export function extractValidationFields(detail) {
  if (!Array.isArray(detail)) return [];
  return detail.map((e) => ({
    field: e.loc.filter((seg) => typeof seg === "string").join("."),
    msg: e.msg,
  }));
}

export function normalizeApiError(error) {
  if (!error || !error.response) {
    return { type: "network", message: "No se pudo conectar al servidor. ¿Está el backend corriendo en el puerto 8000?" };
  }
  const { status, data } = error.response;
  if (status === 404) return { type: "not_found", message: "El recurso solicitado no existe." };
  if (status === 422) return { type: "validation", message: "Datos inválidos.", fields: extractValidationFields(data?.detail) };
  if (status === 500) return { type: "server", message: "Error interno del servidor." };
  return { type: "http", message: `Error HTTP ${status}.` };
}
