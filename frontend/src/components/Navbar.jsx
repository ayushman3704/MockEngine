import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, TerminalSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeHash, setActiveHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setActiveHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    setActiveHash(window.location.hash);
  }, [location.pathname]);

  const isRouteActive = (path) => location.pathname === path && !activeHash;
  const isDashboardActive = (location.pathname === '/dashboard' || location.pathname.startsWith('/project/')) && !activeHash;
  const isFeatureActive = location.pathname === '/' && activeHash === '#features';

  const desktopLinkClass = (isActive) =>
    `font-medium transition-colors px-3 py-2 rounded-md ${
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
    }`;

  const mobileLinkClass = (isActive) =>
    `block px-3 py-2 text-base font-medium rounded-md ${
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
    }`;

  const primaryLinkClass = (isActive) =>
    `px-5 py-2 rounded-lg font-medium transition-all duration-200 ${
      isActive
        ? 'bg-blue-700 text-white shadow-md'
        : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transform text-white'
    }`;

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
  };

  const goToPage = (path) => {
    setActiveHash('');
    setIsOpen(false);
    navigate({ pathname: path, hash: '' });

    if (path === '/') {
      window.setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  };

  const goToFeatures = () => {
    setActiveHash('#features');
    setIsOpen(false);
    navigate({ pathname: '/', hash: '#features' });

    window.setTimeout(() => {
      const featuresSection = document.getElementById('features');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo Section */}
          <button type="button" onClick={() => goToPage('/')} className="flex items-center space-x-2 group">
            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-700 transition-colors">
              <TerminalSquare className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">MockEngine</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <button type="button" onClick={() => goToPage('/')} className={desktopLinkClass(isRouteActive('/'))}>Home</button>
            <button type="button" onClick={goToFeatures} className={desktopLinkClass(isFeatureActive)}>Features</button>
            <button type="button" onClick={() => goToPage('/demo')} className={desktopLinkClass(isRouteActive('/demo'))}>Demo</button>
            <button type="button" onClick={() => goToPage('/dashboard')} className={desktopLinkClass(isDashboardActive)}>Dashboard</button>
            
            {isAuthenticated ? (
              <>
                <button 
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <button type="button" onClick={() => goToPage('/login')} className={desktopLinkClass(isRouteActive('/login'))}>Log in</button>
                <button type="button" onClick={() => goToPage('/register')} className={primaryLinkClass(isRouteActive('/register'))}>
                  Sign Up Free
                </button>
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
          <button type="button" onClick={() => goToPage('/')} className={`w-full text-left ${mobileLinkClass(isRouteActive('/'))}`}>Home</button>
          <button type="button" onClick={goToFeatures} className={`w-full text-left ${mobileLinkClass(isFeatureActive)}`}>Features</button>
          <button type="button" onClick={() => goToPage('/demo')} className={`w-full text-left ${mobileLinkClass(isRouteActive('/demo'))}`}>Demo</button>
          <button type="button" onClick={() => goToPage('/dashboard')} className={`w-full text-left ${mobileLinkClass(isDashboardActive)}`}>Dashboard</button>
          {isAuthenticated ? (
            <>
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md">Logout</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => goToPage('/login')} className={`w-full text-left ${mobileLinkClass(isRouteActive('/login'))}`}>Log in</button>
              <button type="button" onClick={() => goToPage('/register')} className={`w-full text-left ${mobileLinkClass(isRouteActive('/register'))}`}>Sign Up Free</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
