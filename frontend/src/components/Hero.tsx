import React from 'react';
import styled from 'styled-components';

interface HeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  height?: string;
}

// Import medieval fonts
const FontImport = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:wght@400;600&display=swap');
`;

const HeroContainer = styled.div<{ backgroundImage: string; height: string }>`
  position: relative;
  width: calc(100% - 40px); /* Constrain width to account for margins */
  max-width: 1200px; /* Match your ContentContainer max-width */
  margin: 0 auto; /* Center the container */
  height: ${(props) => props.height};
  background-image: url('${(props) => props.backgroundImage}');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0 0 25px 25px; /* Add rounded bottom corners */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); /* Soft shadow below */

  @media (max-width: 768px) {
    width: calc(100% - 20px);
  }

  @media (max-width: 480px) {
    width: calc(100% - 10px);
  }

  /* Dark medieval overlay */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(44, 24, 16, 0.4) 0%,
      rgba(44, 24, 16, 0.7) 50%,
      rgba(44, 24, 16, 0.4) 100%
    );
    z-index: 1;
  }

  /* Medieval parchment texture overlay */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><filter id="medievalTexture"><feTurbulence baseFrequency="0.02" numOctaves="4" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0.5"/></filter></defs><rect width="100" height="100" fill="rgba(212,175,55,0.05)" filter="url(%23medievalTexture)"/></svg>')
      repeat;
    z-index: 2;
  }

  @media (max-width: 768px) {
    height: 200px;
  }

  @media (max-width: 480px) {
    height: 180px;
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 3;
  text-align: center;
  color: #d4af37;
  padding: 1rem;
  max-width: 800px;
`;

const HeroTitle = styled.h1`
  font-size: clamp(2rem, 8vw, 4rem);
  font-weight: 700;
  margin: 0;
  font-family: 'Cinzel', serif;
  letter-spacing: 2px;
  color: #d4af37;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px rgba(212, 175, 55, 0.4),
    0 0 20px rgba(212, 175, 55, 0.2);

  /* Medieval gold gradient effect */
  background: linear-gradient(
    135deg,
    #d4af37 0%,
    #ffd700 25%,
    #fff8dc 50%,
    #ffd700 75%,
    #d4af37 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  /* Fallback for browsers that don't support background-clip */
  @supports not (-webkit-background-clip: text) {
    color: #d4af37;
  }

  /* Enhanced glow effect */
  filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.5));

  @media (max-width: 768px) {
    font-size: clamp(1.8rem, 10vw, 3rem);
    letter-spacing: 1px;
  }

  @media (max-width: 480px) {
    font-size: clamp(1.5rem, 12vw, 2.5rem);
    letter-spacing: 0.5px;
  }
`;

const HeroSubtitle = styled.h2`
  font-size: clamp(1rem, 3vw, 1.5rem);
  font-weight: 400;
  margin: 0.5rem 0 0 0;
  font-family: 'Crimson Text', serif;
  letter-spacing: 1px;
  color: #c9a961;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8), 0 0 5px rgba(201, 169, 97, 0.3);
  font-style: italic;
  opacity: 0.95;

  @media (max-width: 768px) {
    font-size: clamp(0.9rem, 4vw, 1.3rem);
    margin-top: 0.4rem;
    letter-spacing: 0.5px;
  }

  @media (max-width: 480px) {
    font-size: clamp(0.8rem, 5vw, 1.1rem);
    margin-top: 0.3rem;
    letter-spacing: 0.3px;
  }
`;

const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  backgroundImage = '/images/cover.png',
  height = '280px',
}) => {
  return (
    <>
      <FontImport />
      <HeroContainer backgroundImage={backgroundImage} height={height}>
        <HeroContent>
          <HeroTitle>{title}</HeroTitle>
          {subtitle && <HeroSubtitle>{subtitle}</HeroSubtitle>}
        </HeroContent>
      </HeroContainer>
    </>
  );
};

export default Hero;
