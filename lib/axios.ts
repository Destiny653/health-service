import axios from "axios";
import Cookies from "js-cookie";
import { useMutation } from "@tanstack/react-query";


const apiClient = axios.create({
  baseURL: "http://173.249.30.54/dappa", // make sure this is correct
  timeout: 10000,
});

// Add token to every request automatically
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optional: handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("authToken");
      localStorage.clear();
      window.location.href = "/sign-in";
    }
    return Promise.reject(error);
  }
);

export default apiClient;


interface LoginPayload {
  username: string;
  password: string;
  otp: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: any;
}

async function validateLogin({ username, password, otp }: LoginPayload) {
  const response = await apiClient.post<LoginResponse>(
    `/auth/login/validate?otp=${otp}`,
    {
      username,
      password,
    }
  );

  return response.data;
}

export function useValidateLogin() {
  return useMutation({
    mutationFn: validateLogin,
  });
}
