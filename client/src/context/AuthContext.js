import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase, USER_ROLES } from '../lib/supabase';

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

  // Check user session on mount
  useEffect(() => {
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          dispatch({ type: 'SET_USER', payload: null });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        dispatch({ type: 'SET_USER', payload: null });
      }
    } catch (error) {
      console.error('Error checking user:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const loadUserProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) throw error;

      const user = {
        id: authUser.id,
        email: authUser.email,
        ...profile
      };

      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      console.error('Error loading user profile:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      console.log('AuthContext: Starting signup process');
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Add timeout to prevent infinite hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Registration timeout - check database setup')), 30000)
      );

      console.log('AuthContext: Calling supabase.auth.signUp');
      // Sign up with Supabase Auth with timeout
      const authPromise = supabase.auth.signUp({
        email,
        password
      });

      const { data: authData, error: authError } = await Promise.race([authPromise, timeoutPromise]);

      console.log('AuthContext: Auth signup result:', { authData, authError });

      if (authError) throw authError;

      // Try to create user profile, but don't fail if table doesn't exist
      console.log('AuthContext: Creating user profile');
      try {
        const profilePromise = supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email: authData.user.email,
            name: userData.name,
            role: userData.role
          }]);

        const profileTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile creation timeout')), 10000)
        );

        const { error: profileError } = await Promise.race([profilePromise, profileTimeoutPromise]);

        console.log('AuthContext: Profile creation result:', { profileError });

        if (profileError) {
          console.warn('Profile creation failed, but auth succeeded:', profileError.message);
          // Don't throw error here - auth still succeeded
        }
      } catch (profileErr) {
        console.warn('Profile creation failed, but auth succeeded:', profileErr.message);
        // Don't throw error here - auth still succeeded
      }

      console.log('AuthContext: Signup successful');
      return { success: true, data: authData };
    } catch (error) {
      console.error('Sign up error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      console.log('AuthContext: Setting loading to false');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

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