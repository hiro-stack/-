// 認証関連の型定義

export interface User {
  id: number;
  username: string;
  email: string;
  user_type: 'adopter' | 'shelter' | 'admin';
  phone_number?: string;
  address?: string;
  profile_image?: string;
  bio?: string;
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  phone_number?: string;
  address?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
}
