// Optimized API hook to integrate with Supabase - Prevents infinite loops
import { useState, useCallback, useEffect, useRef } from 'react';
import supabase from 'config/supaBaseConfig';

const useApi = {
  get: (url, options = {}) => {
    const [state, setState] = useState({
      data: null,
      error: null,
      isLoading: true,
    });

    // Use refs to track request status and prevent duplicates
    const isMountedRef = useRef(true);
    const isLoadingRef = useRef(false);
    const requestIdRef = useRef(0);
    const lastRequestUrlRef = useRef(url);
    const lastOptionsRef = useRef(options);

    const setLocalData = useCallback(
      updater => {
        if (!isMountedRef.current) return;
        
        setState(currentState => ({
          ...currentState,
          data: typeof updater === 'function' ? updater(currentState.data) : updater,
        }));
      },
      []
    );

    const fetchData = useCallback(
      async (newOptions = {}) => {
        // Skip if already loading or component unmounted
        if (isLoadingRef.current || !isMountedRef.current) return;
        
        // Create unique request ID to handle race conditions
        const currentRequestId = ++requestIdRef.current;
        
        // Update loading state
        isLoadingRef.current = true;
        setState(currentState => ({ ...currentState, isLoading: true }));
        
        try {
          // Merge options
          const mergedOptions = { ...options, ...newOptions };
          lastOptionsRef.current = mergedOptions;
          
          // If onInitialize is provided, use it for custom fetching logic
          if (mergedOptions.onInitialize) {
            const result = await mergedOptions.onInitialize(
              null, // request
              null, // controller
              (isLoading) => {
                if (currentRequestId !== requestIdRef.current || !isMountedRef.current) return;
                setState(s => ({ ...s, isLoading }));
              },
              (data) => {
                if (currentRequestId !== requestIdRef.current || !isMountedRef.current) return;
                setState(s => ({ ...s, data, error: null, isLoading: false }));
                isLoadingRef.current = false;
              },
              (error) => {
                if (currentRequestId !== requestIdRef.current || !isMountedRef.current) return;
                setState(s => ({ ...s, error, isLoading: false }));
                isLoadingRef.current = false;
              }
            );
            
            // If onInitialize returns { abort: true }, exit early
            if (result && result.abort) {
              isLoadingRef.current = false;
              return;
            }
          } else {
            // Default handling based on URL pattern
            let data = null;
            
            // Handle different API endpoints
            if (url.startsWith('/project')) {
              // Example: Get project data
              const projectId = url.split('/')[2] || '1'; // Default to project id 1
              
              const { data: projectData, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();
                
              if (error) throw error;
              data = { project: projectData };
            } else if (url.startsWith('/user')) {
              // Example: Get user data
              const userId = url.split('/')[2];
              
              const { data: userData, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
                
              if (error) throw error;
              data = { user: userData };
            }
            
            // Check if this request is still relevant
            if (currentRequestId !== requestIdRef.current || !isMountedRef.current) return;
            
            setState({
              data,
              error: null,
              isLoading: false,
            });
          }
        } catch (error) {
          // Check if this request is still relevant
          if (currentRequestId !== requestIdRef.current || !isMountedRef.current) return;
          
          console.error(`API Error (${url}):`, error);
          setState({
            data: null,
            error,
            isLoading: false,
          });
        } finally {
          if (currentRequestId === requestIdRef.current) {
            isLoadingRef.current = false;
          }
        }
      },
      [options, url]
    );

    // Handle component lifecycle and prevent unnecessary refetches
    useEffect(() => {
      isMountedRef.current = true;
      
      // Check if URL or options have changed significantly
      const urlChanged = lastRequestUrlRef.current !== url;
      const optionsChanged = JSON.stringify(options) !== JSON.stringify(lastOptionsRef.current);
      
      // Store current URL
      lastRequestUrlRef.current = url;
      
      const { cachePolicy = 'cache-first' } = options;
      
      // Only fetch if needed based on cache policy and state
      if (urlChanged || optionsChanged || cachePolicy === 'no-cache' || !state.data) {
        fetchData(options);
      }
      
      return () => {
        isMountedRef.current = false;
      };
    }, [fetchData, options, state.data, url]);

    return [state, fetchData, setLocalData];
  },
  
  post: (url, options = {}) => {
    const [state, setState] = useState({
      data: null,
      error: null,
      isLoading: false,
    });
    
    // Use refs to track component mount status and prevent memory leaks
    const isMountedRef = useRef(true);
    const isLoadingRef = useRef(false);

    const makeRequest = useCallback(
      async (body, newOptions = {}) => {
        // Skip if already loading
        if (isLoadingRef.current) return { data: null, error: new Error('Request already in progress') };
        
        isLoadingRef.current = true;
        if (isMountedRef.current) {
          setState({ data: null, error: null, isLoading: true });
        }
        
        try {
          let data = null;
          
          // Handle different API endpoints
          if (url.startsWith('/project')) {
            // Example: Create project
            const { data: projectData, error } = await supabase
              .from('projects')
              .insert([body])
              .select();
              
            if (error) throw error;
            data = { project: projectData[0] };
          } else if (url.startsWith('/issues')) {
            // Example: Create issue
            const { data: issueData, error } = await supabase
              .from('issues')
              .insert([body])
              .select();
              
            if (error) throw error;
            data = { issue: issueData[0] };
          }
          
          if (isMountedRef.current) {
            setState({
              data,
              error: null,
              isLoading: false,
            });
          }
          
          isLoadingRef.current = false;
          return { data, error: null };
        } catch (error) {
          console.error(`API Error (${url}):`, error);
          
          if (isMountedRef.current) {
            setState({
              data: null,
              error,
              isLoading: false,
            });
          }
          
          isLoadingRef.current = false;
          return { data: null, error };
        }
      },
      [url]
    );
    
    // Handle component lifecycle
    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    return [state, makeRequest];
  },
  
  put: (url, options = {}) => {
    const [state, setState] = useState({
      data: null,
      error: null,
      isLoading: false,
    });
    
    // Use refs to track component mount status and prevent memory leaks
    const isMountedRef = useRef(true);
    const isLoadingRef = useRef(false);

    const makeRequest = useCallback(
      async (body, newOptions = {}) => {
        // Skip if already loading
        if (isLoadingRef.current) return { data: null, error: new Error('Request already in progress') };
        
        isLoadingRef.current = true;
        if (isMountedRef.current) {
          setState({ data: null, error: null, isLoading: true });
        }
        
        try {
          let data = null;
          
          // Extract ID from the URL
          const id = url.split('/').pop();
          
          // Handle different API endpoints
          if (url.includes('/project/')) {
            // Example: Update project
            const { data: projectData, error } = await supabase
              .from('projects')
              .update(body)
              .eq('id', id)
              .select();
              
            if (error) throw error;
            data = { project: projectData[0] };
          } else if (url.includes('/issues/')) {
            // Example: Update issue
            const { data: issueData, error } = await supabase
              .from('issues')
              .update(body)
              .eq('id', id)
              .select();
              
            if (error) throw error;
            data = { issue: issueData[0] };
          }
          
          if (isMountedRef.current) {
            setState({
              data,
              error: null,
              isLoading: false,
            });
          }
          
          isLoadingRef.current = false;
          return { data, error: null };
        } catch (error) {
          console.error(`API Error (${url}):`, error);
          
          if (isMountedRef.current) {
            setState({
              data: null,
              error,
              isLoading: false,
            });
          }
          
          isLoadingRef.current = false;
          return { data: null, error };
        }
      },
      [url]
    );
    
    // Handle component lifecycle
    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    return [state, makeRequest];
  },
  
  delete: (url, options = {}) => {
    const [state, setState] = useState({
      data: null,
      error: null,
      isLoading: false,
    });
    
    // Use refs to track component mount status and prevent memory leaks
    const isMountedRef = useRef(true);
    const isLoadingRef = useRef(false);

    const makeRequest = useCallback(
      async (newOptions = {}) => {
        // Skip if already loading
        if (isLoadingRef.current) return { data: null, error: new Error('Request already in progress') };
        
        isLoadingRef.current = true;
        if (isMountedRef.current) {
          setState({ data: null, error: null, isLoading: true });
        }
        
        try {
          // Extract ID from the URL
          const id = url.split('/').pop();
          
          // Handle different API endpoints
          if (url.includes('/issues/')) {
            // Example: Delete issue
            const { error } = await supabase
              .from('issues')
              .delete()
              .eq('id', id);
              
            if (error) throw error;
          }
          
          if (isMountedRef.current) {
            setState({
              data: { success: true },
              error: null,
              isLoading: false,
            });
          }
          
          isLoadingRef.current = false;
          return { data: { success: true }, error: null };
        } catch (error) {
          console.error(`API Error (${url}):`, error);
          
          if (isMountedRef.current) {
            setState({
              data: null,
              error,
              isLoading: false,
            });
          }
          
          isLoadingRef.current = false;
          return { data: null, error };
        }
      },
      [url]
    );
    
    // Handle component lifecycle
    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    return [state, makeRequest];
  }
};

export default useApi;