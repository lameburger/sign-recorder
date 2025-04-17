import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { auth } from '../services/firebase';

const HeaderContainer = styled.header`
  background-color: var(--background-light);
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  color: var(--accent-green);
  font-size: 24px;
`;

const Nav = styled.nav`
  display: flex;
  gap: 20px;
`;

const NavLink = styled(Link)`
  color: var(--text-light);
  text-decoration: none;
  &:hover {
    color: var(--accent-yellow);
  }
`;

const Button = styled.button`
  background-color: var(--accent-green);
  color: var(--text-dark);
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: var(--accent-yellow);
  }
`;

const Header = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <HeaderContainer>
      <Logo>Sign Recorder</Logo>
      <Nav>
        <NavLink to="/">Home</NavLink>
        {user ? (
          <>
            <NavLink to="/upload">Upload Sign</NavLink>
            <NavLink to="/profile">My Profile</NavLink>
            <Button onClick={handleLogout}>Logout</Button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </Nav>
    </HeaderContainer>
  );
};

export default Header;