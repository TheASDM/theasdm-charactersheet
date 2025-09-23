import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClassList } from '../components';
import { CharacterClass } from '../types/api';

const ClassesPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLevelsClick = (characterClass: CharacterClass) => {
    console.log('Levels clicked for:', characterClass.name);
    navigate(`/classes/${characterClass.id}/levels`);
  };

  const handleDetailsClick = (characterClass: CharacterClass) => {
    console.log('Details clicked for:', characterClass.name);
    navigate(`/classes/${characterClass.id}/details`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        paddingTop: '20px',
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '20px',
          padding: '0 20px',
        }}
      >
        <h1
          style={{
            fontSize: '2.5rem',
            color: '#8B5A2B',
            fontFamily: '"Cinzel", serif',
            marginBottom: '10px',
          }}
        >
          ⚔️ D&D Classes
        </h1>
        <p
          style={{
            fontSize: '1.1rem',
            color: '#666',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          Choose your path with the 12 official D&D 2024 character classes
        </p>
      </div>

      {/* Class List */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        <ClassList
          onLevelsClick={handleLevelsClick}
          onDetailsClick={handleDetailsClick}
          showSearch={true}
        />
      </div>
    </div>
  );
};

export default ClassesPage;
