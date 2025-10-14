import styled from 'styled-components';

export const AuthContainer = styled.div`
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
`;

export const AuthCard = styled.div`
  background: rgba(26, 26, 26, 0.95);
  border: 1px solid #333;
  border-radius: 16px;
  padding: 3rem;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    padding: 2rem;
  }
`;

export const AuthHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

export const AuthTitle = styled.h1`
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  color: #ce9016;
  margin-bottom: 0.5rem;
  letter-spacing: 1px;
`;

export const AuthSubtitle = styled.p`
  color: #888;
  font-size: 0.95rem;
`;

export const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const Label = styled.label`
  color: #e0e0e0;
  font-size: 0.9rem;
  font-weight: 500;
`;

export const Input = styled.input`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 0.875rem 1rem;
  color: #fff;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #ce9016;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba(206, 144, 22, 0.1);
  }

  &::placeholder {
    color: #666;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ErrorMessage = styled.div`
  color: #ff6b6b;
  font-size: 0.875rem;
  padding: 0.75rem;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 6px;
  margin-bottom: 1rem;
`;

export const SuccessMessage = styled.div`
  color: #51cf66;
  font-size: 0.875rem;
  padding: 0.75rem;
  background: rgba(81, 207, 102, 0.1);
  border: 1px solid rgba(81, 207, 102, 0.3);
  border-radius: 6px;
  margin-bottom: 1rem;
`;

export const SubmitButton = styled.button`
  background: linear-gradient(135deg, #ce9016 0%, #b8860b 100%);
  color: #1a1a1a;
  border: none;
  border-radius: 8px;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 16px rgba(206, 144, 22, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(206, 144, 22, 0.5);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const DiscordButton = styled(SubmitButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #5865f2 0%, #4b55d6 100%);
  color: #fff;

  &:hover:not(:disabled) {
    box-shadow: 0 6px 20px rgba(88, 101, 242, 0.45);
  }
`;

export const AuthFooter = styled.div`
  margin-top: 1.5rem;
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid #333;
`;

export const FooterText = styled.p`
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

export const FooterLink = styled.a`
  color: #ce9016;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;

  &:hover {
    color: #e0a523;
    text-decoration: underline;
  }
`;

export const PasswordRequirements = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.8rem;
  color: #888;

  li {
    padding: 0.25rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    &::before {
      content: '•';
      color: #ce9016;
    }

    &.met {
      color: #51cf66;

      &::before {
        content: '✓';
      }
    }
  }
`;
