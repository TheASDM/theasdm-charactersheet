import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { toastBus, ToastPayload } from '@/utils/toastBus';

interface Toast extends ToastPayload {
  id: number;
}

type ToastContextValue = {
  addToast: (toast: ToastPayload) => void;
  removeToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(32px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const ToastStack = styled.div`
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: none;
`;

const ToastCard = styled.div<{ type: Toast['type'] }>`
  min-width: 260px;
  max-width: 340px;
  background: ${({ type }) => {
    switch (type) {
      case 'success':
        return 'linear-gradient(135deg, rgba(34, 197, 94, 0.85), rgba(22, 163, 74, 0.8))';
      case 'info':
        return 'linear-gradient(135deg, rgba(59, 130, 246, 0.85), rgba(37, 99, 235, 0.8))';
      case 'warning':
        return 'linear-gradient(135deg, rgba(249, 115, 22, 0.85), rgba(234, 88, 12, 0.8))';
      default:
        return 'linear-gradient(135deg, rgba(239, 68, 68, 0.92), rgba(185, 28, 28, 0.85))';
    }
  }};
  color: #fff;
  border-radius: 12px;
  padding: 0.85rem 1rem;
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 0.75rem;
  pointer-events: auto;
  animation: ${slideIn} 0.25s ease forwards;
`;

const ToastIcon = styled.div`
  font-size: 1.4rem;
  line-height: 1;
`;

const ToastMessage = styled.div`
  font-size: 0.9rem;
  line-height: 1.35;
`;

const ToastMeta = styled.div`
  font-size: 0.75rem;
  opacity: 0.85;
  margin-top: 0.25rem;
`;

const CloseButton = styled.button`
  appearance: none;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border-radius: 999px;
  width: 26px;
  height: 26px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.24);
  }
`;

const iconForType = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return '✅';
    case 'info':
      return 'ℹ️';
    case 'warning':
      return '⚠️';
    default:
      return '❌';
  }
};

const AUTO_DISMISS_MS = 5000;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: ToastPayload) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts(current => [...current, { ...toast, id }]);

    window.setTimeout(() => removeToast(id), AUTO_DISMISS_MS);
  }, [removeToast]);

  useEffect(() => {
    const unsubscribe = toastBus.subscribe(addToast);
    return () => unsubscribe();
  }, [addToast]);

  const contextValue = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastStack aria-live="polite" aria-atomic="true">
        {toasts.map(({ id, type, message, statusCode, code }) => (
          <ToastCard key={id} type={type} role="alert">
            <ToastIcon>{iconForType(type)}</ToastIcon>
            <div>
              <ToastMessage>{message}</ToastMessage>
              {(statusCode || code) && (
                <ToastMeta>
                  {statusCode && <span>Status: {statusCode}</span>}
                  {statusCode && code && <span> • </span>}
                  {code && <span>Code: {code}</span>}
                </ToastMeta>
              )}
            </div>
            <CloseButton onClick={() => removeToast(id)} aria-label="Dismiss notification">
              ×
            </CloseButton>
          </ToastCard>
        ))}
      </ToastStack>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
