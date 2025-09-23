import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  CharactersPage,
  SpellsPage,
  ClassesPage,
  ClassLevelsPage,
  ClassDetailsPage,
} from './pages';

// HomePage component with interactive features
const HomePage: React.FC = () => {
  const navigate = (path: string) => {
    window.location.href = path;
  };

  const handleCreateCharacter = () => {
    alert('Character creation coming soon! 🐉');
  };

  const handleViewCharacters = () => {
    navigate('/characters');
  };

  const handleViewSpells = () => {
    navigate('/spells');
  };

  return (
    <div
      style={{
        padding: '2rem',
        textAlign: 'center',
        fontFamily: '"Inter", sans-serif',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: '#ffffff',
        minHeight: '100vh',
      }}
    >
      <h1
        style={{
          fontSize: '3rem',
          marginBottom: '1rem',
          fontFamily: '"Cinzel", serif',
          color: '#8B5A2B',
        }}
      >
        🐉 D&D Character Sheet Generator
      </h1>

      <p
        style={{
          fontSize: '1.2rem',
          marginBottom: '2rem',
          color: '#cccccc',
        }}
      >
        Create and manage D&D 2024 characters with Nimble TTRPG homebrew
        mechanics
      </p>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleCreateCharacter}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            backgroundColor: '#8B5A2B',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = '#A0652F')
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = '#8B5A2B')
          }
        >
          ⚡ Create New Character
        </button>

        <button
          onClick={handleViewCharacters}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            backgroundColor: '#DAA520',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = '#E6B52A')
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = '#DAA520')
          }
        >
          📋 View My Characters
        </button>

        <button
          onClick={handleViewSpells}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            backgroundColor: '#4A90E2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = '#5BA0F2')
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = '#4A90E2')
          }
        >
          📜 Browse Spells
        </button>
      </div>

      <div
        style={{
          marginTop: '3rem',
          padding: '2rem',
          backgroundColor: '#2d2d2d',
          borderRadius: '12px',
          maxWidth: '800px',
          margin: '3rem auto',
        }}
      >
        <h2 style={{ color: '#8B5A2B', marginBottom: '1rem' }}>✨ Features</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            textAlign: 'left',
          }}
        >
          <div>
            <h3 style={{ color: '#DAA520' }}>🎲 D&D 2024 Compliant</h3>
            <p style={{ color: '#cccccc', fontSize: '0.9rem' }}>
              Latest rules, background-driven ability scores, level 3 subclasses
            </p>
          </div>
          <div>
            <h3 style={{ color: '#DAA520' }}>⚡ Nimble TTRPG Integration</h3>
            <p style={{ color: '#cccccc', fontSize: '0.9rem' }}>
              Streamlined actions, mana system, wound mechanics
            </p>
          </div>
          <div>
            <h3 style={{ color: '#DAA520' }}>📱 Mobile Friendly</h3>
            <p style={{ color: '#cccccc', fontSize: '0.9rem' }}>
              Perfect for tablet gaming, PWA support
            </p>
          </div>
          <div>
            <h3 style={{ color: '#DAA520' }}>🤖 Discord Bot</h3>
            <p style={{ color: '#cccccc', fontSize: '0.9rem' }}>
              Character lookup, dice rolling, spell reference
            </p>
          </div>
        </div>
      </div>

      <footer
        style={{
          marginTop: '2rem',
          padding: '1rem',
          color: '#666',
          fontSize: '0.9rem',
        }}
      >
        <p>🚧 Development Status: Frontend ✅ | Backend ✅ | Discord Bot ✅</p>
        <p>Ready for feature development!</p>
      </footer>
    </div>
  );
};

// Navigation Component
const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/characters', label: 'Characters', icon: '🐉' },
    { path: '/spells', label: 'Spells', icon: '📜' },
    { path: '/classes', label: 'Classes', icon: '⚔️' },
  ];

  return (
    <nav
      style={{
        backgroundColor: '#1a1a1a',
        padding: '10px 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          padding: '0 20px',
        }}
      >
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              color: location.pathname === item.path ? '#8B5A2B' : '#ffffff',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'color 0.2s ease',
              backgroundColor:
                location.pathname === item.path
                  ? 'rgba(139, 90, 43, 0.2)'
                  : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== item.path) {
                (e.currentTarget as HTMLElement).style.color = '#DAA520';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== item.path) {
                (e.currentTarget as HTMLElement).style.color = '#ffffff';
              }
            }}
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>D&D Character Sheet Generator</title>
        <meta
          name="description"
          content="Create and manage D&D 2024 characters with Nimble TTRPG homebrew mechanics"
        />
      </Helmet>

      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/spells" element={<SpellsPage />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route
            path="/classes/:classId/levels"
            element={<ClassLevelsPage />}
          />
          <Route
            path="/classes/:classId/details"
            element={<ClassDetailsPage />}
          />
        </Routes>
      </div>
    </>
  );
};

export default App;
