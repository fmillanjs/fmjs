import React from 'react';

function PhotoCard({ url, onDelete, userName }) {
  const handleDelete = () => {
    onDelete(url);
  };

  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg flex flex-col">
      <div className="flex-grow"> {/* Container for the image */}
        <img className="w-full h-auto" src={url} alt="Uploaded Photo" />
      </div>
      <div className="px-6 py-4 flex justify-between items-center"> {/* Container for the buttons */}
        <a href={url} download className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Download
        </a>
        {userName && <span className="ml-4 text-sm">Subido por: {userName}</span>}
        {/* <button 
          onClick={handleDelete} 
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Delete
        </button> */}
      </div>
    </div>
  );
}

export default PhotoCard;
