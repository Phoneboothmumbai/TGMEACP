import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Plans API
export const getPlans = (activeOnly = true) => api.get(`/plans?active_only=${activeOnly}`);
export const createPlan = (data) => api.post("/plans", data);
export const updatePlan = (id, data) => api.put(`/plans/${id}`, data);
export const deletePlan = (id) => api.delete(`/plans/${id}`);

// Settings API
export const getSettings = () => api.get("/settings");
export const updateSettings = (data) => api.put("/settings", data);

// Activation Requests API
export const getActivationRequests = (status) => 
  api.get(`/activation-requests${status ? `?status=${status}` : ""}`);
export const getActivationRequest = (id) => api.get(`/activation-requests/${id}`);
export const createActivationRequest = (data) => api.post("/activation-requests", data);
export const updateRequestStatus = (id, status) => 
  api.put(`/activation-requests/${id}/status?status=${status}`);
export const resendEmail = (id) => api.post(`/activation-requests/${id}/resend-email`);
export const getInvoiceUrl = (id) => `${API_URL}/api/activation-requests/${id}/invoice`;

// Approval Workflow API
export const approveRequest = (id) => api.post(`/activation-requests/${id}/approve`);
export const declineRequest = (id) => api.post(`/activation-requests/${id}/decline`);

// Stats API
export const getStats = () => api.get("/stats");

export default api;
