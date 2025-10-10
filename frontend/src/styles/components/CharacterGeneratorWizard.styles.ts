import styled from 'styled-components';

export const WizardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: #f0f0f0;
  font-family: 'Inter', sans-serif;

  .character-generator-wizard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
`;

export const WizardHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;

  h1 {
    font-family: 'Cinzel', serif;
    font-size: 2.5rem;
    color: #ce9016;
    margin-bottom: 1rem;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }
`;

export const WizardProgress = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #3a3a3a 0%, #5a5a5a 100%);
    z-index: 1;
    transform: translateY(-50%);
  }

  &.bottom-progress {
    width: 100%;
    max-width: none;
    margin: 1rem 0;

    &::before {
      height: 1px;
    }
  }

  .progress-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #1a1a1a;
    padding: 0.5rem;
    border-radius: 8px;
    z-index: 2;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 100px;

    .step-number {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #3a3a3a;
      color: #888;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      margin-bottom: 0.5rem;
      transition: all 0.3s ease;
    }

    .step-label {
      font-size: 0.85rem;
      text-align: center;
      color: #888;
      transition: color 0.3s ease;
    }
  }

  &.bottom-progress .progress-step {
    padding: 0.25rem;
    min-width: 80px;
    background: transparent;

    .step-number {
      width: 30px;
      height: 30px;
      margin-bottom: 0.25rem;
      font-size: 0.9rem;
    }

    .step-label {
      font-size: 0.7rem;
    }

    &.current {
      .step-number {
        background: linear-gradient(145deg, #ce9016, #b8860b);
        color: #1a1a1a;
        box-shadow: 0 4px 12px rgba(206, 144, 22, 0.4);
      }

      .step-label {
        color: #ce9016;
        font-weight: 600;
      }
    }

    &.completed {
      .step-number {
        background: linear-gradient(145deg, #4caf50, #45a049);
        color: white;
      }

      .step-label {
        color: #4caf50;
      }

      &:hover {
        .step-number {
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
        }
      }
    }

    &:hover:not(.current) {
      transform: translateY(-2px);

      .step-number {
        background: linear-gradient(145deg, #5a5a5a, #4a4a4a);
        color: #f0f0f0;
        box-shadow: 0 4px 12px rgba(90, 90, 90, 0.3);
      }

      .step-label {
        color: #f0f0f0;
      }
    }
  }
`;

export const WizardContent = styled.div`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #444;
  border-radius: 12px;
  padding: 3rem;
  margin-bottom: 2rem;
  min-height: 500px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;

  .step-placeholder {
    text-align: center;

    h2 {
      font-family: 'Cinzel', serif;
      color: #ce9016;
      margin-bottom: 1rem;
    }

    pre {
      background: #0f0f0f;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 1rem;
      margin-top: 2rem;
      font-size: 0.85rem;
      color: #ccc;
      text-align: left;
      max-height: 300px;
      overflow-y: auto;
    }
  }
`;

export const WizardControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  margin-top: auto;

  .wizard-controls-right {
    margin-left: auto;
  }

  .wizard-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    &:not(:disabled):hover {
      transform: translateY(-2px);
    }

    &.wizard-btn-primary {
      background: linear-gradient(145deg, #ce9016, #b8860b);
      color: #1a1a1a;
      box-shadow: 0 4px 12px rgba(206, 144, 22, 0.3);

      &:not(:disabled):hover {
        box-shadow: 0 6px 16px rgba(206, 144, 22, 0.4);
      }
    }

    &.wizard-btn-secondary {
      background: linear-gradient(145deg, #4a4a4a, #3a3a3a);
      color: #f0f0f0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

      &:not(:disabled):hover {
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
      }
    }
  }
`;

// Step-specific styles
export const StepContainer = styled.div`
  .step-title {
    font-family: 'Cinzel', serif;
    font-size: 1.8rem;
    color: #ce9016;
    margin-bottom: 1rem;
    text-align: center;
  }

  .step-description {
    text-align: center;
    color: #ccc;
    margin-bottom: 2rem;
    font-size: 1.1rem;
  }

  .step-content {
    max-width: 900px;
    margin: 0 auto;
  }
`;

export const FormGroup = styled.div`
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #ce9016;
    font-weight: 600;
    font-size: 1rem;
  }

  input {
    width: 100%;
    padding: 12px 16px;
    background: rgba(26, 26, 26, 0.8);
    border: 2px solid #444;
    border-radius: 8px;
    color: #f0f0f0;
    font-size: 1rem;
    transition: border-color 0.3s ease;

    &:focus {
      outline: none;
      border-color: #ce9016;
      box-shadow: 0 0 0 3px rgba(206, 144, 22, 0.1);
    }

    &::placeholder {
      color: #666;
    }
  }
`;

export const RadioGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;

  .radio-option {
    flex: 1;
    position: relative;

    input[type="radio"] {
      position: absolute;
      opacity: 0;
    }

    label {
      display: block;
      padding: 1rem;
      background: rgba(26, 26, 26, 0.8);
      border: 2px solid #444;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;

      &:hover {
        border-color: #ce9016;
      }
    }

    input[type="radio"]:checked + label {
      border-color: #ce9016;
      background: rgba(206, 144, 22, 0.1);
      color: #ce9016;
    }
  }
`;