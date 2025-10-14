import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { isError } from '@/types/api';

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
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 70px;
  gap: 2rem;

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
  color: #ce9016;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  letter-spacing: 1.5px;

  &:hover {
    opacity: 0.9;
    filter: brightness(1.1);
  }

  img {
    width: 200px;
    height: auto;
    max-width: 100%;
    filter: drop-shadow(0 2px 8px rgba(206, 144, 22, 0.3));
    transition: filter 0.3s ease;
  }

  &:hover img {
    filter: drop-shadow(0 2px 12px rgba(206, 144, 22, 0.5));
  }

  @media (max-width: 768px) {
    img {
      width: 150px;
    }
  }
`;

const NavLinks = styled.div<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  justify-content: flex-end;

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

const DropdownContainer = styled.div`
  position: relative;

  @media (max-width: 1024px) {
    width: 100%;
  }
`;

const DropdownButton = styled.button<{ $isActive: boolean; $isOpen: boolean }>`
  position: relative;
  padding: 0.75rem 1.25rem;
  color: ${props => props.$isActive ? '#ce9016' : '#ccc'};
  font-family: 'Inter', sans-serif;
  font-weight: ${props => props.$isActive ? '600' : '500'};
  font-size: 0.95rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: ${props => props.$isActive || props.$isOpen ? 'rgba(206, 144, 22, 0.1)' : 'transparent'};
  border: 1px solid ${props => props.$isActive || props.$isOpen ? 'rgba(206, 144, 22, 0.3)' : 'transparent'};
  white-space: nowrap;
  cursor: pointer;

  .icon {
    font-size: 1.2rem;
    filter: ${props => props.$isActive ? 'brightness(1.2)' : 'brightness(0.8)'};
    transition: all 0.3s ease;
  }

  .label {
    letter-spacing: 0.3px;
  }

  .arrow {
    font-size: 0.7rem;
    transition: transform 0.3s ease;
    transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  }

  &:hover {
    color: #ce9016;
    background: rgba(206, 144, 22, 0.1);
    border-color: rgba(206, 144, 22, 0.2);

    .icon {
      filter: brightness(1.2);
      transform: scale(1.1);
    }
  }

  @media (max-width: 1024px) {
    width: 100%;
    padding: 1rem 1.25rem;
    border-radius: 6px;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    justify-content: space-between;
  }
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  background: linear-gradient(135deg, #1f1f1f 0%, #161616 100%);
  border: 1px solid #333;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  min-width: 200px;
  opacity: ${props => props.$isOpen ? '1' : '0'};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.3s ease;
  z-index: 1000;

  @media (max-width: 1024px) {
    position: static;
    opacity: 1;
    visibility: visible;
    transform: none;
    box-shadow: none;
    border: none;
    border-radius: 0;
    background: transparent;
    margin: ${props => props.$isOpen ? '0.5rem 0 0 1rem' : '0'};
    max-height: ${props => props.$isOpen ? '500px' : '0'};
    overflow: hidden;
  }
`;

const DropdownItem = styled(Link)<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  color: ${props => props.$isActive ? '#ce9016' : '#ccc'};
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  border-left: 3px solid ${props => props.$isActive ? '#ce9016' : 'transparent'};

  .icon {
    font-size: 1.1rem;
    filter: ${props => props.$isActive ? 'brightness(1.2)' : 'brightness(0.8)'};
  }

  &:hover {
    background: rgba(206, 144, 22, 0.1);
    color: #ce9016;
    border-left-color: #ce9016;

    .icon {
      filter: brightness(1.2);
    }
  }

  &:first-child {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  &:last-child {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }

  @media (max-width: 1024px) {
    padding: 0.75rem 1rem;
    border-radius: 4px;
    border-left: none;

    &:first-child,
    &:last-child {
      border-radius: 4px;
    }
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;

  @media (max-width: 1024px) {
    margin: 0.25rem 0;
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
    background: ${props => props.$isOpen ? '#ce9016' : '#ccc'};
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
    background: #ce9016;
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
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [charactersOpen, setCharactersOpen] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [dmOpen, setDmOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const autoCloseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
    setCharactersOpen(false);
    setReferenceOpen(false);
    setDmOpen(false);
    setAccountOpen(false);

    // Clear any pending auto-close timeouts
    if (autoCloseTimeout.current) {
      clearTimeout(autoCloseTimeout.current);
      autoCloseTimeout.current = null;
    }
  };

  const handleMouseEnter = () => {
    // Clear any pending auto-close timeout when mouse enters
    if (autoCloseTimeout.current) {
      clearTimeout(autoCloseTimeout.current);
      autoCloseTimeout.current = null;
    }
  };

  const handleMouseLeave = () => {
    // Set a timeout to close all dropdowns after 3 seconds
    if (autoCloseTimeout.current) {
      clearTimeout(autoCloseTimeout.current);
    }

    autoCloseTimeout.current = setTimeout(() => {
      setCharactersOpen(false);
      setReferenceOpen(false);
      setDmOpen(false);
      setAccountOpen(false);
    }, 3000);
  };

  const handleLogout = async () => {
    const result = await logout();
    if (isError(result)) {
      return;
    }
    setMobileMenuOpen(false);
    setDmOpen(false);
    setAccountOpen(false);
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/login');
    handleLinkClick();
  };

  const handleRegister = () => {
    navigate('/register');
    handleLinkClick();
  };

  // Check if any character path is active
  const isCharactersActive = location.pathname === '/characters' || location.pathname === '/generator';

  // Check if any reference path is active
  const isReferenceActive = ['/species', '/classes', '/backgrounds', '/feats', '/equipment', '/spells'].some(
    path => location.pathname.startsWith(path)
  );

  return (
    <>
      <FontImport />
      <NavContainer onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <NavContent>
          <LogoSection>
            <Logo to="/" onClick={handleLinkClick}>
              <img src="/images/forge-logo.png" alt="Dungeons.WTF Character Generator" />
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
            {/* Characters Dropdown */}
            <DropdownContainer>
              <DropdownButton
                $isActive={isCharactersActive}
                $isOpen={charactersOpen}
                onClick={() => setCharactersOpen(!charactersOpen)}
              >
                <span className="icon">🧙‍♂️</span>
                <span className="label">Characters</span>
                <span className="arrow">▼</span>
              </DropdownButton>
              <DropdownMenu $isOpen={charactersOpen}>
                <DropdownItem
                  to="/characters"
                  $isActive={location.pathname === '/characters'}
                  onClick={handleLinkClick}
                >
                  <span className="icon">📋</span>
                  <span>My Characters</span>
                </DropdownItem>
                <DropdownItem
                  to="/generator"
                  $isActive={location.pathname === '/generator'}
                  onClick={handleLinkClick}
                >
                  <span className="icon">🎲</span>
                  <span>Character Generator</span>
                </DropdownItem>
              </DropdownMenu>
            </DropdownContainer>

            {/* Reference Dropdown */}
            <DropdownContainer>
              <DropdownButton
                $isActive={isReferenceActive}
                $isOpen={referenceOpen}
                onClick={() => setReferenceOpen(!referenceOpen)}
              >
                <span className="icon">📚</span>
                <span className="label">Reference</span>
                <span className="arrow">▼</span>
              </DropdownButton>
              <DropdownMenu $isOpen={referenceOpen}>
                <DropdownItem
                  to="/species"
                  $isActive={location.pathname.startsWith('/species')}
                  onClick={handleLinkClick}
                >
                  <span className="icon">🐉</span>
                  <span>Species</span>
                </DropdownItem>
                <DropdownItem
                  to="/classes"
                  $isActive={location.pathname.startsWith('/classes') || location.pathname.startsWith('/subclasses')}
                  onClick={handleLinkClick}
                >
                  <span className="icon">⚔️</span>
                  <span>Classes</span>
                </DropdownItem>
                <DropdownItem
                  to="/backgrounds"
                  $isActive={location.pathname === '/backgrounds'}
                  onClick={handleLinkClick}
                >
                  <span className="icon">📜</span>
                  <span>Backgrounds</span>
                </DropdownItem>
                <DropdownItem
                  to="/feats"
                  $isActive={location.pathname === '/feats'}
                  onClick={handleLinkClick}
                >
                  <span className="icon">⭐</span>
                  <span>Feats</span>
                </DropdownItem>
                <DropdownItem
                  to="/equipment"
                  $isActive={location.pathname === '/equipment'}
                  onClick={handleLinkClick}
                >
                  <span className="icon">🛡️</span>
                  <span>Equipment</span>
                </DropdownItem>
                <DropdownItem
                  to="/spells"
                  $isActive={location.pathname === '/spells'}
                  onClick={handleLinkClick}
                >
                  <span className="icon">✨</span>
                  <span>Spells</span>
                </DropdownItem>
              </DropdownMenu>
            </DropdownContainer>

            {user?.role === 'DM' && (
              <DropdownContainer>
                <DropdownButton
                  $isActive={location.pathname.startsWith('/dm')}
                  $isOpen={dmOpen}
                  onClick={() => setDmOpen(!dmOpen)}
                >
                  <span className="icon">🧰</span>
                  <span className="label">DM Tools</span>
                  <span className="arrow">▼</span>
                </DropdownButton>
                <DropdownMenu $isOpen={dmOpen}>
                  <DropdownItem
                    to="/dm"
                    $isActive={location.pathname === '/dm'}
                    onClick={handleLinkClick}
                  >
                    <span className="icon">📊</span>
                    <span>Dashboard</span>
                  </DropdownItem>
                  <DropdownItem
                    to="#"
                    $isActive={false}
                    onClick={(event) => {
                      event.preventDefault();
                      handleLinkClick();
                    }}
                  >
                    <span className="icon">📓</span>
                    <span>Session Planner (Coming Soon)</span>
                  </DropdownItem>
                  <DropdownItem
                    to="#"
                    $isActive={false}
                    onClick={(event) => {
                      event.preventDefault();
                      handleLinkClick();
                    }}
                  >
                    <span className="icon">🎭</span>
                    <span>NPC Manager (In Development)</span>
                  </DropdownItem>
                </DropdownMenu>
              </DropdownContainer>
            )}

            {/* My Account Dropdown */}
            <DropdownContainer>
              <DropdownButton
                $isActive={false}
                $isOpen={accountOpen}
                onClick={() => setAccountOpen(!accountOpen)}
              >
                <span className="icon">👤</span>
                <span className="label">
                  {isAuthenticated ? user?.displayName : 'My Account'}
                </span>
                <span className="arrow">▼</span>
              </DropdownButton>
              <DropdownMenu $isOpen={accountOpen}>
                {isAuthenticated ? (
                  <>
                    <DropdownItem
                      to="/profile"
                      $isActive={location.pathname === '/profile'}
                      onClick={handleLinkClick}
                    >
                      <span className="icon">⚙️</span>
                      <span>Profile</span>
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem
                      to="#"
                      $isActive={false}
                      onClick={(e) => {
                        e.preventDefault();
                        handleLogout();
                      }}
                    >
                      <span className="icon">🚪</span>
                      <span>Logout</span>
                    </DropdownItem>
                  </>
                ) : (
                  <>
                    <DropdownItem
                      to="/login"
                      $isActive={location.pathname === '/login'}
                      onClick={handleLogin}
                    >
                      <span className="icon">🔑</span>
                      <span>Login</span>
                    </DropdownItem>
                    <DropdownItem
                      to="/register"
                      $isActive={location.pathname === '/register'}
                      onClick={handleRegister}
                    >
                      <span className="icon">📝</span>
                      <span>Register</span>
                    </DropdownItem>
                  </>
                )}
              </DropdownMenu>
            </DropdownContainer>
          </NavLinks>
        </NavContent>
      </NavContainer>

      <Overlay $isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(false)} />
    </>
  );
};

export default Navigation;
