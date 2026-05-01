import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('college_portal_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('college_portal_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Custom login using the 'users' table
      const { data, error } = await supabase
        .from('users')
        .select('*, roles(role_name)')
        .eq('email', normalizedEmail)
        .single();

      if (error || !data) {
        throw new Error('Invalid email or user not found.');
      }

      // Verify dummy password
      if (data.password_hash !== password) {
        throw new Error('Invalid password.');
      }

      // Check if active
      if (!data.is_active) {
        throw new Error('Account is inactive. Contact admin.');
      }

      const userData = {
        user_id: data.user_id,
        user_code: data.user_code,
        email: data.email,
        full_name: data.full_name,
        role_id: data.role_id,
        role_name: data.roles?.role_name || 'Student'
      };

      setUser(userData);
      localStorage.setItem('college_portal_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const signup = async (fullName, email, password) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // 0. Domain validation
      if (!normalizedEmail.endsWith('@campus.edu')) {
        throw new Error('Only official @campus.edu institutional emails are allowed to sign up.');
      }

      // Public sign-up must never mint privileged accounts from email patterns.
      const assignedRoleId = 1;
      const idPrefix = 'CUS';

      // 1. Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', normalizedEmail)
        .single();
        
      if (existingUser) {
        throw new Error('An account with this email already exists.');
      }

      // Generate a unique user_code
      const userCode = `${idPrefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 2. Insert the user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{
          user_code: userCode,
          full_name: fullName.trim(),
          email: normalizedEmail,
          password_hash: password, // In a real app, hash this properly
          role_id: assignedRoleId,
          is_active: true
        }])
        .select('*, roles(role_name)')
        .single();

      if (insertError) throw insertError;

      // 3. Log them in
      const userData = {
        user_id: newUser.user_id,
        user_code: newUser.user_code,
        email: newUser.email,
        full_name: newUser.full_name,
        role_id: newUser.role_id,
        role_name: newUser.roles?.role_name || 'Student'
      };

      setUser(userData);
      localStorage.setItem('college_portal_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('college_portal_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
