/**
 * Authentication and User Types
 */

import { UserRole } from '@prisma/client';

export interface UserPayload {
  userId: number;
  displayName: string;
  role: UserRole;
}

export interface AuthUserSummary {
  id: number;
  displayName: string;
  username: string | null;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  username?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
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
  user: AuthUserSummary;
  token: string;
}

export interface DiscordOAuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string;
  display_name?: string;
  avatar: string | null;
  email?: string;
  verified?: boolean;
}

export interface UserProfile {
  id: number;
  displayName: string;
  username: string | null;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  discordId?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    characters: number;
    campaigns: number;
  };
}

export { UserRole };
