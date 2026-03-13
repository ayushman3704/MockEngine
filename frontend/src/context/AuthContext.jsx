// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import axiosInstance from '../api/axiosInstance';

// 1. Context create karna
const AuthContext = createContext();

// Custom hook taaki baaki components aasaani se use kar sakein
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // App load hote hi pehle check karenge

  // 2. Page refresh hone par check karna ki kya cookie abhi bhi valid hai
  const checkAuthStatus = async () => {
    try {
      // NOTE: Iske liye backend par ek route chahiye jo token verify kare
      const response = await axiosInstance.get('/auth/me'); 
      if (response.data.success) {
        setUser(response.data.data);
        setIsAuthenticated(true);
      }
    } catch (error) {
      // Agar token expire ho gaya ya nahi hai
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false); // Check complete ho gaya, ab app render kar sakte hain
    }
  };

  // Jab app pehli baar load ho, tab status check karo
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 3. Login function (Login page se call hoga)
  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  // 4. Logout function (Navbar se call hoga)
  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout'); // Backend se cookie clear karo
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {/* Agar app abhi loading state mein hai (check kar raha hai), toh spinner dikhao */}
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-xl font-semibold">Loading App...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};