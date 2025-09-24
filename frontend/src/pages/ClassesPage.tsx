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
        minHeight: '50vh',
        backgroundColor: '#f5f5f5',
        paddingTop: '0px',
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
            color: '#2c3e50',
            paddingTop: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontSize: '2.5rem',
          }}
        >
          ⚔️ D&D Classes
        </h1>
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
          showSearch={false}
        />
      </div>
    </div>
  );
};

export default ClassesPage;
