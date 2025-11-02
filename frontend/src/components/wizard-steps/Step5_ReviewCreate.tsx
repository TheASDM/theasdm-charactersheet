import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { StepContainer } from '../../styles/components/CharacterGeneratorWizard.styles';
import { CharacterBuilderData } from '../CharacterGeneratorWizard';
import { mapGeneratorDataToCharacterSheet } from '../../utils/characterDataMapper';
import { characterService } from '../../services/characterService';
import { StructuredFeaturesDisplay } from '../StructuredFeaturesDisplay';
import { useUser } from '../../contexts/UserContext';
import { parseDnDTemplateTag } from '../../utils/dndTemplateParser';
import { isError } from '@/types/api';
import type { Spell } from '@/types/api';
import { showError } from '@/utils/errorDisplay';
import { logger } from '../../utils/logger';
import { getCantripCount, getPreparedCount } from '@/helpers/spellRules';
import { CLASS_CONFIG, normalizeClassId } from '@/helpers/spellcastingConfig';
import { getSpellById } from '@/services/spellService';
import { normaliseDisplayString } from '@/utils/dndTemplateParser';
import type { AbilityId } from '@/types/spells';

interface Step5ReviewCreateProps {
  data: CharacterBuilderData;
  onComplete: (characterId: number) => void;
  createHandlerRef?: React.MutableRefObject<{
    handleCreate?: () => Promise<void>;
  }>;
}

const ReviewContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

type SpellFlowMode = 'prepared' | 'scribe' | 'none';

const abilityIdToAbilityScoreKey: Record<AbilityId, keyof CharacterBuilderData['abilityScores']> = {
  str: 'strength',
  dex: 'dexterity',
  con: 'constitution',
  int: 'intelligence',
  wis: 'wisdom',
  cha: 'charisma',
};

const SPELL_ID_PATTERN = /^\d+$/;
const normaliseSpellId = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return SPELL_ID_PATTERN.test(trimmed) ? trimmed : null;
  }
  return null;
};

const CharacterCard = styled.div`
  background: linear-gradient(135deg, rgba(206, 144, 22, 0.15) 0%, rgba(26, 26, 26, 0.8) 100%);
  border: 1px solid rgba(206, 144, 22, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  position: relative;

  h3 {
    color: #ce9016;
    font-family: 'Cinzel', serif;
    font-size: 1.2rem;
    margin: 0 0 1rem 0;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;


const CharacterInfo = styled.div`
  .info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    padding: 0.25rem 0;
    border-bottom: 1px solid rgba(206, 144, 22, 0.2);

    .label {
      color: #ce9016;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .value {
      color: #f0f0f0;
      font-size: 0.9rem;
    }
  }
`;

const Section = styled.div`
  margin-bottom: 1.5rem;

  .section-title {
    color: #ce9016;
    font-family: 'Cinzel', serif;
    font-size: 1rem;
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .section-content {
    color: #ccc;
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .list-item {
    background: rgba(26, 26, 26, 0.4);
    border: 1px solid #444;
    border-radius: 4px;
    padding: 0.5rem;
    margin: 0.25rem 0;
    font-size: 0.8rem;
  }
`;

const SpellSummaryHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const SpellCountBadge = styled.span<{ $invalid?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.4px;
  background: ${({ $invalid }) =>
    $invalid ? 'rgba(182, 55, 55, 0.2)' : 'rgba(26, 26, 26, 0.75)'};
  border: 1px solid ${({ $invalid }) =>
    $invalid ? 'rgba(255, 120, 120, 0.6)' : 'rgba(206, 144, 22, 0.35)'};
  color: ${({ $invalid }) => ($invalid ? '#ff9c9c' : '#ce9016')};
`;

const SpellList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.4rem;
`;

const SpellListItem = styled.li<{ $granted?: boolean }>`
  background: ${({ $granted }) => ($granted ? 'rgba(54, 126, 89, 0.2)' : 'rgba(35, 35, 35, 0.7)')};
  border: 1px solid ${({ $granted }) =>
    $granted ? 'rgba(92, 224, 163, 0.45)' : 'rgba(206, 144, 22, 0.3)'};
  border-radius: 8px;
  padding: 0.45rem 0.6rem;
  font-size: 0.8rem;
  color: ${({ $granted }) => ($granted ? '#cfffe7' : '#f0f0f0')};
`;

const ProficienciesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const ProficiencyCard = styled.div`
  background: rgba(26, 26, 26, 0.6);
  border: 1px solid #444;
  border-radius: 6px;
  padding: 0.75rem;

  .prof-title {
    color: #ce9016;
    font-weight: 600;
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
  }

  .prof-list {
    color: #ccc;
    font-size: 0.75rem;
    line-height: 1.3;
  }
`;

const StatusMessage = styled.div<{ type: 'success' | 'error' | 'info' | 'warning' }>`
  background: ${props =>
    props.type === 'success' ? 'rgba(76, 175, 80, 0.1)' :
    props.type === 'error' ? 'rgba(244, 67, 54, 0.1)' :
    props.type === 'warning' ? 'rgba(255, 193, 7, 0.12)' :
    'rgba(33, 150, 243, 0.1)'};
  border: 1px solid ${props =>
    props.type === 'success' ? 'rgba(76, 175, 80, 0.3)' :
    props.type === 'error' ? 'rgba(244, 67, 54, 0.3)' :
    props.type === 'warning' ? 'rgba(255, 193, 7, 0.35)' :
    'rgba(33, 150, 243, 0.3)'};
  color: ${props =>
    props.type === 'success' ? '#4caf50' :
    props.type === 'error' ? '#f44336' :
    props.type === 'warning' ? '#ffc107' :
    '#2196f3'};
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  text-align: center;
  font-weight: 600;
`;

export const Step5ReviewCreate: React.FC<Step5ReviewCreateProps> = ({
  data,
  onComplete,
  createHandlerRef
}) => {
  const { user } = useUser();
  const [createStatus, setCreateStatus] = useState<'success' | 'error' | null>(null);

  const normalizedClassId = normalizeClassId(data.selectedClass ?? '');
  const classConfig = normalizedClassId ? CLASS_CONFIG[normalizedClassId] : undefined;
  const characterLevel = 1;

  const spellcastingAbilityMod = useMemo(() => {
    if (!classConfig?.spellcastingAbility) {
      return 0;
    }
    const abilityKey = abilityIdToAbilityScoreKey[classConfig.spellcastingAbility];
    const score = data.abilityScores?.[abilityKey];
    if (typeof score !== 'number') {
      return 0;
    }
    return Math.floor((score - 10) / 2);
  }, [classConfig?.spellcastingAbility, data.abilityScores]);

  const cantripMax = classConfig
    ? getCantripCount(normalizedClassId, characterLevel)
    : null;
  const preparedMax = classConfig && classConfig.casterType !== 'none'
    ? getPreparedCount(normalizedClassId, characterLevel, spellcastingAbilityMod)
    : null;

  const knownIds = useMemo(() => (data.spellbook?.known ?? []).map((id) => String(id)), [data.spellbook]);
  const preparedIds = useMemo(
    () => (data.spellbook?.prepared ?? []).map((id) => String(id)),
    [data.spellbook]
  );

  const speciesSource = useMemo(() => {
    const aggregated: string[] = [];

    // Include speciesSpells (legacy format)
    if (data.speciesSpells) {
      const spellsFromLegacy = Object.values(data.speciesSpells)
        .flat()
        .filter((spellId): spellId is string => Boolean(spellId));
      aggregated.push(...spellsFromLegacy);
    }

    // Include speciesGrantedSpells (new format for Rock Gnome, Drow, etc.)
    if (data.speciesGrantedSpells && Array.isArray(data.speciesGrantedSpells)) {
      aggregated.push(...data.speciesGrantedSpells);
    }

    return aggregated.length > 0 ? { grantedSpells: aggregated } : undefined;
  }, [data.speciesSpells, data.speciesGrantedSpells]);

  const featSources = useMemo(() => {
    if (!data.featSpells) {
      return undefined;
    }
    const mapped = Object.values(data.featSpells)
      .map((spells) => ({ grantedSpells: spells }))
      .filter((entry) => Array.isArray(entry.grantedSpells) && entry.grantedSpells.length > 0);
    return mapped.length > 0 ? mapped : undefined;
  }, [data.featSpells]);

  const classFeatureSources = useMemo(() => {
    if (!Array.isArray(data.classFeatures)) {
      return undefined;
    }
    const mapped = data.classFeatures
      .filter((feature: unknown): feature is { grantedSpells?: string[] } =>
        Boolean(feature && typeof feature === 'object' && 'grantedSpells' in (feature as Record<string, unknown>))
      )
      .map((feature) => ({ grantedSpells: feature.grantedSpells }))
      .filter((entry) => Array.isArray(entry.grantedSpells) && entry.grantedSpells.length > 0);
    return mapped.length > 0 ? mapped : undefined;
  }, [data.classFeatures]);

  // Note: backgroundFeatureSources removed - background features don't grant spells in D&D 2024

  const grantedIds = useMemo(() => {
    const ids: string[] = [];

    // Collect species granted spells (already cleaned)
    if (speciesSource && 'grantedSpells' in speciesSource) {
      const spells = (speciesSource as any).grantedSpells;
      if (Array.isArray(spells)) {
        spells.forEach((id: unknown) => {
          const normalised = normaliseSpellId(id);
          if (normalised) {
            ids.push(normalised);
          }
        });
      }
    }

    // Collect feat granted spells
    if (featSources && Array.isArray(featSources)) {
      for (const source of featSources) {
        if (source && typeof source === 'object' && 'grantedSpells' in source) {
          const spells = (source as any).grantedSpells;
          if (Array.isArray(spells)) {
            spells.forEach((id: unknown) => {
              const normalised = normaliseSpellId(id);
              if (normalised) {
                ids.push(normalised);
              }
            });
          }
        }
      }
    }

    // Collect class feature granted spells
    if (classFeatureSources && Array.isArray(classFeatureSources)) {
      for (const source of classFeatureSources) {
        if (source && typeof source === 'object' && 'grantedSpells' in source) {
          const spells = (source as any).grantedSpells;
          if (Array.isArray(spells)) {
            spells.forEach((id: unknown) => {
              const normalised = normaliseSpellId(id);
              if (normalised) {
                ids.push(normalised);
              }
            });
          }
        }
      }
    }

    // Deduplicate
    return Array.from(new Set(ids)).filter((id) => SPELL_ID_PATTERN.test(id));
  }, [speciesSource, featSources, classFeatureSources]);

  const grantedSet = useMemo(() => new Set(grantedIds), [grantedIds]);
  const knownTracked = useMemo(
    () => knownIds.filter((id) => !grantedSet.has(id)),
    [knownIds, grantedSet]
  );
  const preparedTracked = useMemo(
    () => preparedIds.filter((id) => !grantedSet.has(id)),
    [preparedIds, grantedSet]
  );

  const flowMode: SpellFlowMode = useMemo(() => {
    if (!classConfig || classConfig.casterType === 'none') {
      return 'none';
    }
    return classConfig.usesSpellbook ? 'scribe' : 'prepared';
  }, [classConfig]);

  const cantripSelectionEnabled = cantripMax !== null && cantripMax > 0;

  const [spellLookup, setSpellLookup] = useState<Record<string, Spell | null>>({});
  const [isLoadingSpellNames, setIsLoadingSpellNames] = useState(false);

  const knownBreakdown = useMemo(() => {
    const cantrips: string[] = [];
    const leveled: string[] = [];

    knownTracked.forEach((id) => {
      const spell = spellLookup[id];
      if (spell?.level === 0) {
        cantrips.push(id);
      } else if (spell && typeof spell.level === 'number') {
        leveled.push(id);
      } else {
        // Unknown details count as leveled for conservative caps
        leveled.push(id);
      }
    });

    return { cantrips, leveled };
  }, [knownTracked, spellLookup]);

  const cantripKnownCount = knownBreakdown.cantrips.length;
  const leveledKnownCount = knownBreakdown.leveled.length;

  const cantripOverflow =
    cantripSelectionEnabled && cantripMax !== null && cantripKnownCount > cantripMax;
  const preparedOverflow =
    preparedMax !== null && preparedTracked.length > preparedMax;

  const spellLimitWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (cantripOverflow) {
      warnings.push('Too many cantrips selected.');
    }
    if (preparedOverflow) {
      warnings.push('Too many spells prepared.');
    }
    return warnings;
  }, [cantripOverflow, preparedOverflow]);

  const uniqueSpellIds = useMemo(
    () => Array.from(new Set([...knownIds, ...preparedIds, ...grantedIds])).filter(Boolean),
    [knownIds, preparedIds, grantedIds]
  );

  useEffect(() => {
    if (uniqueSpellIds.length === 0) {
      setSpellLookup({});
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    // Debounce to avoid rapid re-fetches during wizard state changes
    const timeoutId = setTimeout(() => {
      const load = async () => {
        setIsLoadingSpellNames(true);
        const entries = await Promise.all(
          uniqueSpellIds.map(async (spellId) => {
            const response = await getSpellById(spellId, controller.signal);
            if (isError(response) || !response.data) {
              // Only log non-cancellation errors
              if (isError(response) && response.errorCode !== 'timeout') {
                logger.warn('Failed to resolve spell name for review', {
                  spellId,
                  error: response.error,
                });
              }
              return [spellId, null] as const;
            }
            return [spellId, response.data] as const;
          })
        );

        if (!cancelled) {
          setSpellLookup(Object.fromEntries(entries));
          setIsLoadingSpellNames(false);
        }
      };

      load().catch((error) => {
        if (!cancelled) {
          logger.error('Unexpected error loading spell summaries:', error);
          setIsLoadingSpellNames(false);
        }
      });
    }, 300); // 300ms debounce

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [uniqueSpellIds]);

  const getSpellLabel = (id: string): string => {
    const spell = spellLookup[id];
    if (spell && typeof spell.name === 'string') {
      return spell.name;
    }
    return `Spell #${id}`;
  };

  const grantedSpellNames = useMemo(
    () => grantedIds.map((id) => getSpellLabel(id)),
    [grantedIds, spellLookup]
  );
  const knownSpellNames = useMemo(
    () => knownTracked.map((id) => getSpellLabel(id)),
    [knownTracked, spellLookup]
  );
  const preparedSpellNames = useMemo(
    () => preparedTracked.map((id) => getSpellLabel(id)),
    [preparedTracked, spellLookup]
  );

  const hasManaResource = data.resources?.manaMax !== undefined || data.resources?.manaCurrent !== undefined;

  // Calculate final ability scores including background bonuses (unused in this component - handled by AbilityScoresHeader)
  // const calculateFinalAbilityScores = () => {
  //   const baseScores = data.abilityScores;
  //   const backgroundBonuses = data.backgroundAbilityScoreAllocations || {};

  //   return {
  //     strength: baseScores.strength + (backgroundBonuses.strength || backgroundBonuses.str || 0),
  //     dexterity: baseScores.dexterity + (backgroundBonuses.dexterity || backgroundBonuses.dex || 0),
  //     constitution: baseScores.constitution + (backgroundBonuses.constitution || backgroundBonuses.con || 0),
  //     intelligence: baseScores.intelligence + (backgroundBonuses.intelligence || backgroundBonuses.int || 0),
  //     wisdom: baseScores.wisdom + (backgroundBonuses.wisdom || backgroundBonuses.wis || 0),
  //     charisma: baseScores.charisma + (backgroundBonuses.charisma || backgroundBonuses.cha || 0),
  //   };
  // };

  // Calculate ability modifier (currently unused but may be needed for future features)
  // const calculateModifier = (score: number): number => {
  //   return Math.floor((score - 10) / 2);
  // };

  // const finalScores = calculateFinalAbilityScores();

  const handleCreateCharacter = React.useCallback(async () => {
    setCreateStatus(null);

    const characterSheetData = mapGeneratorDataToCharacterSheet(data);

    const response = await characterService.create({
      userId: user?.id || 1,
      name: characterSheetData.name,
      level: characterSheetData.level,
      characterData: characterSheetData,
      isPublic: false,
    });

    if (isError(response) || !response.data) {
      showError(response.error ?? 'Failed to create character', response.statusCode, response.errorCode);
      setCreateStatus('error');
      return;
    }

    setCreateStatus('success');

    setTimeout(() => {
      onComplete(response.data!.id);
    }, 1500);
  }, [data, user?.id, onComplete]);

  // Expose create handler to parent via ref
  useEffect(() => {
    if (createHandlerRef) {
      createHandlerRef.current = {
        handleCreate: handleCreateCharacter
      };
    } else {
      console.warn('createHandlerRef is undefined');
    }
  }, [createHandlerRef, handleCreateCharacter]);

  const formatList = (items: string[] | undefined): string => {
    if (!items || items.length === 0) return 'None';
    const cleaned = items
      .map((item) => normaliseDisplayString(item, { titleCase: true }))
      .filter((item) => item.length > 0);
    return cleaned.length > 0 ? [...new Set(cleaned)].join(', ') : 'None';
  };

  // Safe rendering function for any value that might be an object
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'object') {
      logger.warn('🚨 FOUND OBJECT IN SAFE RENDER:', { value, keys: Object.keys(value) });
      // Check if this is the {A, B} object we're looking for
      const keys = Object.keys(value);
      if (keys.length === 2 && keys.includes('A') && keys.includes('B')) {
        logger.error('🔥 FOUND THE {A, B} OBJECT:', value);
        logger.error('🔥 A array contents:', value.A);
        logger.error('🔥 B array contents:', value.B);
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  const getAllSkillProficiencies = (): string[] => {
    const skills: string[] = [];
    if (data.selectedClassSkills) skills.push(...data.selectedClassSkills);
    if (data.backgroundSkillProficiencies) skills.push(...data.backgroundSkillProficiencies);
    if (data.speciesSkillProficiencies) skills.push(...data.speciesSkillProficiencies);
    if (data.featSkillProficiencies) skills.push(...data.featSkillProficiencies);
    const unique = [...new Set(skills)];
    return unique
      .map((skill) => normaliseDisplayString(skill, { titleCase: true }))
      .filter((skill) => skill.length > 0);
  };

  const getAllToolProficiencies = (): string[] => {
    const tools: string[] = [];
    if (data.classProficiencies?.tools) tools.push(...data.classProficiencies.tools);
    if (data.backgroundToolProficiencies) tools.push(...data.backgroundToolProficiencies);
    if (data.speciesToolProficiencies) tools.push(...data.speciesToolProficiencies);
    if (data.featToolProficiencies) tools.push(...data.featToolProficiencies);
    const unique = [...new Set(tools)];
    return unique
      .map((tool) => normaliseDisplayString(tool, { titleCase: true }))
      .filter((tool) => tool.length > 0);
  };

  /**
   * Capitalize first letter of each word in a string
   */
  const titleCase = (str: string): string => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  /**
   * Extract equipment items from the nested JSONB structure or simple choice objects
   * Handles formats:
   * - [{ type: "direct", item: { A: [...], B: [...] } }] (from backgrounds API)
   * - [{ A: [...], B: [...] }] (from CLASS_STARTING_EQUIPMENT constant)
   * - ["string"] (simple strings)
   * Always uses Option A (equipment) instead of Option B (gold)
   */
  const extractEquipmentItems = (equipmentArray: any[]): string[] => {
    const items: string[] = [];

    if (!Array.isArray(equipmentArray)) {
      return items;
    }

    equipmentArray.forEach((entry) => {
      // Handle simple strings
      if (typeof entry === 'string') {
        items.push(titleCase(parseDnDTemplateTag(entry)));
        return;
      }

      if (!entry || typeof entry !== 'object') {
        return;
      }

      // Handle nested arrays (shouldn't happen but just in case)
      if (Array.isArray(entry)) {
        const nestedItems = extractEquipmentItems(entry);
        items.push(...nestedItems);
        return;
      }

      // Handle format from CLASS_STARTING_EQUIPMENT: { A: [...], B: [...] }
      if (entry.A && Array.isArray(entry.A) && !entry.type) {
        entry.A.forEach((item: any) => {
          if (typeof item === 'string') {
            items.push(titleCase(parseDnDTemplateTag(item)));
          }
        });
        return;
      }

      // Handle API format from backgrounds: { type: "direct", item: { A: [...], B: [...] } }
      if (entry.type === 'direct' && entry.item && typeof entry.item === 'object') {
        const choices = entry.item;

        // Only use Option A (equipment choice, not gold)
        if (choices.A && Array.isArray(choices.A)) {
          choices.A.forEach((subItem: any) => {
            if (typeof subItem === 'string') {
              items.push(titleCase(subItem));
            } else if (subItem && typeof subItem === 'object') {
              if ('item' in subItem && typeof subItem.item === 'string') {
                // Extract item name and remove source tag (e.g., "spear|xphb" -> "spear")
                const itemName = subItem.item.split('|')[0];
                const parsed = parseDnDTemplateTag(itemName);
                items.push(titleCase(parsed));
              }
              // Skip gold values - we want equipment, not gold
            }
          });
        }
      }
    });

    return items;
  };

  const getAllEquipment = (): string[] => {
    const equipment: string[] = [];

    // Class starting equipment (if any - currently not populated)
    if (data.classStartingEquipment && Array.isArray(data.classStartingEquipment)) {
      const classEquipment = extractEquipmentItems(data.classStartingEquipment);
      equipment.push(...classEquipment);
    }

    // Background starting equipment (primary source)
    if (data.backgroundStartingEquipment && Array.isArray(data.backgroundStartingEquipment)) {
      const backgroundEquipment = extractEquipmentItems(data.backgroundStartingEquipment);
      equipment.push(...backgroundEquipment);
    }

    // Selected equipment from step 4 (currently removed from wizard)
    if (data.selectedEquipment) {
      if (data.selectedEquipment.armor) {
        equipment.push(data.selectedEquipment.armor);
      }
      if (data.selectedEquipment.weapons && Array.isArray(data.selectedEquipment.weapons)) {
        equipment.push(...data.selectedEquipment.weapons.filter(Boolean));
      }
      if (data.selectedEquipment.shield) {
        equipment.push(data.selectedEquipment.shield);
      }
      if (data.selectedEquipment.equipment && Array.isArray(data.selectedEquipment.equipment)) {
        equipment.push(...data.selectedEquipment.equipment.filter(Boolean));
      }
    }

    return equipment.filter(Boolean); // Remove empty values
  };

  return (
    <StepContainer>
      <div className="step-title">Review & Create Character</div>
      <div className="step-description">
        Review your character details and create your D&D 2024 character sheet.
      </div>


      <ReviewContainer>
        {/* Left Column - Character Overview */}
        <CharacterCard>
          <h3>Character Overview</h3>
          <CharacterInfo>
            <div className="info-row">
              <span className="label">Character Name:</span>
              <span className="value">{safeRender(data.characterName) || 'Unnamed Character'}</span>
            </div>
            <div className="info-row">
              <span className="label">Player Name:</span>
              <span className="value">{safeRender(data.playerName) || 'Unknown Player'}</span>
            </div>
            <div className="info-row">
              <span className="label">Class:</span>
              <span className="value">{safeRender(data.selectedClass)}</span>
            </div>
            <div className="info-row">
              <span className="label">Background:</span>
              <span className="value">{safeRender(data.selectedBackground)}</span>
            </div>
            <div className="info-row">
              <span className="label">Species:</span>
              <span className="value">{safeRender(data.selectedSpecies)}</span>
            </div>
            <div className="info-row">
              <span className="label">Size:</span>
              <span className="value">{safeRender(data.speciesSize) || 'Medium'}</span>
            </div>
            <div className="info-row">
              <span className="label">Speed:</span>
              <span className="value">{safeRender(data.speciesSpeed) || '30'} ft</span>
            </div>
            <div className="info-row">
              <span className="label">Hit Dice:</span>
              <span className="value">{safeRender(data.hitDice)}</span>
            </div>
            {data.spellcaster && (
              <div className="info-row">
                <span className="label">Spellcasting:</span>
                <span className="value">{safeRender(data.spellcastingAbility)}</span>
              </div>
            )}
          </CharacterInfo>
        </CharacterCard>

        {/* Right Column - Proficiencies */}
        <CharacterCard>
          <h3>Proficiencies</h3>
          <ProficienciesGrid>
            <ProficiencyCard>
              <div className="prof-title">Skills</div>
              <div className="prof-list">{formatList(getAllSkillProficiencies())}</div>
            </ProficiencyCard>

            <ProficiencyCard>
              <div className="prof-title">Saving Throws</div>
              <div className="prof-list">{formatList(data.classProficiencies?.savingThrows)}</div>
            </ProficiencyCard>

            <ProficiencyCard>
              <div className="prof-title">Armor</div>
              <div className="prof-list">{formatList(data.classProficiencies?.armor)}</div>
            </ProficiencyCard>

            <ProficiencyCard>
              <div className="prof-title">Weapons</div>
              <div className="prof-list">{formatList(data.classProficiencies?.weapons)}</div>
            </ProficiencyCard>

            <ProficiencyCard>
              <div className="prof-title">Languages</div>
              <div className="prof-list">{formatList(data.selectedLanguages)}</div>
            </ProficiencyCard>

            <ProficiencyCard>
              <div className="prof-title">Tools</div>
              <div className="prof-list">{formatList(getAllToolProficiencies())}</div>
            </ProficiencyCard>
          </ProficienciesGrid>
        </CharacterCard>
      </ReviewContainer>

      <ReviewContainer>
        <CharacterCard>
          <h3>Spell Summary</h3>
          <SpellSummaryHeader>
            {cantripMax !== null && (cantripMax > 0 || cantripKnownCount > 0) && (
              <SpellCountBadge $invalid={cantripOverflow}>
                Cantrips: {cantripKnownCount}
                {cantripMax !== null && ` / ${cantripMax}`}
              </SpellCountBadge>
            )}
            {preparedMax !== null && (preparedMax > 0 || preparedTracked.length > 0) && (
              <SpellCountBadge $invalid={preparedOverflow}>
                Prepared: {preparedTracked.length}
                {preparedMax !== null && ` / ${preparedMax}`}
              </SpellCountBadge>
            )}
            {flowMode === 'scribe' && (
              <SpellCountBadge>
                Spellbook: {leveledKnownCount}
              </SpellCountBadge>
            )}
            {isLoadingSpellNames && <SpellCountBadge>Loading spell names…</SpellCountBadge>}
          </SpellSummaryHeader>

          {spellLimitWarnings.length > 0 && (
            <StatusMessage type="warning">
              {spellLimitWarnings.map((warning) => (
                <div key={warning}>• {warning}</div>
              ))}
            </StatusMessage>
          )}

          {grantedSpellNames.length > 0 && (
            <Section>
              <div className="section-title">Granted Spells</div>
              <SpellList>
                {grantedSpellNames.map((name, index) => (
                  <SpellListItem key={`granted-${index}`} $granted>
                    {name}
                  </SpellListItem>
                ))}
              </SpellList>
            </Section>
          )}

          {knownSpellNames.length > 0 && (
            <Section>
              <div className="section-title">
                {flowMode === 'scribe' ? 'Spellbook Spells' : 'Spell Repertoire'}
              </div>
              <SpellList>
                {knownSpellNames.map((name, index) => (
                  <SpellListItem key={`known-${index}`}>{name}</SpellListItem>
                ))}
              </SpellList>
            </Section>
          )}

          {(preparedMax !== null || preparedSpellNames.length > 0) && (
            <Section>
              <div className="section-title">Prepared Spells</div>
              {preparedSpellNames.length > 0 ? (
                <SpellList>
                  {preparedSpellNames.map((name, index) => (
                    <SpellListItem key={`prepared-${index}`}>{name}</SpellListItem>
                  ))}
                </SpellList>
              ) : (
                <div className="section-content">No prepared spells selected.</div>
              )}
            </Section>
          )}
        </CharacterCard>

        {hasManaResource && (
          <CharacterCard>
            <h3>Mana Resources</h3>
            <Section>
              <div className="section-title">Mana Pool</div>
              <div className="section-content">
                Current: {data.resources?.manaCurrent ?? 0}
                <br />
                Maximum: {data.resources?.manaMax ?? 0}
              </div>
            </Section>
          </CharacterCard>
        )}
      </ReviewContainer>

      {/* Features & Abilities - New Structured Display */}
      <ReviewContainer>
        <CharacterCard style={{ gridColumn: '1 / -1' }}>
          <h3>Features & Abilities</h3>
          {(() => {
            try {
              const characterSheet = mapGeneratorDataToCharacterSheet(data);
              return (
                <StructuredFeaturesDisplay
                  features={characterSheet.features!}
                  compactMode={false}
                  showFilters={false}
                  characterData={data}
                />
              );
            } catch (error) {
              logger.error('Error rendering features:', error);
              return (
                <div style={{ color: '#ff6b6b', padding: '1rem', textAlign: 'center' }}>
                  Error loading features. Check console for details.
                </div>
              );
            }
          })()}
        </CharacterCard>

        <CharacterCard>
          <h3>Equipment</h3>

          <Section>
            <div className="section-title">Starting Equipment</div>
            <div className="section-content">
              {getAllEquipment().length > 0 ? (
                getAllEquipment().map((item, index) => (
                  <div key={index} className="list-item">{item}</div>
                ))
              ) : (
                <div>No equipment recorded</div>
              )}
            </div>
          </Section>

          {data.speciesDarkvision && data.speciesDarkvision > 0 && (
            <Section>
              <div className="section-title">Special Senses</div>
              <div className="section-content">
                <div className="list-item">Darkvision {data.speciesDarkvision} ft</div>
              </div>
            </Section>
          )}

          {data.speciesResistances && data.speciesResistances.length > 0 && (
            <Section>
              <div className="section-title">Damage Resistances</div>
              <div className="section-content">
                {data.speciesResistances.map((resistance, index) => (
                  <div key={index} className="list-item">{resistance}</div>
                ))}
              </div>
            </Section>
          )}
        </CharacterCard>
      </ReviewContainer>

      {createStatus && (
        <StatusMessage type={createStatus}>
          {createStatus === 'success' ? (
            '🎉 Character created successfully! Redirecting to character sheet...'
          ) : (
            '❌ Error creating character. Please try again.'
          )}
        </StatusMessage>
      )}

    </StepContainer>
  );
};
