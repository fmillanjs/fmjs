import React from 'react';

function PhotoCard({ url }) {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg">
      <img className="w-full" src={url} alt="Uploaded Photo" />
      <div className="px-6 py-4">
        <a href={url} download className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Download
        </a>
      </div>
    </div>
  );
}

export default PhotoCard;
