import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderGit2, ArrowRight, Loader2, Trash2 } from 'lucide-react'; // 👈 Trash2 add kiya
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth(); // Global auth state se user details nikal li
  const navigate = useNavigate();

  // Component States
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal States for Creating New Project
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  // 1️⃣ Component Mount hote hi Projects Fetch Karna
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/projects');
      setProjects(response.data.data || []);
    } catch (err) {
      setError('Failed to load projects. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2️⃣ Naya Project Create Karna
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      setCreating(true);
      // Backend ko naya project banane ki request bhejna
      // Note: Backend automatically slug generate kar lega name se
      const response = await axiosInstance.post('/projects', { name: newProjectName });
      
      // Naye project ko existing list mein add karna bina refresh kiye
      setProjects([...projects, response.data.project]);
      
      // Modal reset and close
      setNewProjectName('');
      setIsModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  // 🗑️ Delete Project Logic
  const handleDeleteProject = async (projectId) => {
    // UX Best Practice: Explicit warning kyunki yeh ek destructive action hai
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this project? \n\n⚠️ WARNING: This will also permanently delete ALL mock endpoints inside this project!"
    );
    
    if (!isConfirmed) return;

    try {
      // Backend api ko hit karna
      await axiosInstance.delete(`/projects/${projectId}`);
      
      // ✨ OPTIMISTIC UI: Purane array se is project ko filter out karke state update karna
      setProjects(projects.filter(project => project._id !== projectId));
      
    } catch (error) {
      console.error("Delete Project Error:", error);
      alert(error.response?.data?.message || 'Failed to delete project. Please try again.');
    }
  };

  // Loading UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <FolderGit2 className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">API Mocker</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button 
                onClick={logout}
                className="text-sm font-medium text-red-600 hover:text-red-700 cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Projects</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span>New Project</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Projects Grid OR Empty State */}
        {projects.length === 0 ? (
          <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <FolderGit2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6">Create your first project to start mocking APIs.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              + Create a new project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            // ⚠️ Dhyan dein: 'relative' class zaroori hai absolute positioning ke liye
            <div 
              key={project._id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group relative"
            >
              
              {/* 🔴 NAYA DELETE BUTTON */}
              <button
                onClick={() => handleDeleteProject(project._id)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                title="Delete Project"
              >
                <Trash2 className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 pr-8 truncate">
                {project.name}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Base URL: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">/api/v1/{project.slug}</span>
              </p>
              <button
                onClick={() => navigate(`/project/${project._id}`)}
                className="w-full flex items-center justify-center space-x-2 bg-gray-50 hover:bg-blue-50 text-blue-600 border border-gray-200 hover:border-blue-200 py-2 rounded-lg font-medium transition-colors"
              >
                <span>Manage Endpoints</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        )}
      </main>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., E-commerce App"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewProjectName('');
                  }}
                  className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className={`px-4 py-2 text-white font-medium rounded-lg transition-colors flex items-center ${
                    creating ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  }`}
                >
                  {creating && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;