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
  const detail = typeof data?.detail === "string" ? data.detail : null;
  if (status === 404) return { type: "not_found", message: detail || "El recurso solicitado no existe." };
  if (status === 400) return { type: "bad_request", message: detail || "Operación no permitida." };
  if (status === 406) return { type: "no_credits", message: detail || "El socio no dispone de créditos suficientes." };
  if (status === 409) return { type: "conflict", message: detail || "Conflicto: la operación choca con una reserva existente." };
  if (status === 422) return { type: "validation", message: "Datos inválidos.", fields: extractValidationFields(data?.detail) };
  if (status === 500) return { type: "server", message: "Error interno del servidor." };
  return { type: "http", message: `Error HTTP ${status}.` };
}
