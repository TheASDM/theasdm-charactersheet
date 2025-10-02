/**
 * Authentication and User Types
 */

export interface UserPayload {
  userId: number;
  username: string;
  email: string;
  isDm: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
    isDm: boolean;
    createdAt: Date;
  };
  token: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  isDm: boolean;
  discordId?: bigint | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    characters: number;
    campaigns: number;
  };
}
