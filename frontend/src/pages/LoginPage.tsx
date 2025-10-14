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

export const LoginPage: React.FC = () => {
  const { beginDiscordLogin, isLoading } = useAuth();

  const handleLogin = () => {
    beginDiscordLogin('/characters');
  };

  return (
    <>
      <Helmet>
        <title>Login - Dungeons.WTF Character Generator</title>
        <meta name="description" content="Login to your Dungeons.WTF account" />
      </Helmet>

      <AuthContainer>
        <AuthCard>
          <AuthHeader>
            <img
              src="/images/wtforged-logo.png"
              alt="Dungeons.WTF Character Generator"
              style={{ maxWidth: '300px', width: '100%', height: 'auto', marginBottom: '1rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
            />
            <AuthTitle>Welcome Back</AuthTitle>
            <AuthSubtitle>Log in with your Discord account to continue your adventure.</AuthSubtitle>
          </AuthHeader>

          <DiscordButton type="button" onClick={handleLogin} disabled={isLoading}>
            <span role="img" aria-hidden="true">🛡️</span>
            {isLoading ? 'Connecting to Discord...' : 'Sign in with Discord'}
          </DiscordButton>

          <AuthFooter>
            <FooterText>
              Don't have an account?{' '}
              <FooterLink as={Link} to="/register">
                Register
              </FooterLink>
            </FooterText>
            {/* Future: Add forgot password link */}
            {/* <FooterText>
              <FooterLink as={Link} to="/forgot-password">
                Forgot password?
              </FooterLink>
            </FooterText> */}
          </AuthFooter>
        </AuthCard>
      </AuthContainer>
    </>
  );
};

export default LoginPage;
