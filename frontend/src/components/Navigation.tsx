import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

// Import fonts
const FontImport = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
`;

const NavContainer = styled.nav`
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  border-bottom: 1px solid #333;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
`;

const NavContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 70px;

  @media (max-width: 768px) {
    padding: 0 1rem;
    min-height: 60px;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Logo = styled(Link)`
  font-family: 'Cinzel', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #d4af37;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  letter-spacing: 1.5px;

  &:hover {
    color: #f0c851;
    text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
  }

  .icon {
    font-size: 2rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  }

  @media (max-width: 768px) {
    font-size: 1.2rem;
    gap: 0.5rem;

    .icon {
      font-size: 1.5rem;
    }
  }
`;

const NavLinks = styled.div<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 1024px) {
    position: fixed;
    top: 70px;
    right: 0;
    width: 280px;
    height: calc(100vh - 70px);
    background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 2rem 1rem;
    border-left: 1px solid #333;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.5);
    transform: translateX(${props => props.$isOpen ? '0' : '100%'});
    transition: transform 0.3s ease;
  }

  @media (max-width: 768px) {
    top: 60px;
    height: calc(100vh - 60px);
  }
`;

const NavLink = styled(Link)<{ $isActive: boolean }>`
  position: relative;
  padding: 0.75rem 1.25rem;
  color: ${props => props.$isActive ? '#d4af37' : '#ccc'};
  font-family: 'Inter', sans-serif;
  font-weight: ${props => props.$isActive ? '600' : '500'};
  font-size: 0.95rem;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: ${props => props.$isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent'};
  border: 1px solid ${props => props.$isActive ? 'rgba(212, 175, 55, 0.3)' : 'transparent'};
  white-space: nowrap;

  .icon {
    font-size: 1.2rem;
    filter: ${props => props.$isActive ? 'brightness(1.2)' : 'brightness(0.8)'};
    transition: all 0.3s ease;
  }

  .label {
    letter-spacing: 0.3px;
  }

  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: ${props => props.$isActive ? '80%' : '0'};
    height: 2px;
    background: linear-gradient(90deg, transparent, #d4af37, transparent);
    transition: width 0.3s ease;
  }

  &:hover {
    color: #d4af37;
    background: rgba(212, 175, 55, 0.1);
    border-color: rgba(212, 175, 55, 0.2);

    .icon {
      filter: brightness(1.2);
      transform: scale(1.1);
    }

    &::before {
      width: 80%;
    }
  }

  @media (max-width: 1024px) {
    padding: 1rem 1.25rem;
    border-radius: 6px;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    &::before {
      display: none;
    }

    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: ${props => props.$isActive ? '4px' : '0'};
      background: linear-gradient(180deg, #d4af37, #f0c851);
      transition: width 0.3s ease;
    }

    &:hover::after {
      width: 4px;
    }
  }
`;

const MobileMenuButton = styled.button<{ $isOpen: boolean }>`
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 10;

  @media (max-width: 1024px) {
    display: flex;
  }

  div {
    width: 2rem;
    height: 0.2rem;
    background: ${props => props.$isOpen ? '#d4af37' : '#ccc'};
    border-radius: 10px;
    transition: all 0.3s ease;
    position: relative;
    transform-origin: 1px;

    &:nth-child(1) {
      transform: ${props => props.$isOpen ? 'rotate(45deg)' : 'rotate(0)'};
    }

    &:nth-child(2) {
      opacity: ${props => props.$isOpen ? '0' : '1'};
      transform: ${props => props.$isOpen ? 'translateX(20px)' : 'translateX(0)'};
    }

    &:nth-child(3) {
      transform: ${props => props.$isOpen ? 'rotate(-45deg)' : 'rotate(0)'};
    }
  }

  &:hover div {
    background: #d4af37;
  }
`;

const Overlay = styled.div<{ $isOpen: boolean }>`
  display: none;

  @media (max-width: 1024px) {
    display: ${props => props.$isOpen ? 'block' : 'none'};
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(2px);
    z-index: 999;
  }

  @media (max-width: 768px) {
    top: 60px;
  }
`;

const Navigation: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/generator', label: 'Generator', icon: '🎲' },
    { path: '/characters', label: 'Characters', icon: '🧙‍♂️' },
    { path: '/species', label: 'Species', icon: '🐉' },
    { path: '/classes', label: 'Classes', icon: '⚔️' },
    { path: '/backgrounds', label: 'Backgrounds', icon: '📜' },
    { path: '/feats', label: 'Feats', icon: '⭐' },
    { path: '/equipment', label: 'Equipment', icon: '🛡️' },
    { path: '/spells', label: 'Spells', icon: '✨' },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <FontImport />
      <NavContainer>
        <NavContent>
          <LogoSection>
            <Logo to="/" onClick={handleLinkClick}>
              <span className="icon">🪓</span>
              <span>WTForged</span>
            </Logo>
          </LogoSection>

          <MobileMenuButton
            $isOpen={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div />
            <div />
            <div />
          </MobileMenuButton>

          <NavLinks $isOpen={mobileMenuOpen}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                $isActive={location.pathname === item.path}
                onClick={handleLinkClick}
              >
                <span className="icon">{item.icon}</span>
                <span className="label">{item.label}</span>
              </NavLink>
            ))}
          </NavLinks>
        </NavContent>
      </NavContainer>

      <Overlay $isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(false)} />
    </>
  );
};

export default Navigation;
