import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import toast from 'shared/utils/toast';
import authService from 'config/authService';

const LandingPage = () => {
  const history = useHistory();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = authService.onAuthStateChange((event, session) => {
      console.log('Auth state in Landing Page:', event, !!session?.user);

      if (event === 'SIGNED_IN') {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleGetStarted = () => {
    history.push('/authenticate');
  };

  const handleGoToProject = () => {
    history.push('/project');
  };

  const handleLogout = async () => {
    try {
      const { success, error } = await authService.signOut();

      if (success) {
        toast.success('Successfully logged out!');
        history.push('/authenticate');
      } else {
        throw error;
      }
    } catch (error) {
      toast.error('Error logging out');
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div style={styles.centeredContainer}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.centeredContainer}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Welcome to Jira Clone</h1>
        <p style={styles.subheading}>Click below to start using the app.</p>

        {user ? (
          <div style={styles.innerContent}>
            <h3 style={styles.userEmail}>Welcome back, {user.email}</h3>
            <div style={styles.buttonGroup}>
              <button onClick={handleGoToProject} style={styles.primaryButton}>
                Go to Projects
              </button>
              <button onClick={handleLogout} style={styles.secondaryButton}>
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.buttonGroup}>
            <button onClick={handleGetStarted} style={styles.primaryButton}>
              Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  centeredContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '20px',
  },
  card: {
    textAlign: 'center',
    background: '#ffffff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
    width: '100%',
  },
  heading: {
    fontSize: '2rem',
    marginBottom: '10px',
    color: '#333',
  },
  subheading: {
    fontSize: '1rem',
    marginBottom: '20px',
    color: '#555',
  },
  userEmail: {
    fontSize: '1.1rem',
    marginBottom: '15px',
    color: '#444',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  secondaryButton: {
    backgroundColor: '#e5e7eb',
    color: '#333',
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  innerContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
};

export default LandingPage;
