// URL base de la API del backend. Se configura con VITE_API_URL (ver .env.example);
// si no está definida se usa la del backend en local.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
