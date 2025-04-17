import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { auth } from '../services/firebase';

const LoginContainer = styled.div`
  max-width: 400px;
  margin: 40px auto;
  padding: 30px;
  background-color: var(--background-light);
  border-radius: 10px;
`;

const Title = styled.h2`
  color: var(--accent-green);
  margin-bottom: 20px;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-weight: bold;
  color: var(--accent-yellow);
`;

const Input = styled.input`
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #333;
  background-color: var(--background-dark);
  color: var(--text-light);
`;

const Button = styled.button`
  background-color: var(--accent-green);
  color: var(--text-dark);
  padding: 12px;
  border-radius: 5px;
  font-weight: bold;
  margin-top: 10px;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  margin-top: 10px;
  text-align: center;
`;

const LinkContainer = styled.div`
  margin-top: 20px;
  text-align: center;
`;

const StyledLink = styled(Link)`
  color: var(--accent-yellow);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await auth.signInWithEmailAndPassword(email, password);
      navigate('/');
    } catch (error) {
      let errorMessage = 'Failed to log in';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        default:
          errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <Title>Login</Title>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Email</Label>
          <Input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Password</Label>
          <Input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormGroup>
        
        <Button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </Form>
      
      <LinkContainer>
        <div>
          <StyledLink to="/forgot-password">Forgot Password?</StyledLink>
        </div>
        <div style={{ marginTop: '10px' }}>
          Don't have an account? <StyledLink to="/register">Register</StyledLink>
        </div>
      </LinkContainer>
    </LoginContainer>
  );
};

export default Login;