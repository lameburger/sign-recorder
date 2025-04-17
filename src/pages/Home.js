import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
`;

const Title = styled.h1`
  color: var(--accent-green);
  font-size: 2.5rem;
  margin-bottom: 20px;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  max-width: 800px;
  text-align: center;
  margin-bottom: 40px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 20px;
`;

const StyledButton = styled(Link)`
  background-color: ${props => props.primary ? 'var(--accent-green)' : 'var(--accent-yellow)'};
  color: var(--text-dark);
  padding: 15px 30px;
  border-radius: 5px;
  font-weight: bold;
  text-decoration: none;
  font-size: 1.1rem;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const FeaturesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 30px;
  margin-top: 60px;
  max-width: 1200px;
`;

const FeatureCard = styled.div`
  background-color: var(--background-light);
  border-radius: 10px;
  padding: 30px;
  width: 300px;
  text-align: center;
`;

const FeatureTitle = styled.h3`
  color: var(--accent-yellow);
  margin-bottom: 15px;
`;

const Home = () => {
  return (
    <HomeContainer>
      <Title>Sign Language Recorder</Title>
      <Subtitle>
        Help build a comprehensive sign language dataset by contributing your own sign videos.
        Your contributions will help improve sign language recognition technology and educational tools.
      </Subtitle>
      
      <ButtonContainer>
        <StyledButton to="/upload" primary>Upload Sign</StyledButton>
        <StyledButton to="/browse">Browse Signs</StyledButton>
      </ButtonContainer>
      
      <FeaturesContainer>
        <FeatureCard>
          <FeatureTitle>Multiple Sign Languages</FeatureTitle>
          <p>Support for various sign languages including ASL, BSL, ISL, and more.</p>
        </FeatureCard>
        
        <FeatureCard>
          <FeatureTitle>Easy Recording</FeatureTitle>
          <p>Record 1-3 second videos directly from your browser with our simple interface.</p>
        </FeatureCard>
        
        <FeatureCard>
          <FeatureTitle>Personal Profile</FeatureTitle>
          <p>Track your contributions and manage your uploaded sign videos.</p>
        </FeatureCard>
        
        <FeatureCard>
          <FeatureTitle>Educational Impact</FeatureTitle>
          <p>Your contributions help develop better sign language learning tools for everyone.</p>
        </FeatureCard>
      </FeaturesContainer>
    </HomeContainer>
  );
};

export default Home;