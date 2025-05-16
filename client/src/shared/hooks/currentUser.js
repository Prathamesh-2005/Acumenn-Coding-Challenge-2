// Optimized useCurrentUser hook to work with Supabase
import { useState, useEffect, useRef } from 'react';
import { get } from 'lodash';
import useApi from 'shared/hooks/api';
import supabase from 'config/supaBaseConfig';

const useCurrentUser = ({ cachePolicy = 'cache-first' } = {}) => {
  const [{ data, isLoading, error }] = useApi.get('/user/current', {
    cachePolicy,
    // Custom initialization function to handle Supabase auth
    onInitialize: async (_, __, setLoading, setData, setError) => {
      try {
        // Get the current user from Supabase auth
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          throw authError;
        }
        
        if (!authData?.user) {
          // No user is authenticated
          setData({ user: null });
          return;
        }
        
        // Get additional user data from the user table
        const { data: userData, error: userError } = await supabase
          .from('user')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (userError) {
          throw userError;
        }
        
        // Combine auth data with user profile data
        const combinedUserData = {
          ...userData,
          email: authData.user.email,
          lastSignInAt: authData.user.last_sign_in_at,
        };
        
        setData({ user: combinedUserData });
      } catch (err) {
        console.error('Error fetching current user:', err);
        setError(err);
      }
    }
  });
  
  // Local state for caching the user between renders
  const [currentUser, setCurrentUser] = useState(null);
  
  // Use a ref to prevent unnecessary re-renders
  const isMountedRef = useRef(true);
  
  // Update the cached user when data changes
  useEffect(() => {
    if (data?.user && isMountedRef.current) {
      setCurrentUser(data.user);
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [data]);

  return {
    currentUser: currentUser || get(data, 'user'),
    currentUserId: get(currentUser || data, 'user.id'),
    isLoading,
    error,
  };
};

export default useCurrentUser;


/*// shared/hooks/currentUser.js
import { useState, useEffect } from 'react';
import supabase from '../utils/supabase';

const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setIsLoading(true);
        
        // Get the current session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (session) {
          // Fetch user details from our user table using the session user id
          const { data: userData, error: userError } = await supabase
            .from('user')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userError) throw userError;
          
          setCurrentUser(userData);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching current user:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();

    // Set up authentication state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Fetch user details when signed in
          const { data: userData, error: userError } = await supabase
            .from('user')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (!userError) {
            setCurrentUser(userData);
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        }
      }
    );

    // Clean up subscription on unmount
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  return { currentUser, isLoading, error };
};

export default useCurrentUser; */