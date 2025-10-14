import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { updateProfileSchema } from '../validators/auth.validator';
import {
  AuthResponse,
  AuthUserSummary,
  DiscordOAuthTokens,
  DiscordUser,
  UserPayload,
  UserRole,
} from '../types/auth.types';
import logger from '../utils/logger';

const router = Router();

const DISCORD_API_BASE = 'https://discord.com/api';
const DISCORD_SCOPE = ['identify', 'email'].join(' ');
const STATE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type OAuthStateEntry = {
  expiresAt: number;
  redirectTo?: string;
};

const pendingStates = new Map<string, OAuthStateEntry>();

const getEnv = (key: string): string | undefined => {
  const value = process.env[key];
  return value && value.length > 0 ? value : undefined;
};

const getDiscordClientId = (): string => {
  const clientId = getEnv('DISCORD_CLIENT_ID');
  if (!clientId) {
    throw new Error('DISCORD_CLIENT_ID is not configured');
  }
  return clientId;
};

const getDiscordClientSecret = (): string => {
  const clientSecret = getEnv('DISCORD_CLIENT_SECRET');
  if (!clientSecret) {
    throw new Error('DISCORD_CLIENT_SECRET is not configured');
  }
  return clientSecret;
};

const getRedirectUri = (): string => {
  const explicitRedirect = getEnv('DISCORD_REDIRECT_URI');
  if (explicitRedirect) {
    return explicitRedirect;
  }
  const backendUrl = getEnv('API_BASE_URL') ?? 'http://localhost:3001';
  return `${backendUrl.replace(/\/$/, '')}/api/auth/discord/callback`;
};

const getFrontendBaseUrl = (): string => {
  return getEnv('FRONTEND_URL') ?? 'http://localhost:3000';
};

const cleanupExpiredStates = () => {
  const now = Date.now();
  for (const [state, entry] of pendingStates.entries()) {
    if (entry.expiresAt <= now) {
      pendingStates.delete(state);
    }
  }
};

const sanitizeRedirectTarget = (redirectTo?: string): string | undefined => {
  if (!redirectTo) {
    return undefined;
  }

  try {
    const frontendBase = new URL(getFrontendBaseUrl());
    const resolved = new URL(redirectTo, frontendBase);
    if (resolved.origin !== frontendBase.origin) {
      return undefined;
    }
    return resolved.toString();
  } catch {
    return undefined;
  }
};

const buildDiscordAuthorizeUrl = (state: string): string => {
  const params = new URLSearchParams({
    client_id: getDiscordClientId(),
    response_type: 'code',
    scope: DISCORD_SCOPE,
    state,
    redirect_uri: getRedirectUri(),
    prompt: 'consent',
  });

  return `${DISCORD_API_BASE}/oauth2/authorize?${params.toString()}`;
};

const buildAvatarUrl = (discordUser: DiscordUser): string | undefined => {
  if (discordUser.avatar) {
    const format = discordUser.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${format}?size=256`;
  }

  // Discord removed discriminators; fallback to embed avatars
  return 'https://cdn.discordapp.com/embed/avatars/0.png';
};

const normaliseDisplayName = (discordUser: DiscordUser): string => {
  return (
    discordUser.global_name ||
    discordUser.display_name ||
    discordUser.username ||
    'Adventurer'
  );
};

const mapUserToSummary = (user: {
  id: number;
  displayName: string;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}): AuthUserSummary => ({
  id: user.id,
  displayName: user.displayName,
  username: user.username,
  email: user.email,
  avatarUrl: user.avatarUrl,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const generateToken = (payload: UserPayload): string => {
  const jwtSecret = getEnv('JWT_SECRET');
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
};

/**
 * Initiate Discord OAuth2 login
 */
router.get('/discord', (req, res: Response) => {
  try {
    cleanupExpiredStates();

    const state = randomUUID();
    const redirectTo = sanitizeRedirectTarget(
      typeof req.query.redirectTo === 'string' ? req.query.redirectTo : undefined
    );

    const stateEntry: OAuthStateEntry = {
      expiresAt: Date.now() + STATE_TTL_MS,
      ...(redirectTo ? { redirectTo } : {}),
    };

    pendingStates.set(state, stateEntry);

    const authorizeUrl = buildDiscordAuthorizeUrl(state);
    res.redirect(authorizeUrl);
  } catch (error) {
    logger.error('Failed to initiate Discord OAuth:', error);
    res.status(500).json({ error: 'Discord OAuth configuration error' });
  }
});

/**
 * Discord OAuth2 callback
 */
router.get('/discord/callback', async (req, res: Response) => {
  try {
    cleanupExpiredStates();

    const { code, state, error, error_description: errorDescription } =
      req.query;

    if (error) {
      logger.warn('Discord OAuth error', { error, errorDescription });
      return res
        .status(400)
        .json({ error: 'Discord authorization failed', detail: error });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    if (!state || typeof state !== 'string') {
      return res.status(400).json({ error: 'Missing OAuth state' });
    }

    const stateEntry = pendingStates.get(state);
    if (!stateEntry || stateEntry.expiresAt < Date.now()) {
      pendingStates.delete(state);
      return res.status(400).json({ error: 'Invalid or expired OAuth state' });
    }

    pendingStates.delete(state);

    const tokenResponse = await axios.post<DiscordOAuthTokens>(
      `${DISCORD_API_BASE}/oauth2/token`,
      new URLSearchParams({
        client_id: getDiscordClientId(),
        client_secret: getDiscordClientSecret(),
        grant_type: 'authorization_code',
        code,
        redirect_uri: getRedirectUri(),
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const tokens = tokenResponse.data;

    const userResponse = await axios.get<DiscordUser>(
      `${DISCORD_API_BASE}/users/@me`,
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    const discordUser = userResponse.data;
    const displayName = normaliseDisplayName(discordUser);
    const avatarUrl = buildAvatarUrl(discordUser);

    const existingUser = await prisma.user.findUnique({
      where: { discordId: discordUser.id },
    });

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    const baseUpdate = {
      displayName,
      username: discordUser.username ?? existingUser?.username ?? null,
      email: discordUser.email ?? existingUser?.email ?? null,
      avatarUrl: avatarUrl ?? null,
      discordAccessToken: tokens.access_token,
      discordRefreshToken: tokens.refresh_token,
      discordTokenExpiresAt: expiresAt,
      lastLoginAt: new Date(),
    };

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: baseUpdate,
        })
      : await prisma.user.create({
          data: {
            discordId: discordUser.id,
            role: 'PLAYER',
            ...baseUpdate,
          },
        });

    const authPayload = {
      userId: user.id,
      displayName: user.displayName,
      role: user.role,
    };

    const token = generateToken(authPayload);
    const frontendBase = getFrontendBaseUrl();
    const redirectTarget =
      stateEntry.redirectTo ??
      `${frontendBase.replace(/\/$/, '')}/auth/discord/callback`;
    const redirectUrl = new URL(redirectTarget, frontendBase);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('isNew', existingUser ? '0' : '1');

    return res.redirect(redirectUrl.toString());
  } catch (error) {
    logger.error('Discord OAuth callback failed:', error);
    return res
      .status(500)
      .json({ error: 'Failed to authenticate with Discord' });
  }
});

/**
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        displayName: true,
        username: true,
        email: true,
        avatarUrl: true,
        role: true,
        discordId: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            characters: true,
            campaigns: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user,
    });
  } catch (error) {
    logger.error('Failed to fetch current user:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * Update profile (display name only for now)
 */
router.patch('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((detail) => detail.message),
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(value.displayName ? { displayName: value.displayName } : {}),
      },
      select: {
        id: true,
        displayName: true,
        username: true,
        email: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = generateToken({
      userId: updatedUser.id,
      displayName: updatedUser.displayName,
      role: updatedUser.role,
    });

    const response: AuthResponse = {
      message: 'Profile updated successfully',
      user: mapUserToSummary(updatedUser),
      token,
    };

    return res.json(response);
  } catch (err) {
    logger.error('Failed to update user profile:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * Logout (client-side token removal)
 */
router.post('/logout', authenticate, (_req: AuthRequest, res: Response) => {
  return res.json({ message: 'Logged out successfully' });
});

export default router;
