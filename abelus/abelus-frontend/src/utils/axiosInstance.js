import axios from "axios";
import { supabase } from "./supabaseClient";

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  withCredentials: true,
  timeout: 20000, // 20 seconds
});

/**
 * Request Interceptor: Attach Supabase JWT to every request
 */
instance.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return config;
});

/**
 * Response Interceptor: Handle Authentication Errors
 */
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If we get a 401, it means the session is likely invalid or expired
    if (error.response?.status === 401) {
      // We can try to refresh the session manually or just logout
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !session) {
        // Clear everything and redirect to login if session is truly dead
        await supabase.auth.signOut();
        if (window.location.pathname !== '/login') {
          window.location.href = "/login";
        }
      } else {
        // Retry the original request with the new token
        error.config.headers.Authorization = `Bearer ${session.access_token}`;
        return instance(error.config);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
