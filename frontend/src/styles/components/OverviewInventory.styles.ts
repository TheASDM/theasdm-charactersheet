import styled from 'styled-components';

export const OverviewInventoryCard = styled.section`
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 2px solid #333;
  border-radius: 6px;
  padding: 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
`;

export const OverviewInventoryHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(206, 144, 22, 0.2);

  h3 {
    margin: 0;
    font-size: 0.85rem;
    color: #ce9016;
    font-family: 'Cinzel', serif;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
`;

export const OverviewInventoryManageButton = styled.button`
  border: 1px solid rgba(206, 144, 22, 0.6);
  background: linear-gradient(135deg, rgba(206, 144, 22, 0.16), rgba(26, 26, 26, 0.75));
  color: #f6e9c8;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(206, 144, 22, 0.3);
  }

  &:focus-visible {
    outline: 2px solid rgba(206, 144, 22, 0.9);
    outline-offset: 2px;
  }
`;

export const OverviewInventoryList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  overflow: visible;
`;

export const OverviewInventoryListItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  background: rgba(20, 20, 20, 0.6);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 6px;
  padding: 0.5rem 0.65rem;
  font-size: 0.78rem;
  transition: background 0.2s ease, border-color 0.2s ease;
  min-width: 0;

  &:hover {
    background: rgba(26, 26, 26, 0.75);
    border-color: rgba(74, 222, 128, 0.45);
  }
`;

export const OverviewInventoryName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;

  strong {
    color: #fdf8e5;
    font-weight: 600;
    font-size: 0.78rem;
    letter-spacing: 0.01em;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    white-space: normal;
  }
`;

export const OverviewInventoryChips = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 0.3rem;
  align-items: center;
`;

export const OverviewInventoryChip = styled.span<{ $variant?: 'equipped' | 'stored' | 'qty' | 'category' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.12rem 0.4rem;
  border-radius: 999px;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  white-space: nowrap;
  color: ${({ $variant }) => {
    switch ($variant) {
      case 'equipped':
        return '#dcfce7';
      case 'stored':
        return '#cbd5f5';
      case 'qty':
        return '#0f172a';
      case 'category':
        return '#f6e9c8';
      default:
        return '#e2e8f0';
    }
  }};
  background: ${({ $variant }) => {
    switch ($variant) {
      case 'equipped':
        return 'linear-gradient(135deg, rgba(74, 222, 128, 0.35), rgba(21, 128, 61, 0.6))';
      case 'stored':
        return 'rgba(148, 163, 184, 0.25)';
      case 'qty':
        return 'rgba(255, 255, 255, 0.75)';
      case 'category':
        return 'transparent';
      default:
        return 'rgba(148, 163, 184, 0.25)';
    }
  }};
  border: ${({ $variant }) => ($variant === 'category' ? '1px solid rgba(206, 144, 22, 0.55)' : 'none')};
`;

export const OverviewInventoryMenuWrapper = styled.div`
  position: relative;
`;

export const OverviewInventoryMenuButton = styled.button`
  background: transparent;
  border: none;
  color: rgba(206, 144, 22, 0.8);
  cursor: pointer;
  padding: 0.25rem 0.4rem;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(206, 144, 22, 0.15);
    color: #ce9016;
  }

  &:focus-visible {
    outline: 2px solid rgba(206, 144, 22, 0.8);
    outline-offset: 2px;
  }
`;

export const OverviewInventoryMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  right: 0;
  top: calc(100% + 0.25rem);
  background: rgba(20, 20, 20, 0.98);
  border: 1px solid rgba(206, 144, 22, 0.5);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 9999;
  min-width: 140px;
  display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
  flex-direction: column;
  overflow: hidden;
`;

// Portal version - renders outside scroll container
export const OverviewInventoryMenuPortal = styled.div`
  position: fixed;
  background: rgba(20, 20, 20, 0.98);
  border: 1px solid rgba(206, 144, 22, 0.5);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 9999;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  /* Smooth appearance */
  animation: menuFadeIn 0.15s ease-out;

  @keyframes menuFadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const OverviewInventoryMenuItem = styled.button<{ $variant?: 'danger' }>`
  background: transparent;
  border: none;
  color: ${({ $variant }) => ($variant === 'danger' ? '#fca5a5' : '#e2e8f0')};
  padding: 0.55rem 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid rgba(206, 144, 22, 0.15);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ $variant }) =>
      $variant === 'danger'
        ? 'rgba(248, 113, 113, 0.15)'
        : 'rgba(206, 144, 22, 0.2)'};
  }

  &:focus-visible {
    outline: 2px solid rgba(206, 144, 22, 0.8);
    outline-offset: -2px;
  }
`;

export const OverviewInventoryActions = styled.div`
  display: inline-flex;
  gap: 0.35rem;
`;

export const OverviewInventoryActionButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
  border: 1px solid ${({ $variant }) => ($variant === 'danger' ? 'rgba(248, 113, 113, 0.65)' : 'rgba(148, 163, 184, 0.5)')};
  background: ${({ $variant }) =>
    $variant === 'danger'
      ? 'linear-gradient(135deg, rgba(248, 113, 113, 0.12), rgba(185, 28, 28, 0.2))'
      : 'rgba(30, 41, 59, 0.65)'};
  color: ${({ $variant }) => ($variant === 'danger' ? '#fecaca' : '#e2e8f0')};
  padding: 0.25rem 0.6rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    background: ${({ $variant }) =>
      $variant === 'danger'
        ? 'linear-gradient(135deg, rgba(248, 113, 113, 0.18), rgba(185, 28, 28, 0.28))'
        : 'rgba(51, 65, 85, 0.75)'};
  }

  &:focus-visible {
    outline: 2px solid rgba(206, 144, 22, 0.85);
    outline-offset: 2px;
  }
`;

export const OverviewInventoryEmpty = styled.div`
  text-align: center;
  padding: 1rem 0.5rem;
  color: rgba(203, 213, 225, 0.7);
  font-size: 0.76rem;
  letter-spacing: 0.02em;
`;
