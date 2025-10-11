import { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        error: null
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

// Auth Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Helper function to get user role
  const getUserRole = async (user) => {
    // Try to get role from user metadata first
    let userRole = user.user_metadata?.role;
    
    // If no role in metadata, check database
    if (!userRole) {
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        userRole = profile?.role || 'donor';
      } catch (dbError) {
        console.warn('Could not fetch user role from database:', dbError.message);
        userRole = 'donor'; // Default fallback
      }
    }
    
    return userRole;
  };

  // Optimized auth initialization
  useEffect(() => {
    let mounted = true;
    let authSubscription = null;

    const initAuth = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            const userRole = await getUserRole(session.user);

            const user = {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.email.split('@')[0],
              role: userRole
            };
            dispatch({ type: 'SET_USER', payload: user });
          } else {
            dispatch({ type: 'SET_USER', payload: null });
          }
        }
      } catch (error) {
        if (mounted) {
          console.error('Auth initialization error:', error);
          dispatch({ type: 'SET_USER', payload: null });
        }
      }
    };

    // Set up auth state listener
    const setupAuthListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_, session) => {
          if (!mounted) return;

          if (session?.user) {
            const userRole = await getUserRole(session.user);

            const user = {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.email.split('@')[0],
              role: userRole
            };
            dispatch({ type: 'SET_USER', payload: user });
          } else {
            dispatch({ type: 'SET_USER', payload: null });
          }
        }
      );
      authSubscription = subscription;
    };

    // Initialize
    initAuth();
    setupAuthListener();

    // Cleanup
    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // Optimized sign up
  const signUp = async (email, password, userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            role: userData.role
          }
        }
      });

      if (authError) throw authError;

      // Try to create user profile (non-blocking)
      try {
        await supabase.from('users').insert([{
          id: authData.user.id,
          email: authData.user.email,
          name: userData.name,
          role: userData.role
        }]);
      } catch (profileError) {
        console.warn('Profile creation failed (non-critical):', profileError.message);
      }

      return { success: true, data: authData };
    } catch (error) {
      console.error('Sign up error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Optimized sign in
  const signIn = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Sign in error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      dispatch({ type: 'LOGOUT' });
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const hasRole = (allowedRoles) => {
    if (!state.user || !allowedRoles) return false;
    return allowedRoles.includes(state.user.role);
  };

  const value = {
    ...state,
    signUp,
    signIn,
    signOut,
    clearError,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;