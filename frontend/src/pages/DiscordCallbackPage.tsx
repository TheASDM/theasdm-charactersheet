import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { isError } from '@/types/api';
import {
  AuthContainer,
  AuthCard,
  AuthHeader,
  AuthTitle,
  AuthSubtitle,
  ErrorMessage,
  SuccessMessage,
} from '@/styles/authStyles';

const DiscordCallbackPage: React.FC = () => {
  const { completeOAuthLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Connecting to Discord...');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const redirectTarget = params.get('next');

    if (!token) {
      setStatus('error');
      setMessage('Missing authentication token. Please try logging in again.');
      return;
    }

    const run = async () => {
      const result = await completeOAuthLogin(token);
      if (isError(result)) {
        setStatus('error');
        setMessage(result.error ?? 'Failed to complete authentication.');
        return;
      }

      setStatus('success');
      setMessage('Authentication successful! Redirecting...');
      window.setTimeout(() => {
        navigate(redirectTarget || '/characters', { replace: true });
      }, 600);
    };

    void run();
  }, [completeOAuthLogin, location.search, navigate]);

  return (
    <>
      <Helmet>
        <title>Connecting to Discord...</title>
      </Helmet>

      <AuthContainer>
        <AuthCard>
          <AuthHeader>
            <AuthTitle>Discord Authentication</AuthTitle>
            <AuthSubtitle>
              {status === 'loading'
                ? 'Finishing the sign-in process. This will only take a moment.'
                : status === 'success'
                  ? 'You can close this window if you are not redirected automatically.'
                  : 'Something went wrong while connecting to Discord.'}
            </AuthSubtitle>
          </AuthHeader>

          {status === 'error' ? (
            <ErrorMessage>{message}</ErrorMessage>
          ) : (
            <SuccessMessage>{message}</SuccessMessage>
          )}
        </AuthCard>
      </AuthContainer>
    </>
  );
};

export default DiscordCallbackPage;
