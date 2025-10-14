/**
 * Authentication and User Types
 */

export type UserRole = 'PLAYER' | 'DM';

export interface UserPayload {
  userId: number;
  displayName: string;
  role: UserRole;
}

export interface UpdateProfileRequest {
  displayName?: string;
}

export interface AuthUserSummary {
  id: number;
  displayName: string;
  username?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  message: string;
  user: AuthUserSummary;
  token: string;
}

export interface UserProfile extends AuthUserSummary {
  discordId: string;
  lastLoginAt?: Date | null;
  _count: {
    characters: number;
    campaigns: number;
  };
}

export interface DiscordOAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  global_name?: string | null;
  display_name?: string | null;
  avatar?: string | null;
  email?: string | null;
}
