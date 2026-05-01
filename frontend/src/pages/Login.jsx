import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, Mail, ChevronRight, User as UserIcon, SunMedium, Wheat, Cog } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    let result;
    if (isLogin) {
      result = await login(email, password);
    } else {
      result = await signup(fullName, email, password);
    }
    
    if (result.success) {
      navigate(isLogin ? '/' : '/events');
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="brand-showcase">
          <div className="brand-mark" aria-hidden="true" style={{ transform: 'scale(2.5)', marginBottom: '2rem', transformOrigin: 'left' }}>
            <div className="brand-mark-inner">
              <SunMedium size={18} className="brand-mark-sun" />
              <Wheat size={18} className="brand-mark-leaf" />
              <Cog size={18} className="brand-mark-cog" />
            </div>
          </div>
          <h1>Chanakya University<br/>Event Intelligence Portal</h1>
          <p>The official platform for campus activities, analytics, and event management.</p>
        </div>
        <div className="login-pattern"></div>
      </div>
      
      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p>{isLogin ? 'Please sign in to your official account.' : 'Sign up to register for events.'}</p>
          </div>

          {error && (
            <div className="alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-icon-wrapper">
                  <UserIcon className="input-icon" size={18} />
                  <input 
                    type="text" 
                    className="form-control with-icon"
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin} 
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Institutional Email</label>
              <div className="input-icon-wrapper">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  className="form-control with-icon"
                  placeholder="e.g. nived.joseph.org@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-icon-wrapper">
                <Lock className="input-icon" size={18} />
                <input 
                  type="password" 
                  className="form-control with-icon"
                  placeholder={isLogin ? "Demo: demo_hash_4" : "Choose a secure password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              {isLogin && (
                <div className="forgot-link">
                  <span style={{ color: 'var(--text-secondary)' }}>Demo mode: use one of the seeded accounts below.</span>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading} style={{ background: isLogin ? '' : 'linear-gradient(135deg, #10b981 0%, #047857 100%)', boxShadow: isLogin ? '' : '0 4px 14px rgba(16, 185, 129, 0.3)' }}>
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              {!isLoading && <ChevronRight size={18} />}
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ border: 'none', color: 'var(--text-secondary)' }}
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
          
          <div className="login-footer">
            <p>Need access? Contact the IT Administration desk.</p>
            
            <div className="demo-credentials">
              <strong>Demo Accounts:</strong>
              <ul>
                <li>Admin: <code>admin.office.adm@campus.edu</code> (demo_hash_7)</li>
                <li>Organizer: <code>nived.joseph.org@campus.edu</code> (demo_hash_4)</li>
                <li>Student: <code>ananya.nair.stu@campus.edu</code> (demo_hash_1)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
