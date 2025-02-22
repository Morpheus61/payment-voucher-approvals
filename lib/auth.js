import { supabase } from './supabaseClient';

let authInstance = null;

export const getAuthInstance = () => {
  if (!authInstance) {
    authInstance = supabase.auth;
  }
  return authInstance;
};

export const signIn = async (email, password) => {
  try {
    const auth = getAuthInstance();
    const { data, error } = await auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Auth error:', error.message);
    return { data: null, error };
  }
};
