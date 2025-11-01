import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { isError } from '@/types/api';
import {
  AuthContainer,
  AuthCard,
  AuthHeader,
  AuthTitle,
  AuthSubtitle,
  AuthFooter,
  FooterText,
  FooterLink,
  DiscordButton,
} from '../styles/authStyles';
import styled from 'styled-components';

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #7289da;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #5865f2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1rem;

  &:hover:not(:disabled) {
    background-color: #4752c4;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #ddd;
  }

  span {
    padding: 0 1rem;
    color: #666;
    font-size: 0.9rem;
  }
`;

export const RegisterPage: React.FC = () => {
  const { beginDiscordLogin, register, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');

  const handleDiscordRegister = () => {
    beginDiscordLogin('/characters');
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      email,
      password,
      displayName,
    };
    if (username) {
      data.username = username;
    }
    const result = await register(data);

    if (!isError(result)) {
      navigate('/characters');
    }
  };

  return (
    <>
      <Helmet>
        <title>Register - Dungeons.WTF Character Generator</title>
        <meta name="description" content="Create a Dungeons.WTF account" />
      </Helmet>

      <AuthContainer>
        <AuthCard>
          <AuthHeader>
            <img
              src="/images/wtforged-logo.png"
              alt="Dungeons.WTF Character Generator"
              style={{
                maxWidth: '300px',
                width: '100%',
                height: 'auto',
                marginBottom: '1rem',
                display: 'block',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
            <AuthTitle>Join the Adventure</AuthTitle>
            <AuthSubtitle>Create your account to get started.</AuthSubtitle>
          </AuthHeader>

          <form onSubmit={handleEmailRegister}>
            <FormGroup>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                disabled={isLoading}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="username">Username (optional)</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={2}
                maxLength={60}
                disabled={isLoading}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={128}
                disabled={isLoading}
              />
            </FormGroup>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <Divider>
            <span>OR</span>
          </Divider>

          <DiscordButton type="button" onClick={handleDiscordRegister} disabled={isLoading}>
            <span role="img" aria-hidden="true">🧙‍♂️</span>
            {isLoading ? 'Connecting to Discord...' : 'Sign up with Discord'}
          </DiscordButton>

          <AuthFooter>
            <FooterText>
              Already have an account?{' '}
              <FooterLink as={Link} to="/login">
                Log In
              </FooterLink>
            </FooterText>
          </AuthFooter>
        </AuthCard>
      </AuthContainer>
    </>
  );
};

export default RegisterPage;
