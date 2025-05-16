import supabase from './supaBaseConfig';
import toast from 'shared/utils/toast';

const authService = {
  /**
   * Sign in with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ user: object|null, error: object|null }>}
   */
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login Error:', error.message);
      }

      return { user: data?.user || null, error };
    } catch (error) {
      console.error('SignIn Exception:', error.message);
      return { user: null, error };
    }
  },

  /**
   * Sign up with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ user: object|null, error: object|null }>}
   */
  signUp: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Signup Error:', error.message);
      }

      return { user: data?.user || null, error };
    } catch (error) {
      console.error('SignUp Exception:', error.message);
      return { user: null, error };
    }
  },

  /**
   * Sign out the current user
   * @returns {Promise<{ success: boolean, error: object|null }>}
   */
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Logout Error:', error.message);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('SignOut Exception:', error.message);
      return { success: false, error };
    }
  },

  /**
   * Get the current authenticated user
   * @returns {Promise<object|null>}
   */
  getCurrentUser: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data?.user || null;
    } catch (error) {
      console.error('getCurrentUser Error:', error.message);
      return null;
    }
  },

  /**
   * Listen to auth state changes
   * @param {(event: string, session: object|null) => void} callback
   * @returns {object} subscription
   */
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

  /**
   * Create a user profile in the `users` table
   * Call this after sign-up if needed
   * @param {object} user - Supabase user object
   */
  createUserProfile: async (user) => {
    try {
      const { data, error } = await supabase.from('users').insert([
        {
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error('Create Profile Error:', error.message);
        toast.error('Failed to create user profile.');
      } else {
        toast.success('User profile created successfully.');
      }
    } catch (error) {
      console.error('createUserProfile Exception:', error.message);
      toast.error('Error creating user profile.');
    }
  },
};

export default authService;
