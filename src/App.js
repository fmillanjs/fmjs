import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PhotoGallery from './pages/PhotoGallery';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/marrojo2023" element={<LoginPage />} />
        <Route path="/marrojo2023/gallery" element={<PhotoGallery />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
