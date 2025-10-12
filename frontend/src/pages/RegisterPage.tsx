import React, { useState, useMemo } from 'react';
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
  PasswordRequirements,
} from '../styles/authStyles';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordReqs, setShowPasswordReqs] = useState(false);

  // Password validation
  const passwordValidation = useMemo(() => {
    const password = formData.password;
    return {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
    };
  }, [formData.password]);

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

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

    // Client-side validation
    if (!isPasswordValid) {
      setError('Password does not meet requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(formData);
      if (isError(result)) {
        setError(result.error ?? 'Registration failed. Please try again.');
        return;
      }
      navigate('/characters'); // Redirect to characters page after registration
    } finally {
      setIsLoading(false);
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
            <AuthSubtitle>Create your account to get started</AuthSubtitle>
          </AuthHeader>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <AuthForm onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                name="username"
                placeholder="adventurer123"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={isLoading}
                autoComplete="username"
                minLength={3}
                maxLength={50}
                pattern="[a-zA-Z0-9]+"
                title="Username must be alphanumeric"
              />
            </FormGroup>

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
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setShowPasswordReqs(true)}
                required
                disabled={isLoading}
                autoComplete="new-password"
              />
              {showPasswordReqs && formData.password && (
                <PasswordRequirements>
                  <li className={passwordValidation.minLength ? 'met' : ''}>
                    At least 8 characters
                  </li>
                  <li className={passwordValidation.hasUpper ? 'met' : ''}>
                    One uppercase letter
                  </li>
                  <li className={passwordValidation.hasLower ? 'met' : ''}>
                    One lowercase letter
                  </li>
                  <li className={passwordValidation.hasNumber ? 'met' : ''}>One number</li>
                </PasswordRequirements>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isLoading}
                autoComplete="new-password"
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  Passwords do not match
                </div>
              )}
            </FormGroup>

            <SubmitButton type="submit" disabled={isLoading || !isPasswordValid}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </SubmitButton>
          </AuthForm>

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
