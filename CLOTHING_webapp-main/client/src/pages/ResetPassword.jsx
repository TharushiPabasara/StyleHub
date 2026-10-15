import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/resetpassword/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (res.ok) {
        login(data);
        navigate('/');
      } else {
        setError(data.message || 'Invalid or expired token');
      }
    } catch (err) {
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 border border-gray-200">
        <h2 className="text-3xl font-serif mb-2 text-center">StyleHub.</h2>
        <p className="text-gray-500 text-center mb-8">Set your new password below.</p>
        
        {error && <div className="text-red-500 text-sm text-center mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center border-b border-gray-300 py-2 relative">
            <Lock className="text-gray-400 mr-3" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="New Password" 
              className="w-full outline-none pr-10 bg-transparent"
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="button" 
              className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          <div className="flex items-center border-b border-gray-300 py-2 relative">
            <Lock className="text-gray-400 mr-3" size={20} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Confirm New Password" 
              className="w-full outline-none pr-10 bg-transparent"
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button 
              type="button" 
              className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            className="bg-black w-full h-12 rounded-none mt-4 uppercase tracking-widest text-xs"
          >
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
