import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Verifying your email...');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const verifyUserEmail = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/verify/${token}`, {
          method: 'GET'
        });
        
        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage('Email verified successfully! You are now logged in.');
          login(data);
          
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Invalid or expired verification link.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Failed to connect to the server.');
      }
    };

    verifyUserEmail();
  }, [token, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 border border-gray-200 text-center">
        <h2 className="text-3xl font-serif mb-4">StyleHub.</h2>
        
        {status === 'verifying' && (
          <p className="text-gray-500 mb-6">{message}</p>
        )}

        {status === 'success' && (
          <div>
            <div className="w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 mb-6">{message}</p>
            <p className="text-sm text-gray-400">Redirecting to homepage...</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-16 h-16 mx-auto bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-500 mb-6">{message}</p>
            <Button type="primary" className="bg-black w-full h-12 rounded-none" onClick={() => navigate('/')}>
              Return to Homepage
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
