import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const NavContainer = styled.nav`
  background-color: #1a1a1a;
  padding: 10px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const NavWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 0 20px;

  @media (max-width: 768px) {
    justify-content: flex-start;
    gap: 8px;
    padding: 0 10px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    /* Hide scrollbar on mobile */
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const NavLink = styled(Link)<{ $isActive: boolean }>`
  color: ${(props) => (props.$isActive ? '#8B5A2B' : '#ffffff')};
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  transition: color 0.2s ease;
  background-color: ${(props) =>
    props.$isActive ? 'rgba(139, 90, 43, 0.2)' : 'transparent'};
  white-space: nowrap;

  &:hover {
    color: ${(props) => (props.$isActive ? '#8B5A2B' : '#DAA520')};
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 14px;
    min-width: fit-content;
  }

  @media (max-width: 480px) {
    padding: 8px 10px;
    font-size: 13px;

    /* Show only icons on very small screens */
    span.label {
      display: none;
    }
  }
`;

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/characters', label: 'Characters', icon: '🐉' },
    { path: '/species', label: 'Species', icon: '🧝' },
    { path: '/classes', label: 'Classes', icon: '⚔️' },
    { path: '/backgrounds', label: 'Backgrounds', icon: '📜' },
    { path: '/feats', label: 'Feats', icon: '⭐' },
    { path: '/spells', label: 'Spells', icon: '✨' },
  ];

  return (
    <NavContainer>
      <NavWrapper>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            $isActive={location.pathname === item.path}
          >
            {item.icon} <span className="label">{item.label}</span>
          </NavLink>
        ))}
      </NavWrapper>
    </NavContainer>
  );
};

export default Navigation;
