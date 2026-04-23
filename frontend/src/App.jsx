// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';         // 👈 Naya import
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ApiBuilder from './pages/ApiBuilder';
import MockApiDemo from './pages/MockApiDemo';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null; 
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;

  return (
    <Router>
      {/* 🌟 Navbar yahan aayega taaki har page par dikhe */}
      <Navbar /> 
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} /> {/* 👈 Naya Route */}
        <Route path="/demo" element={<MockApiDemo />} />
        
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} 
        />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={<PrivateRoute><Dashboard /></PrivateRoute>} 
        />
        <Route 
          path="/project/:projectId" 
          element={<PrivateRoute><ApiBuilder /></PrivateRoute>} 
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
