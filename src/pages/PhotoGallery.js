import React, { useEffect, useState } from 'react';
import PhotoUpload from '../components/PhotoUpload';
import PhotoCard from '../components/PhotoCard';
import { storage } from '../firebase/firebaseConfig'; // Ensure this path matches your Firebase config file
import { ref, listAll, getDownloadURL } from 'firebase/storage';

function PhotoGallery() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const fetchPhotos = async () => {
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
    };

    fetchPhotos();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Photo Gallery</h1>
      <PhotoUpload />
      <div className="grid grid-cols-3 gap-4">
        {photos.map((url, index) => (
          <PhotoCard key={index} url={url} />
        ))}
      </div>
    </div>
  );
}

export default PhotoGallery;
