import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navigation } from './components';
import { UserProvider } from './contexts/UserContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { setSessionToken } from '@/services/session';
import {
  CharactersPage,
  CharacterViewPage,
  CharacterSheetTestPage,
  ClassesPage,
  ClassLevelsPage,
  ClassDetailsPage,
  BackgroundsPage,
  FeatsPage,
  SpeciesPage,
  EquipmentPage,
  LoginPage,
  RegisterPage,
} from './pages';
import SpellsPage from './pages/SpellsPage';
import CharacterGeneratorPage from './pages/CharacterGeneratorPage';
import SubclassesPage from './pages/SubclassesPage';
import ClassFullDetailsPage from './pages/ClassFullDetailsPage';
import ClassSubclassesPage from './pages/ClassSubclassesPage';
import { SpeciesFeaturesTestPage } from './pages/SpeciesFeaturesTestPage';

// HomePage component with interactive features
const HomePage: React.FC = () => {
  const navigate = (path: string) => {
    window.location.href = path;
  };

  const handleCreateCharacter = () => {
    navigate('/generator');
  };

  const handleViewCharacters = () => {
    navigate('/characters');
  };

  return (
    <div
      style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        fontFamily: '"Inter", sans-serif',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        color: '#ffffff',
        minHeight: 'calc(100vh - 70px)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Hero Section */}
        <div style={{ marginBottom: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img
            src="/images/wtforged-logo.png"
            alt="Dungeons.WTF Character Generator"
            style={{
              maxWidth: '600px',
              width: '100%',
              height: 'auto',
              marginBottom: '2rem',
              filter: 'drop-shadow(0 4px 12px rgba(206, 144, 22, 0.4))',
            }}
          />
          <p
            style={{
              fontSize: '1.3rem',
              marginBottom: '0.5rem',
              color: '#e0e0e0',
              fontWeight: '300',
            }}
          >
            A Dungeons & Dragons 2024 and Nimble 2.0 inspired TTRPG
          </p>
          <p
            style={{
              fontSize: '1rem',
              marginBottom: '3rem',
              color: '#888',
            }}
          >
            Created by The ASDM in conjunction with{' '}
            <a
              href="https://vanyas.quest"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#ce9016',
                textDecoration: 'none',
                borderBottom: '1px solid #ce9016',
                transition: 'all 0.3s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#e0a523';
                e.currentTarget.style.borderBottomColor = '#e0a523';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#ce9016';
                e.currentTarget.style.borderBottomColor = '#ce9016';
              }}
            >
              Vanya's Quest
            </a>
          </p>

          {/* CTA Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={handleCreateCharacter}
              style={{
                padding: '1.25rem 2.5rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #ce9016 0%, #b8860b 100%)',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 4px 16px rgba(206, 144, 22, 0.3)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(206, 144, 22, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(206, 144, 22, 0.3)';
              }}
            >
              ⚔ Create New Character
            </button>

            <button
              onClick={handleViewCharacters}
              style={{
                padding: '1.25rem 2.5rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ce9016',
                border: '1px solid #ce9016',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(206, 144, 22, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              📋 My Characters
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div
          style={{
            marginTop: '5rem',
            padding: '3rem 2rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            border: '1px solid #333',
            backdropFilter: 'blur(10px)',
          }}
        >
          <h2
            style={{
              color: '#ce9016',
              marginBottom: '3rem',
              fontSize: '2rem',
              fontFamily: '"Cinzel", serif',
              letterSpacing: '1px',
            }}
          >
            ✨ Features
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '2rem',
              textAlign: 'left',
            }}
            className="features-grid"
          >
            <style>{`
              @media (max-width: 768px) {
                .features-grid {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
            <div
              style={{
                padding: '1.5rem',
                background: 'rgba(26, 26, 26, 0.8)',
                borderRadius: '12px',
                border: '1px solid #333',
              }}
            >
              <h3 style={{ color: '#ce9016', marginBottom: '0.75rem', fontSize: '1.2rem' }}>
                🎲 D&D 2024 Rules
              </h3>
              <p style={{ color: '#b0b0b0', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Latest PHB rules with background-driven ability scores and updated class features
              </p>
            </div>
            <div
              style={{
                padding: '1.5rem',
                background: 'rgba(26, 26, 26, 0.8)',
                borderRadius: '12px',
                border: '1px solid #333',
              }}
            >
              <h3 style={{ color: '#ce9016', marginBottom: '0.75rem', fontSize: '1.2rem' }}>
                ⚡ Complete Database
              </h3>
              <p style={{ color: '#b0b0b0', fontSize: '0.95rem', lineHeight: '1.6' }}>
                All spells, items, classes, species, backgrounds, and feats from D&D 2024
              </p>
            </div>
            <div
              style={{
                padding: '1.5rem',
                background: 'rgba(26, 26, 26, 0.8)',
                borderRadius: '12px',
                border: '1px solid #333',
              }}
            >
              <h3 style={{ color: '#ce9016', marginBottom: '0.75rem', fontSize: '1.2rem' }}>
                📱 Mobile Optimized
              </h3>
              <p style={{ color: '#b0b0b0', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Perfect for tablet gaming sessions with responsive design and PWA support
              </p>
            </div>
            <div
              style={{
                padding: '1.5rem',
                background: 'rgba(26, 26, 26, 0.8)',
                borderRadius: '12px',
                border: '1px solid #333',
              }}
            >
              <h3 style={{ color: '#ce9016', marginBottom: '0.75rem', fontSize: '1.2rem' }}>
                🛠️ Character Management
              </h3>
              <p style={{ color: '#b0b0b0', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Create, edit, and manage multiple characters with full sheet functionality
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer
          style={{
            marginTop: '4rem',
            padding: '2rem',
            color: '#666',
            fontSize: '0.9rem',
          }}
        >
          <p style={{ marginBottom: '0.5rem' }}>Dungeons.wtf</p>
          <p>Built for adventurers, by adventurers ⚔️</p>
        </footer>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = () => {
      setSessionToken(null);
      navigate('/login');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [navigate]);

  useEffect(() => {
    const updateViewportScale = () => {
      const isCompact = window.innerWidth < 1500 || window.innerHeight < 900;
      document.documentElement.classList.toggle('ui-compact', isCompact);
      document.body.classList.toggle('ui-compact', isCompact);
    };

    updateViewportScale();
    window.addEventListener('resize', updateViewportScale);

    return () => {
      window.removeEventListener('resize', updateViewportScale);
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Dungeons.WTF Character Generator</title>
        <meta
          name="description"
          content="Dungeons.WTF Character Generator - A Dungeons & Dragons 2024 and Nimble 2.0 inspired TTRPG created by The ASDM in conjunction with Vanya's Quest"
        />
      </Helmet>

      <AuthProvider>
        <UserProvider>
          <div className="App">
            <Navigation />
            <Routes>
              <Route path="/" element={<HomePage />} />

              {/* Auth routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected routes - require authentication */}
              <Route path="/characters" element={
                <ProtectedRoute>
                  <CharactersPage />
                </ProtectedRoute>
              } />
              <Route path="/characters/:characterId" element={
                <ProtectedRoute>
                  <CharacterViewPage />
                </ProtectedRoute>
              } />
              <Route path="/generator" element={
                <ProtectedRoute>
                  <CharacterGeneratorPage />
                </ProtectedRoute>
              } />

              {/* Public routes */}
              <Route path="/character-sheet-test" element={<CharacterSheetTestPage />} />
              <Route path="/species-features-test" element={<SpeciesFeaturesTestPage />} />
              <Route path="/spells" element={<SpellsPage />} />
              <Route path="/classes" element={<ClassesPage />} />
              <Route path="/subclasses" element={<SubclassesPage />} />
              <Route path="/backgrounds" element={<BackgroundsPage />} />
              <Route path="/feats" element={<FeatsPage />} />
              <Route path="/species" element={<SpeciesPage />} />
              <Route path="/equipment" element={<EquipmentPage />} />
              <Route path="/classes/:classId/levels" element={<ClassLevelsPage />} />
              <Route path="/classes/:classId/details" element={<ClassDetailsPage />} />
              <Route path="/classes/:classId/full-details" element={<ClassFullDetailsPage />} />
              <Route path="/classes/:classId/subclasses" element={<ClassSubclassesPage />} />
            </Routes>
          </div>
        </UserProvider>
      </AuthProvider>
    </>
  );
};

export default App;
