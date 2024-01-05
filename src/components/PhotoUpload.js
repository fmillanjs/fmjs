import React, { useState, useRef } from 'react';
import { storage } from '../firebase/firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

function PhotoUpload({ onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(file =>
      file.type.match('image.*') || file.type.match('video.*')
    );
    setFiles(selectedFiles);
    setProgress(0);
    setUploading(false);
  };

  const handleUpload = async () => {
    if (files.length > 0) {
      setUploading(true);
      const totalFiles = files.length;
      let uploadedFiles = 0;

      for (const file of files) {
        const storageRef = ref(storage, `photos/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
          (snapshot) => {
            const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(prog);
          },
          (error) => {
            alert('Upload failed for ' + file.name + ': ' + error.message);
            setUploading(false);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              console.log('File available at', downloadURL);
            });
            uploadedFiles++;
            if (uploadedFiles === totalFiles) {
              onUploadComplete();
              setUploading(false);
              fileInputRef.current.value = ''; // Reset the file input
            }
          }
        );
      }
    } else {
      alert('Please select files to upload');
    }
  };

  return (
    <div className="my-4 p-4 border border-dashed border-gray-300 rounded-lg">
      <p className="text-center text-lg mb-4">Upload Your Photos or Videos</p>
      <p className="text-center mb-4">Select multiple files (images or videos) to upload. The progress bar will show the upload progress.</p>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0
                   file:text-sm file:font-semibold
                   file:bg-blue-50 file:text-blue-700
                   hover:file:bg-blue-100"
      />
      <button
        className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        onClick={handleUpload}
        disabled={uploading}
      >
        Upload
      </button>
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full mt-2">
          <div
            style={{ width: `${progress}%` }}
            className="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full transition-all duration-500 ease-out"
          >{progress.toFixed(0)}%</div>
        </div>
      )}
    </div>
  );
}

export default PhotoUpload;
