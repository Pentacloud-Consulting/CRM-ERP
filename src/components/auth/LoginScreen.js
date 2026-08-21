'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store/AppContext';
import { User, Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import styles from './LoginScreen.module.css';

export default function LoginScreen() {
  const { dispatch } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay for premium feel
    setTimeout(() => {
      if (username === 'Pentacloud' && password === 'pentacloud@2026') {
        dispatch({ type: 'LOGIN' });
      } else {
        setError('Invalid credentials. Please verify your username and password.');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className={styles.container}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      
      <div className={styles.glassCard}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className={styles.logoText}>FreightFlow AI</div>
        </div>

        <div className={styles.titleBox}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to your CRM & ERP workspace to manage global freight operations.</p>
        </div>

        <form className={styles.form} onSubmit={handleLogin}>
          {error && (
            <div className={styles.errorBox}>
              <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Username</label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.inputIcon} />
              <input 
                type="text" 
                className={styles.input} 
                placeholder="Enter your username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input 
                type="password" 
                className={styles.input} 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className={styles.footer}>
          &copy; {new Date().getFullYear()} Pentacloud Consulting. All rights reserved.
        </div>
      </div>
    </div>
  );
}
