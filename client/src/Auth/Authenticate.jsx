import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import toast from 'shared/utils/toast';
import { PageLoader } from 'shared/components';
import authService from 'config/authService';

const Authenticate = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: authListener } = authService.onAuthStateChange((event, session) => {
      console.log('Auth state in Authenticate:', event, !!session?.user);
      if (event === 'SIGNED_IN' && session?.user) {
        history.push('/project');
      }
    });

    const checkSession = async () => {
      const user = await authService.getCurrentUser();
      if (user) history.push('/project');
    };

    checkSession();

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [history]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.includes('@')) return toast.error('Enter a valid email address.');
    if (password.length < 6) return toast.error('Password must be at least 6 characters.');

    setLoading(true);
    try {
      const { user: loginUser, error: loginError } = await authService.signIn(email, password);

      if (loginError) {
        if (loginError.message.includes('Invalid login credentials')) {
          const { user: signupUser, error: signupError } = await authService.signUp(email, password);
          if (signupError) throw signupError;

          if (signupUser?.email_confirmed_at === null) {
            toast.success('Signup successful. Please confirm your email.');
            setLoading(false);
            return;
          }

          await authService.createUserProfile(signupUser);
          toast.success('Signup successful!');
          history.push('/project');
        } else {
          throw loginError;
        }
      } else {
        toast.success('Login successful!');
        history.push('/project');
      }
    } catch (error) {
      console.error('Authentication Error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { success, error } = await authService.signOut();
      if (success) {
        toast.success('Successfully logged out!');
        history.push('/authenticate');
      } else throw error;
    } catch (error) {
      toast.error('Error logging out');
      console.error('Logout error:', error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Authenticate</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.primaryButton}>
            {loading ? 'Processing...' : 'Continue'}
          </button>
        </form>

        {loading && <PageLoader />}

        <button onClick={handleLogout} style={styles.secondaryButton}>
          Log Out
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '20px',
  },
  card: {
    background: '#ffffff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  },
  heading: {
    fontSize: '1.8rem',
    marginBottom: '20px',
    color: '#111827',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '5px',
  },
  input: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '10px',
  },
  secondaryButton: {
    backgroundColor: '#e5e7eb',
    color: '#111827',
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '15px',
  },
};

export default Authenticate;
