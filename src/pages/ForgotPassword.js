import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { auth } from '../services/firebase';

const ForgotPasswordContainer = styled.div`
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

const SuccessMessage = styled.div`
  color: var(--accent-green);
  margin-top: 10px;
  text-align: center;
  padding: 10px;
  background-color: rgba(0, 255, 0, 0.1);
  border-radius: 5px;
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

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      await auth.sendPasswordResetEmail(email);
      setMessage('Password reset email sent! Check your inbox.');
      setEmail('');
    } catch (error) {
      let errorMessage = 'Failed to send password reset email';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
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
    <ForgotPasswordContainer>
      <Title>Reset Password</Title>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {message && <SuccessMessage>{message}</SuccessMessage>}
      
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
        
        <Button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </Form>
      
      <LinkContainer>
        <div>
          <StyledLink to="/login">Back to Login</StyledLink>
        </div>
      </LinkContainer>
    </ForgotPasswordContainer>
  );
};

export default ForgotPassword;