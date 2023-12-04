import React, { useState } from 'react';
import { storage } from '../firebase/firebaseConfig'; // Ensure this path matches your Firebase config file
import { ref, uploadBytes } from 'firebase/storage';

function PhotoUpload() {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (file) {
      const storageRef = ref(storage, `photos/${file.name}`);
      try {
        await uploadBytes(storageRef, file);
        alert('Photo uploaded successfully');
      } catch (error) {
        alert('Upload failed: ' + error.message);
      }
    } else {
      alert('Please select a file to upload');
    }
  };

  return (
    <div className="my-4">
      <input type="file" onChange={handleFileChange} />
      <button 
        className="px-4 py-2 bg-green-500 text-white rounded-md"
        onClick={handleUpload}
      >
        Upload
      </button>
    </div>
  );
}

export default PhotoUpload;
