import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000/api", // ✅ include /api if your routes are mounted under /api
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken"); // ✅ must match login storage key
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;