import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PhotoGallery from './pages/PhotoGallery';
import { ProtectedRoute } from './components/ProtectedRoute';
import MainPage from './pages/MainPage';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const expiryTime = localStorage.getItem('authExpiry');
    if (isAuthenticated && expiryTime && new Date().getTime() < expiryTime) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
      <Routes>
      <Route path="/" element={MainPage} />
      <Route path="/marrojo2023" element={<LoginPage setIsAuthenticated={setIsAuthenticated} setUserName={setUserName} />} />
      <Route path="/marrojo2023/gallery" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
          <PhotoGallery userName={userName} />
          </ProtectedRoute>
        } />
      </Routes>
  );
}

export default App;
