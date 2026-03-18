const API_URL = "/api";

export const getAuthHeaders = () => {
  const token = localStorage.getItem("xai_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  async get(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  async upload(endpoint: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },
};
