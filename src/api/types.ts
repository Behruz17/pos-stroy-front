export interface User {
  id: number;
  login: string;
  name: string;
  role: string;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface LogoutResponse {
  message: string;
}

export interface RegisterRequest {
  login: string;
  password: string;
  name: string;
  role: string;
}

export interface RegisterResponse {
  id: number;
  login: string;
  name: string;
  role: string;
  created_at: string;
  message: string;
}
