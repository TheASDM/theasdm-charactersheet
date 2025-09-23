import React from 'react';
import { CharacterList } from '../components';
import { Character } from '../types/api';

const CharactersPage: React.FC = () => {
  const handleCharacterClick = (character: Character) => {
    console.log('Character clicked:', character);
    // TODO: Navigate to character detail page
    alert(`Viewing character: ${character.name}`);
  };

  const handleCharacterEdit = (character: Character) => {
    console.log('Edit character:', character);
    // TODO: Navigate to character edit page
    alert(`Editing character: ${character.name}`);
  };

  const handleCharacterDelete = (character: Character) => {
    console.log('Character deleted:', character);
    // Character is already deleted by CharacterList component
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      paddingTop: '20px'
    }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        padding: '0 20px'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          color: '#8B5A2B',
          fontFamily: '"Cinzel", serif',
          marginBottom: '10px'
        }}>
          🐉 D&D Characters
        </h1>
        <p style={{ 
          fontSize: '1.1rem', 
          color: '#666',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Browse and manage your D&D 2024 character collection
        </p>
        
        {/* Action Button */}
        <button
          onClick={() => alert('Character creation coming soon!')}
          style={{
            backgroundColor: '#8B5A2B',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '20px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#6d4422';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#8B5A2B';
          }}
        >
          ➕ Create New Character
        </button>
      </div>

      {/* Character List */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <CharacterList
          showActions={true}
          onCharacterClick={handleCharacterClick}
          onCharacterEdit={handleCharacterEdit}
          onCharacterDelete={handleCharacterDelete}
        />
      </div>
    </div>
  );
};

export default CharactersPage;