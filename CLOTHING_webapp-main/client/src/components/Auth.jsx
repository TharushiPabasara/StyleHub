import React, { useState, useContext } from 'react';
import './Auth.css';
import { X, Mail, Lock, User as UserIcon, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authBg from "../assets/images/auth-bg.jpg";
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config/api';

const AuthModal = ({ isOpen, onClose }) => {
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot', 'support'
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [issueType, setIssueType] = useState('login');
  const [messageText, setMessageText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let endpoint = '';
      let payload = {};

      if (view === 'login') {
        endpoint = '/api/auth/login';
        payload = { email, password };
      } else if (view === 'register') {
        endpoint = '/api/auth/register';
        payload = { name, email, password };
      } else if (view === 'forgot') {
        endpoint = '/api/auth/forgotpassword';
        payload = { email };
      } else if (view === 'support') {
        endpoint = '/api/tickets';
        payload = { name, email, issueType, message: messageText };
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (view === 'login') {
          login(data);
          onClose();
          if (['developer', 'owner', 'inventory_handler', 'sales_staff'].includes(data.role)) {
            navigate('/admin/dashboard');
          }
        } else if (view === 'register') {
          if (data.token) {
            login(data);
            onClose();
          } else {
            setSuccess('Registration successful! You can now sign in.');
            setView('login');
          }
        } else if (view === 'forgot') {
          setSuccess('If an account exists, a password reset email has been sent.');
        } else if (view === 'support') {
          setSuccess('Your support ticket has been submitted. We will contact you soon.');
          setView('login');
          setMessageText('');
          setName('');
        }
      } else {
        setError(data.message || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => {
    if (view === 'login') return { title: 'Welcome Back', subtitle: 'Enter your details to access your account.' };
    if (view === 'register') return { title: 'Join StyleHub', subtitle: 'Create an account for exclusive access.' };
    if (view === 'forgot') return { title: 'Reset Password', subtitle: 'Enter your email to receive a reset link.' };
    if (view === 'support') return { title: 'Contact Support', subtitle: 'Let us know how we can help you.' };
  };

  return (
    <div className="auth-overlay">
      <div className="auth-container">
        <button className="auth-close" onClick={onClose}>
          <X size={24} strokeWidth={1.5} />
        </button>
        <div className="auth-image-side">
          <img src={authBg} alt="Fashion" className="auth-image" />
          <div className="auth-image-overlay">
            <h2 className="auth-image-title">StyleHub.</h2>
            <p className="auth-image-subtitle">Discover the silence of form.</p>
          </div>
        </div>
        <div className="auth-form-side">
          <div className="auth-form-header">
            <h2>{renderHeader().title}</h2>
            <p>{renderHeader().subtitle}</p>
          </div>
          
          {error && <div className="text-red-500 text-sm text-center mb-4">{error}</div>}
          {success && <div className="text-green-600 text-sm text-center mb-4">{success}</div>}

          <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
            {(view === 'register' || view === 'support') && (
              <div className="input-group">
                <UserIcon className="input-icon" size={20} />
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            
            <div className="input-group">
              <Mail className="input-icon" size={20} />
              <input 
                type="email" 
                placeholder="Email Address" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="new-email"
              />
            </div>

            {view !== 'forgot' && view !== 'support' && (
              <div className="input-group relative">
                <Lock className="input-icon" size={20} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button 
                  type="button" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            )}

            {view === 'support' && (
              <>
                <div className="input-group">
                  <select 
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    required
                    style={{width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #eee', borderRadius: '4px', appearance: 'none', background: '#f9f9f9', outline: 'none'}}
                  >
                    <option value="login">Login Issue</option>
                    <option value="registration">Registration Issue</option>
                    <option value="other">Other Issue</option>
                  </select>
                </div>
                <div className="input-group">
                  <textarea 
                    placeholder="Describe your issue..."
                    required
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    style={{width: '100%', padding: '12px', border: '1px solid #eee', borderRadius: '4px', minHeight: '100px', resize: 'none', background: '#f9f9f9', outline: 'none', fontFamily: 'inherit', fontSize: '14px'}}
                  ></textarea>
                </div>
              </>
            )}
            
            {view === 'login' && (
              <a href="#forgot" onClick={(e) => { e.preventDefault(); setView('forgot'); setError(''); setSuccess(''); }} className="forgot-password">
                Forgot password?
              </a>
            )}
            
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Processing...' : (
                view === 'login' ? 'Sign In' : (view === 'register' ? 'Create Account' : (view === 'forgot' ? 'Send Reset Link' : 'Submit Ticket'))
              )}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="auth-toggle">
            {view === 'login' && (
              <p>Don't have an account? <span onClick={() => { setView('register'); setError(''); setSuccess(''); }}>Sign up</span></p>
            )}
            {(view === 'register' || view === 'forgot' || view === 'support') && (
              <p>Already have an account? <span onClick={() => { setView('login'); setError(''); setSuccess(''); }}>Sign in</span></p>
            )}
            {(view === 'login' || view === 'register') && (
              <p className="mt-2 text-xs text-gray-500 flex justify-center items-center gap-1">Having trouble? <span onClick={() => { setView('support'); setError(''); setSuccess(''); }} style={{cursor: 'pointer', textDecoration: 'underline', color: 'black'}}>Contact Support</span></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
