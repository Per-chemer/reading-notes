const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = "Request failed";
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorMessage;
    } catch {
      // Keep fallback message when response is not JSON.
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/auth/me"),
  listNotes: (keyword = "") => {
    const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
    return request(`/notes${query}`);
  },
  createNote: (payload) => request("/notes", { method: "POST", body: JSON.stringify(payload) }),
  updateNote: (id, payload) => request(`/notes/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteNote: (id) => request(`/notes/${id}`, { method: "DELETE" }),
};
