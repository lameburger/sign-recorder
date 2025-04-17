import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { auth } from '../services/firebase';

const RegisterContainer = styled.div`
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

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validatePassword()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Create user
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      
      // Update profile with display name
      await auth.updateProfile(userCredential.user, {
        displayName: name
      });
      
      navigate('/');
    } catch (error) {
      let errorMessage = 'Failed to create account';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email already in use';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
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
    <RegisterContainer>
      <Title>Register</Title>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Name</Label>
          <Input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormGroup>
        
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
        
        <FormGroup>
          <Label>Confirm Password</Label>
          <Input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </FormGroup>
        
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Register'}
        </Button>
      </Form>
      
      <LinkContainer>
        Already have an account? <StyledLink to="/login">Login</StyledLink>
      </LinkContainer>
    </RegisterContainer>
  );
};

export default Register;