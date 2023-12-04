import React, { useState } from 'react';

function LoginPage({ history }) {
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (password === "marenostrum") {
      history.push('/marrojo2023/gallery');
    } else {
      alert("Incorrect password");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md flex items-center space-x-4">
        <div className="flex flex-col items-center">
          <input 
            type="password"
            className="px-4 py-2 border rounded-md"
            placeholder="Enter Password"
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
          />
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
            onClick={handleLogin}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
