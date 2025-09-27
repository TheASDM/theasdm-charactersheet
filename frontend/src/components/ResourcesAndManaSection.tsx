import { CharacterSheetData } from '../types/characterSheet';
import {
  TwoColumnLayout,
  ResourceSection,
  ResourceContent,
  ResourceTrackerWrapper,
  ResourceName,
  ResourceBoxes,
  ResourceBox,
  SkullOverlay,
  PoolCounter,
  ManaSection,
  ManaTitle,
  ManaContent,
  ManaDisplay,
  SectionTitle,
  SectionEditControls,
  SectionEditButton,
} from '../styles/components';

interface ResourceData {
  id: string;
  name: string;
  type: 'checkbox' | 'counter' | 'pool';
  current: number;
  max: number;
}

interface ResourcesAndManaSectionProps {
  character: CharacterSheetData;
  characterResources: ResourceData[];
  needsManaTracking: boolean;
  editingSections: { mana: boolean };
  updateCharacter: (updates: Partial<CharacterSheetData>) => void;
  toggleSectionEdit: (section: 'abilities' | 'stats' | 'skills' | 'spells' | 'mana' | 'characterInfo' | 'actions' | 'inventory') => void;
  cancelSectionEdit: (section: 'abilities' | 'stats' | 'skills' | 'spells' | 'mana' | 'characterInfo' | 'actions' | 'inventory') => void;
  resources: {
    handleResourceUpdate: (resourceId: string, newValue: number) => void;
    handleManaUpdate: (type: 'current' | 'max', change: number) => void;
  };
}

export default function ResourcesAndManaSection({
  character,
  characterResources,
  needsManaTracking,
  editingSections,
  updateCharacter,
  toggleSectionEdit,
  cancelSectionEdit,
  resources,
}: ResourcesAndManaSectionProps) {
  return (
    <TwoColumnLayout>
      {/* Dynamic Resource Tracking Section */}
      <ResourceSection
        style={{ flex: needsManaTracking ? '2' : '1', marginTop: '0' }}
      >
        <SectionTitle>Character Resources</SectionTitle>
        <ResourceContent>
          {characterResources.map((resource) => (
            <ResourceTrackerWrapper key={resource.id}>
              <ResourceName>{resource.name}</ResourceName>

              {resource.type === 'checkbox' && (
                <ResourceBoxes>
                  <ResourceBox filled={resource.current > 0}>
                    <input
                      type="checkbox"
                      checked={resource.current > 0}
                      onChange={() =>
                        resources.handleResourceUpdate(
                          resource.id,
                          resource.current > 0 ? 0 : 1
                        )
                      }
                    />
                  </ResourceBox>
                </ResourceBoxes>
              )}

              {resource.type === 'counter' &&
                resource.name === 'Wounds' && (
                  <ResourceBoxes>
                    {Array.from(
                      { length: resource.max },
                      (_, index) => {
                        const woundLevel = index + 1;
                        return (
                          <ResourceBox
                            key={index}
                            filled={resource.current >= woundLevel}
                            isWounds
                          >
                            <input
                              type="checkbox"
                              checked={resource.current >= woundLevel}
                              onChange={() => {
                                // If clicking the current max wound level, clear all
                                if (resource.current === woundLevel) {
                                  resources.handleResourceUpdate(
                                    resource.id,
                                    0
                                  );
                                } else {
                                  // Otherwise set wounds to this level
                                  resources.handleResourceUpdate(
                                    resource.id,
                                    woundLevel
                                  );
                                }
                              }}
                            />
                            {woundLevel === 6 && (
                              <SkullOverlay>💀</SkullOverlay>
                            )}
                          </ResourceBox>
                        );
                      }
                    )}
                  </ResourceBoxes>
                )}

              {resource.type === 'counter' &&
                resource.name !== 'Wounds' && (
                  <ResourceBoxes>
                    {Array.from(
                      { length: Math.min(resource.max, 8) },
                      (_, index) => (
                        <ResourceBox
                          key={index}
                          filled={resource.current > index}
                        >
                          <input
                            type="checkbox"
                            checked={resource.current > index}
                            onChange={() => {
                              // If clicking on a filled box at the current max level, reduce by 1
                              if (resource.current === index + 1) {
                                resources.handleResourceUpdate(
                                  resource.id,
                                  index
                                );
                              } else {
                                // Otherwise set to this level
                                resources.handleResourceUpdate(
                                  resource.id,
                                  index + 1
                                );
                              }
                            }}
                          />
                        </ResourceBox>
                      )
                    )}
                    {resource.max > 8 && (
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: '#8b6914',
                          marginLeft: '0.25rem',
                        }}
                      >
                        +{resource.max - 8}
                      </div>
                    )}
                  </ResourceBoxes>
                )}

              {resource.type === 'pool' && (
                <PoolCounter>
                  <div className="current">{resource.current}</div>
                  <div className="separator">/</div>
                  <div className="max">{resource.max}</div>
                  <div className="controls">
                    <button
                      className="control-btn"
                      onClick={() =>
                        resources.handleResourceUpdate(
                          resource.id,
                          resource.current + 1
                        )
                      }
                    >
                      ▲
                    </button>
                    <button
                      className="control-btn"
                      onClick={() =>
                        resources.handleResourceUpdate(
                          resource.id,
                          resource.current - 1
                        )
                      }
                    >
                      ▼
                    </button>
                  </div>
                </PoolCounter>
              )}
            </ResourceTrackerWrapper>
          ))}
        </ResourceContent>
      </ResourceSection>

      {/* Mana Section - Only for spellcasting classes */}
      {needsManaTracking && (
        <ManaSection style={{ flex: '1', marginTop: '0' }}>
          <ManaTitle>Mana</ManaTitle>
          <ManaContent>
            <ManaDisplay>
              <div className="mana-current">
                <input
                  type="number"
                  value={character.mana.current}
                  min="0"
                  onChange={(e) =>
                    updateCharacter({
                      mana: {
                        ...character.mana,
                        current: Math.max(
                          0,
                          parseInt(e.target.value) || 0
                        ),
                      },
                    })
                  }
                />
              </div>
              <div className="mana-separator">/</div>
              <div className="mana-max">
                {editingSections.mana ? (
                  <input
                    type="number"
                    value={character.mana.max}
                    min="0"
                    onChange={(e) =>
                      updateCharacter({
                        mana: {
                          ...character.mana,
                          max: Math.max(
                            0,
                            parseInt(e.target.value) || 0
                          ),
                        },
                      })
                    }
                  />
                ) : (
                  character.mana.max
                )}
              </div>
              <div className="mana-controls">
                <button
                  className="mana-control-btn"
                  onClick={() =>
                    resources.handleManaUpdate('current', 1)
                  }
                  title="Increase Current Mana"
                >
                  ▲
                </button>
                <button
                  className="mana-control-btn"
                  onClick={() =>
                    resources.handleManaUpdate('current', -1)
                  }
                  title="Decrease Current Mana"
                >
                  ▼
                </button>
              </div>
              {editingSections.mana && (
                <div className="mana-controls">
                  <button
                    className="mana-control-btn"
                    onClick={() => resources.handleManaUpdate('max', 1)}
                    title="Increase Max Mana"
                  >
                    ▲
                  </button>
                  <button
                    className="mana-control-btn"
                    onClick={() =>
                      resources.handleManaUpdate('max', -1)
                    }
                    title="Decrease Max Mana"
                  >
                    ▼
                  </button>
                </div>
              )}
            </ManaDisplay>
          </ManaContent>

          <SectionEditControls>
            {editingSections.mana ? (
              <>
                <SectionEditButton
                  variant="save"
                  onClick={() => toggleSectionEdit('mana')}
                >
                  ✓
                </SectionEditButton>
                <SectionEditButton
                  onClick={() => cancelSectionEdit('mana')}
                  style={{
                    background:
                      'linear-gradient(145deg, #dc3545, #c82333)',
                  }}
                >
                  ✕
                </SectionEditButton>
              </>
            ) : (
              <SectionEditButton
                onClick={() => toggleSectionEdit('mana')}
              >
                ✎
              </SectionEditButton>
            )}
          </SectionEditControls>
        </ManaSection>
      )}
    </TwoColumnLayout>
  );
}