import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PhotoUpload from '../components/PhotoUpload';
import PhotoCard from '../components/PhotoCard';
import { storage } from '../firebase/firebaseConfig'; // Ensure this path matches your Firebase config file
import { ref, listAll, getDownloadURL, deleteObject } from 'firebase/storage';

function PhotoGallery({ userName }) {
  const [photos, setPhotos] = useState([]);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authExpiry');
    localStorage.removeItem('userName');
    navigate('/marrojo2023'); // Redirect to login page
  };

  const fetchPhotos = useCallback(async () => {
    const photosRef = ref(storage, 'photos');
    try {
      const snapshot = await listAll(photosRef);
      const photoUrls = await Promise.all(
        snapshot.items.map(item => getDownloadURL(item))
      );
      setPhotos(photoUrls);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const refreshGallery = () => {
    fetchPhotos();
  };

  const handleDelete = async (urlToDelete) => {
    try {
      // Find the storage reference from the URL
      const photoRef = ref(storage, urlToDelete);

      // Delete the file
      await deleteObject(photoRef);

      // Update the state to remove the photo from the gallery
      setPhotos(photos.filter(url => url !== urlToDelete));
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Photo Gallery</h1>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-700"
      >
        Logout
      </button>
      <PhotoUpload onUploadComplete={refreshGallery} />
      <div className="grid grid-cols-3 gap-4">
        {photos.map((url, index) => (
          <PhotoCard userName={userName} key={index} url={url} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}

export default PhotoGallery;
