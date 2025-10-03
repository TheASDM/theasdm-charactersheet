import styled from 'styled-components';
interface ResourceData {
  id: string;
  name: string;
  type: 'checkbox' | 'counter' | 'pool';
  current: number;
  max: number;
}

interface CompactResourcesBarProps {
  characterResources: ResourceData[];
  resources: {
    handleResourceUpdate: (resourceId: string, newValue: number) => void;
  };
}

const ResourcesBarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 0.5rem 1rem;
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #8b6914;
  border-radius: 8px;
  margin: 0.5rem 0;
  min-height: 40px;
  flex-wrap: wrap;
`;

const ResourceItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
`;

const ResourceLabel = styled.span`
  color: #d4af37;
  font-weight: 600;
  font-size: 0.8rem;
  min-width: fit-content;
`;

const ResourceBoxes = styled.div`
  display: flex;
  gap: 2px;
`;

const ResourceBox = styled.div<{ $filled?: boolean; $isWounds?: boolean }>`
  width: 16px;
  height: 16px;
  border: 1px solid ${props => props.$isWounds ? '#dc3545' : '#8b6914'};
  background: ${props => {
    if (props.$filled) {
      return props.$isWounds ? '#dc3545' : '#d4af37';
    }
    return 'rgba(26, 26, 26, 0.6)';
  }};
  border-radius: 2px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    border-color: ${props => props.$isWounds ? '#ff4757' : '#f4d03f'};
  }

  input {
    opacity: 0;
    position: absolute;
    width: 100%;
    height: 100%;
    margin: 0;
    cursor: pointer;
  }
`;

const SkullOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  pointer-events: none;
`;

const PoolDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(40, 40, 40, 0.8);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  border: 1px solid #555;
  font-size: 0.8rem;

  .current {
    color: #f0f0f0;
    font-weight: 600;
    min-width: 20px;
    text-align: center;
  }

  .separator {
    color: #8b6914;
    font-weight: 600;
  }

  .max {
    color: #d4af37;
    font-weight: 600;
    min-width: 20px;
    text-align: center;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin-left: 0.25rem;
  }

  .control-btn {
    background: rgba(139, 105, 20, 0.3);
    border: 1px solid #8b6914;
    color: #d4af37;
    width: 16px;
    height: 12px;
    font-size: 8px;
    line-height: 1;
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(139, 105, 20, 0.5);
      transform: scale(1.1);
    }
  }
`;

const CounterOverflow = styled.span`
  font-size: 0.7rem;
  color: #8b6914;
  margin-left: 0.25rem;
  font-weight: 600;
`;

export default function CompactResourcesBar({
  characterResources,
  resources,
}: CompactResourcesBarProps) {
  return (
    <ResourcesBarContainer>
      {/* Character Resources */}
      {characterResources.map((resource) => (
        <ResourceItem key={resource.id}>
          <ResourceLabel>{resource.name}</ResourceLabel>

          {resource.type === 'checkbox' && (
            <ResourceBoxes>
              <ResourceBox $filled={resource.current > 0}>
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

          {resource.type === 'counter' && resource.name === 'Wounds' && (
            <ResourceBoxes>
              {Array.from({ length: resource.max }, (_, index) => {
                const woundLevel = index + 1;
                return (
                  <ResourceBox
                    key={index}
                    $filled={resource.current >= woundLevel}
                    $isWounds
                  >
                    <input
                      type="checkbox"
                      checked={resource.current >= woundLevel}
                      onChange={() => {
                        if (resource.current === woundLevel) {
                          resources.handleResourceUpdate(resource.id, 0);
                        } else {
                          resources.handleResourceUpdate(resource.id, woundLevel);
                        }
                      }}
                    />
                    {woundLevel === 6 && <SkullOverlay>💀</SkullOverlay>}
                  </ResourceBox>
                );
              })}
            </ResourceBoxes>
          )}

          {resource.type === 'counter' && resource.name !== 'Wounds' && (
            <>
              <ResourceBoxes>
                {Array.from({ length: Math.min(resource.max, 6) }, (_, index) => (
                  <ResourceBox
                    key={index}
                    $filled={resource.current > index}
                  >
                    <input
                      type="checkbox"
                      checked={resource.current > index}
                      onChange={() => {
                        if (resource.current === index + 1) {
                          resources.handleResourceUpdate(resource.id, index);
                        } else {
                          resources.handleResourceUpdate(resource.id, index + 1);
                        }
                      }}
                    />
                  </ResourceBox>
                ))}
              </ResourceBoxes>
              {resource.max > 6 && (
                <CounterOverflow>+{resource.max - 6}</CounterOverflow>
              )}
            </>
          )}

          {resource.type === 'pool' && (
            <PoolDisplay>
              <div className="current">{resource.current}</div>
              <div className="separator">/</div>
              <div className="max">{resource.max}</div>
              <div className="controls">
                <button
                  className="control-btn"
                  onClick={() =>
                    resources.handleResourceUpdate(resource.id, resource.current + 1)
                  }
                >
                  ▲
                </button>
                <button
                  className="control-btn"
                  onClick={() =>
                    resources.handleResourceUpdate(resource.id, resource.current - 1)
                  }
                >
                  ▼
                </button>
              </div>
            </PoolDisplay>
          )}
        </ResourceItem>
      ))}
    </ResourcesBarContainer>
  );
}
