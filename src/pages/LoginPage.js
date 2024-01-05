import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage({ setIsAuthenticated, setUserName }) {
  const [password, setPassword] = useState('');
  const [userName, setUserNameState] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (password === "marenostrum") {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userName', userName);
      const expiryTime = new Date().getTime() + 20 * 60000; // 20 minutes from now
      localStorage.setItem('authExpiry', expiryTime);
      setUserName(userName)
      setIsAuthenticated(true);
      navigate('/marrojo2023/gallery');

      setTimeout(() => {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authExpiry');
        navigate('/');
      }, 20 * 60000); // Log out after 20 minutes
    } else {
      alert("Incorrect password");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md flex items-center space-x-4">
          <form>
        <div className="flex flex-col items-center">
          <input
            type="text"
            className="mb-4 px-4 py-2 border rounded-md"
            placeholder="Ingresa tu nombre"
            value={userName}
            onChange={(e) => setUserNameState(e.target.value)}
          />
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
          </form>
      </div>
    </div>
  );
}

export default LoginPage;
