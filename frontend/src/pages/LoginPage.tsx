import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { isError } from '@/types/api';
import {
  AuthContainer,
  AuthCard,
  AuthHeader,
  AuthTitle,
  AuthSubtitle,
  AuthForm,
  FormGroup,
  Label,
  Input,
  ErrorMessage,
  SubmitButton,
  AuthFooter,
  FooterText,
  FooterLink,
} from '../styles/authStyles';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(formData);
      if (isError(result)) {
        setError(result.error ?? 'Login failed. Please try again.');
        return;
      }
      navigate('/characters'); // Redirect to characters page after login
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - WTForged</title>
        <meta name="description" content="Login to your WTForged account" />
      </Helmet>

      <AuthContainer>
        <AuthCard>
          <AuthHeader>
            <img
              src="/images/wtforged-logo.png"
              alt="WTForged"
              style={{ maxWidth: '300px', width: '100%', height: 'auto', marginBottom: '1rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
            />
            <AuthTitle>Welcome Back</AuthTitle>
            <AuthSubtitle>Log in to continue your adventure</AuthSubtitle>
          </AuthHeader>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <AuthForm onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </FormGroup>

            <SubmitButton type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </SubmitButton>
          </AuthForm>

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
