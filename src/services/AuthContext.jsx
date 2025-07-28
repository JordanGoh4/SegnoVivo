import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (authData) => {
    try {
      console.log('🔍 AuthContext login called with:', authData);

      // Google login
      if (authData.user && authData.token) {
        console.log('📱 Processing Google login');
        const userObj = { user: authData.user, token: authData.token };
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
        return userObj;
      }
      // Normal login
      else if (authData.username && authData.password) {
        console.log('🔑 Processing normal login');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch('http://localhost:3001/api/login', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(authData),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response not OK:', errorText);
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
          
          throw new Error(errorData.error || 'Login failed');
        }

        const data = await response.json();
        console.log('Login response data:', data);
        
        const userObj = { user: data.user, token: data.token };
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
        return userObj;
      } else {
        throw new Error('Invalid login data provided');
      }
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Login request timed out. Please try again.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out');
    localStorage.removeItem('user');
    setUser(null);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userData = urlParams.get('user');

    if (token && userData) {
      console.log('Found URL params for login');
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData));
        const userObj = { user: parsedUser, token };
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));

        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } catch (err) {
        console.error('Error parsing login data:', err);
      } finally {
        setLoading(false);
      }
    } else {
      const saved = localStorage.getItem('user');
      console.log('Checking localStorage:', saved ? 'Found saved user' : 'No saved user');
      
      if (saved) {
        try {
          const parsedUser = JSON.parse(saved);
          console.log('Restored user from localStorage:', parsedUser.user?.username || parsedUser.user?.email);
          setUser(parsedUser);
        } catch (e) {
          console.error('Error parsing saved user:', e);
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);