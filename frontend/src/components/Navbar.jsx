import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, TerminalSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-700 transition-colors">
              <TerminalSquare className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">MockEngine</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Home</Link>
            <Link to="/demo" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Demo</Link>
            <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Features</a>
            
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Dashboard</Link>
                <button 
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Log in</Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transform text-white px-5 py-2 rounded-lg font-medium transition-all duration-200">
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 hover:text-gray-900 focus:outline-none">
              {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          <Link to="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md">Home</Link>
          <Link to="/demo" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md">Demo</Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md">Dashboard</Link>
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md">Log in</Link>
              <Link to="/register" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-blue-600 bg-blue-50 rounded-md">Sign Up Free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
