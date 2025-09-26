import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

// Import medieval fonts
const FontImport = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:wght@400;600&display=swap');
`;

const NavContainer = styled.nav`
  background: linear-gradient(
    135deg,
    #0e0e0eff 0%,
    #1a1a1aff 50%,
    #000000ff 100%
  );
  padding: 10px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(139, 105, 20, 0.3);
`;

const NavWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 0 15px;
  position: relative;

  /* Golden decorative line underneath */
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    right: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      #d4af37 10%,
      #d4af37 90%,
      transparent 100%
    );
    border-radius: 1px;
    box-shadow: 0 0 4px rgba(212, 175, 55, 0.3);
  }

  @media (max-width: 768px) {
    justify-content: flex-start;
    gap: 4px;
    padding: 0 8px;
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
  background: ${(props) =>
    props.$isActive
      ? 'linear-gradient(145deg, #d4af37, #b8941f)'
      : 'linear-gradient(145deg, #5a3a2a, #4a2a1a)'};
  border: 1px solid ${(props) => (props.$isActive ? '#d4af37' : '#8b6914')};
  border-radius: 8px;
  padding: 8px 16px;
  color: ${(props) => (props.$isActive ? '#2c1810' : '#d4af37')};
  font-family: 'Cinzel', serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: ${(props) =>
    props.$isActive
      ? '0 3px 10px rgba(212, 175, 55, 0.4)'
      : '0 2px 8px rgba(0, 0, 0, 0.3)'};
  text-shadow: ${(props) =>
    props.$isActive ? '1px 1px 2px rgba(0, 0, 0, 0.5)' : 'none'};

  &:hover {
    background: ${(props) =>
      props.$isActive
        ? 'linear-gradient(145deg, #b8941f, #a0801b)'
        : 'linear-gradient(145deg, #6a4a3a, #5a3a2a)'};
    box-shadow: ${(props) =>
      props.$isActive
        ? '0 4px 12px rgba(212, 175, 55, 0.5)'
        : '0 3px 10px rgba(212, 175, 55, 0.3)'};
    transform: translateY(-1px);
    color: ${(props) => (props.$isActive ? '#2c1810' : '#d4af37')};
  }

  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 12px;
    min-width: fit-content;
    gap: 4px;
  }

  @media (max-width: 480px) {
    padding: 6px 10px;
    font-size: 11px;
    gap: 3px;

    /* Show only icons on very small screens */
    span.label {
      display: none;
    }
  }
`;

const NavIcon = styled.span`
  font-size: 1em;

  @media (max-width: 480px) {
    font-size: 1.1em;
  }
`;

const NavLabel = styled.span`
  @media (max-width: 480px) {
    display: none;
  }
`;

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/characters', label: 'Characters', icon: '🧙‍♂️' },
    { path: '/generator', label: 'Generator', icon: '🎲' },
    { path: '/species', label: 'Species', icon: '🐉' },
    { path: '/classes', label: 'Classes', icon: '⚔️' },
    { path: '/backgrounds', label: 'Backgrounds', icon: '📜' },
    { path: '/feats', label: 'Feats', icon: '⭐' },
    { path: '/spells', label: 'Spells', icon: '✨' },
  ];

  return (
    <>
      <FontImport />
      <NavContainer>
        <NavWrapper>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              $isActive={location.pathname === item.path}
            >
              <NavIcon>{item.icon}</NavIcon>
              <NavLabel className="label">{item.label}</NavLabel>
            </NavLink>
          ))}
        </NavWrapper>
      </NavContainer>
    </>
  );
};

export default Navigation;
