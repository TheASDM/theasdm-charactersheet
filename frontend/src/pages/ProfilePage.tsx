import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import styled from 'styled-components';
import { useAuth } from '@/contexts/AuthContext';
import authService from '@/services/authService';
import { isError } from '@/types/api';
import {
  AuthContainer,
  AuthCard,
  AuthHeader,
  AuthTitle,
  AuthSubtitle,
  FormGroup,
  Label,
  Input,
  SubmitButton,
  SuccessMessage,
  ErrorMessage,
} from '@/styles/authStyles';

const ProfileGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  margin-top: 2rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #333;
  border-radius: 8px;
  color: #ddd;

  span:first-child {
    font-weight: 600;
    color: #ce9016;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const AvatarPreview = styled.div<{ $url?: string | null }>`
  height: 96px;
  width: 96px;
  border-radius: 50%;
  background: ${({ $url }) =>
    $url
      ? `url(${$url}) center/cover no-repeat`
      : 'linear-gradient(135deg, rgba(206, 144, 22, 0.6), rgba(75, 60, 12, 0.9))'};
  border: 2px solid rgba(206, 144, 22, 0.3);
  margin: 0 auto 1rem auto;
`;

const RoleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(88, 101, 242, 0.15);
  border: 1px solid rgba(88, 101, 242, 0.3);
  color: #8ea1f7;
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: 600;
`;

const ProfilePage: React.FC = () => {
  const { user, applySession } = useAuth();
  const [displayName, setDisplayName] = useState<string>(user?.displayName ?? '');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const joinDate = useMemo(() => {
    if (!user?.createdAt) return '—';
    return new Date(user.createdAt).toLocaleDateString();
  }, [user?.createdAt]);

  const lastLogin = useMemo(() => {
    if (!user?.lastLoginAt) return '—';
    return new Date(user.lastLoginAt).toLocaleString();
  }, [user?.lastLoginAt]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      return;
    }

    if (!displayName.trim()) {
      setErrorMessage('Display name cannot be empty.');
      setStatusMessage('');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setStatusMessage('');

    const result = await authService.updateProfile({ displayName: displayName.trim() });
    setIsSaving(false);

    if (isError(result)) {
      setErrorMessage(result.error ?? 'Failed to update profile.');
      return;
    }

    applySession(result.data);
    setStatusMessage('Profile updated successfully.');
  };

  if (!user) {
    return (
      <AuthContainer>
        <AuthCard>
          <AuthHeader>
            <AuthTitle>Profile</AuthTitle>
            <AuthSubtitle>Please sign in with Discord to view your profile.</AuthSubtitle>
          </AuthHeader>
        </AuthCard>
      </AuthContainer>
    );
  }

  return (
    <>
      <Helmet>
        <title>Profile - Dungeons.WTF</title>
      </Helmet>

      <AuthContainer>
        <AuthCard>
          <AuthHeader>
            <AvatarPreview $url={user.avatarUrl ?? null} />
            <AuthTitle>{user.displayName}</AuthTitle>
            <AuthSubtitle>
              Connected as <strong>{user.username ?? 'Unknown Adventurer'}</strong>
            </AuthSubtitle>
            <div style={{ marginTop: '0.75rem' }}>
              <RoleBadge>
                {user.role === 'DM' ? 'Dungeon Master' : 'Player'}
              </RoleBadge>
            </div>
          </AuthHeader>

          {statusMessage && <SuccessMessage>{statusMessage}</SuccessMessage>}
          {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

          <form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={100}
                required
              />
            </FormGroup>
            <SubmitButton type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Update Display Name'}
            </SubmitButton>
          </form>

          <ProfileGrid>
            <InfoRow>
              <span>Discord ID</span>
              <span>{user.discordId}</span>
            </InfoRow>
            <InfoRow>
              <span>Email</span>
              <span>{user.email ?? 'Not shared by Discord'}</span>
            </InfoRow>
            <InfoRow>
              <span>Joined</span>
              <span>{joinDate}</span>
            </InfoRow>
            <InfoRow>
              <span>Last Login</span>
              <span>{lastLogin}</span>
            </InfoRow>
            <InfoRow>
              <span>Characters Created</span>
              <span>{user._count?.characters ?? 0}</span>
            </InfoRow>
            <InfoRow>
              <span>Campaigns Run</span>
              <span>{user._count?.campaigns ?? 0}</span>
            </InfoRow>
          </ProfileGrid>
        </AuthCard>
      </AuthContainer>
    </>
  );
};

export default ProfilePage;
