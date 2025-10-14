import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
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

export const RegisterPage: React.FC = () => {
  const { beginDiscordLogin, isLoading } = useAuth();

  const handleRegister = () => {
    beginDiscordLogin('/characters');
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
            <AuthSubtitle>We use Discord for authentication during the alpha. Connect your account to get started.</AuthSubtitle>
          </AuthHeader>

          <DiscordButton type="button" onClick={handleRegister} disabled={isLoading}>
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
