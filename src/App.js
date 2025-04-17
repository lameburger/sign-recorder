import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './services/firebase';
import GlobalStyles from './styles/GlobalStyles';
import createDummyUser from './services/dummyAuth';

// Components
import Header from './components/Header';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Upload from './pages/Upload';
import Profile from './pages/Profile';

// Protected Route Component
const ProtectedRoute = ({ children, user, redirectPath = '/login' }) => {
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }
  
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create dummy user for easy testing
    createDummyUser();
    
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  return (
    <Router>
      <GlobalStyles />
      <Header user={user} />
      
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute user={user}>
                <Upload />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute user={user}>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          {/* Add a catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
