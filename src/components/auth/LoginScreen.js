'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import { ShieldAlert } from 'lucide-react';
import styles from './LoginScreen.module.css';

export default function LoginScreen() {
  const router = useRouter();
  const { dispatch } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (email === 'Pentacloud' && password === 'pentacloud@2026') {
        dispatch({ type: 'LOGIN' });
        router.push('/dashboard');
      } else {
        setError('Invalid credentials. Please verify your email and password.');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className={styles.splitContainer}>
      {/* LEFT PANEL */}
      <div className={styles.leftPanel}>
        <div className={styles.abstractBg}>
          <div className={styles.routeLine1} />
          <div className={styles.routeLine2} />
        </div>
        
        <div className={styles.branding}>
          <div className={styles.logoIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className={styles.logoText}>FreightFlow AI</div>
        </div>

        <div className={styles.leftContent}>
          <h1 className={styles.tagline}>
            Logistics intelligence that <span className={styles.taglineAccent}>delivers</span> on time.
          </h1>
          <p className={styles.subTagline}>
            The world's first AI-powered suite designed to fully automate your air, sea, and road freight operations.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Sign in to your account</h2>
            <p className={styles.formSubtitle}>Welcome back! Please enter your details.</p>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          <form className={styles.form} onSubmit={handleLogin}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Email or Username</label>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Password</label>
              <input 
                type="password" 
                className={styles.input} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputOptions}>
              <label className={styles.rememberMe}>
                <input type="checkbox" className={styles.checkbox} />
                Remember for 30 days
              </label>
              <a href="#" className={styles.forgotLink}>Forgot password?</a>
            </div>

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className={styles.divider}>or</div>

          <button className={styles.ssoButton} type="button">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          <div className={styles.footer}>
            Don't have an account? <a href="#" className={styles.contactLink}>Contact Sales</a>
          </div>
        </div>
      </div>
    </div>
  );
}
