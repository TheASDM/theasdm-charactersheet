import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Species } from '../types/api';
import { speciesService } from '../services/speciesService';
import { ResponsiveTable } from '../components';
import {
  parseDnDTemplateTag,
  parseComplexDnDEntry,
} from '../utils/dndTemplateParser';

const Container = styled.div`
  padding: 0 rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  color: #2c3e50;
  padding-top: 1rem;
  margin-bottom: 40px;
  text-align: center;
  font-size: 2.5rem;
`;

const SearchContainer = styled.div`
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 300px;
  padding: 0.75rem 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const FilterSelect = styled.select`
  padding: 0.75rem 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  min-width: 150px;
  background-color: white;
`;

const SpeciesName = styled.div`
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
`;

const SpeciesSource = styled.div`
  font-size: 0.8rem;
  color: #666;
  background: #f1f3f4;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
`;

const SizeSpeed = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SizeSpeedItem = styled.div`
  font-size: 0.9rem;
  color: #555;
`;

const TraitsList = styled.div`
  min-width: 400px;
`;

const TraitName = styled.div`
  font-weight: 600;
  color: #4a90e2;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
`;

const TraitDescription = styled.div`
  font-size: 0.8rem;
  color: #666;
  line-height: 1.4;
  margin-bottom: 0.75rem;
  white-space: pre-line;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: #666;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: #e74c3c;
  background: #ffeaea;
  border-radius: 8px;
  margin: 2rem 0;
`;

const SpeciesPage: React.FC = () => {
  const [species, setSpecies] = useState<Species[]>([]);
  const [filteredSpecies, setFilteredSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        setLoading(true);
        const response = await speciesService.getAll();
        if (response.data) {
          setSpecies(response.data);
          setFilteredSpecies(response.data);
        } else {
          setError(response.error || 'Failed to fetch species data');
        }
      } catch (err) {
        setError('Error loading species data');
        console.error('Error fetching species:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecies();
  }, []);

  useEffect(() => {
    let filtered = species;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter((s) => s.source === sourceFilter);
    }

    setFilteredSpecies(filtered);
  }, [species, searchTerm, sourceFilter]);

  const formatSize = (size: string | string[], speciesName: string): string => {
    // Handle the fact that size can be an array or string
    const sizeValue = Array.isArray(size) ? size[0] : size;

    // Fix incorrect data in database - these should all be Medium
    const correctSizes: Record<string, string> = {
      Aasimar: 'Medium',
      Human: 'Medium',
      Tiefling: 'Medium',
    };

    if (correctSizes[speciesName]) {
      return correctSizes[speciesName];
    }

    const sizeMap: Record<string, string> = {
      S: 'Small',
      M: 'Medium',
      L: 'Large',
      T: 'Tiny',
      H: 'Huge',
      G: 'Gargantuan',
    };
    return sizeMap[sizeValue] || sizeValue;
  };

  const parseTraits = (
    traits: any
  ): Array<{ name: string; description: string }> => {
    if (!traits) return [];

    if (Array.isArray(traits)) {
      return traits.map((trait) => ({
        name: trait.name || 'Trait',
        description: Array.isArray(trait.description)
          ? trait.description
              .map((desc: any) => parseComplexDnDEntry(desc))
              .join('\n\n')
          : typeof trait.description === 'string'
          ? parseDnDTemplateTag(trait.description)
          : typeof trait.description === 'object'
          ? parseComplexDnDEntry(trait.description)
          : 'See source material for details.',
      }));
    }

    return [];
  };

  const getUniqueSourcesFromSpecies = (speciesList: Species[]): string[] => {
    const sources = speciesList
      .map((s) => s.source)
      .filter((source) => source)
      .filter(
        (source, index, array) => array.indexOf(source) === index
      ) as string[];
    return sources.sort();
  };

  const uniqueSources = getUniqueSourcesFromSpecies(species);

  if (loading) {
    return <LoadingMessage>Loading species data...</LoadingMessage>;
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  return (
    <Container>
      <Title>🧝 Species & Races</Title>
      <ResponsiveTable
        keyField="id"
        data={filteredSpecies}
        columns={[
          {
            key: 'name',
            header: 'Name',
            render: (_value, row) => (
              <div>
                <SpeciesName>{row.name}</SpeciesName>
                {row.source && <SpeciesSource>{row.source}</SpeciesSource>}
              </div>
            ),
          },
          {
            key: 'sizeSpeed',
            header: 'Size & Speed',
            mobile: false, // Hide on mobile to save space
            render: (_value, row) => (
              <SizeSpeed>
                <SizeSpeedItem>
                  <strong>Size:</strong> {formatSize(row.size, row.name)}
                </SizeSpeedItem>
                <SizeSpeedItem>
                  <strong>Speed:</strong> {row.speed} ft
                </SizeSpeedItem>
                <SizeSpeedItem>
                  <strong>Type:</strong> {row.creatureType}
                </SizeSpeedItem>
              </SizeSpeed>
            ),
          },
          {
            key: 'traits',
            header: 'Traits',
            render: (_value, row) => (
              <TraitsList>
                {parseTraits(row.traits).map((trait, index) => (
                  <div key={index}>
                    <TraitName>{trait.name}</TraitName>
                    <TraitDescription>{trait.description}</TraitDescription>
                  </div>
                ))}
              </TraitsList>
            ),
          },
          // Mobile-specific columns
          {
            key: 'sizeSpeedMobile',
            header: 'Details',
            desktop: false, // Only show on mobile
            render: (_value, row) => (
              <div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Size:</strong> {formatSize(row.size, row.name)}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Speed:</strong> {row.speed} ft
                </div>
                <div>
                  <strong>Type:</strong> {row.creatureType}
                </div>
              </div>
            ),
          },
        ]}
      />

      {filteredSpecies.length === 0 && !loading && (
        <LoadingMessage>
          No species found matching your criteria.
        </LoadingMessage>
      )}
    </Container>
  );
};

export default SpeciesPage;
