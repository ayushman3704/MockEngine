import { Link } from 'react-router-dom';
import { Zap, Database, Globe, ArrowRight, Code2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-200">
      
      {/* 🚀 HERO SECTION */}
      <div className="relative overflow-hidden bg-white">
        {/* Abstract Background Decoration */}
        <div className="absolute inset-y-0 w-full h-full -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-white to-white opacity-70"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center lg:pt-32 lg:pb-36">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
            Build APIs in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Seconds</span>, <br className="hidden md:block" /> Not Hours.
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            The ultimate dynamic mock data generator for frontend developers. Design your schema, simulate network delays, and get production-ready REST endpoints instantly.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link 
              to={isAuthenticated ? "/dashboard" : "/register"} 
              className="w-full sm:w-auto flex items-center justify-center px-8 py-4 text-lg font-bold rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {isAuthenticated ? "Go to Dashboard" : "Start Building for Free"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a 
              href="#features" 
              className="w-full sm:w-auto flex items-center justify-center px-8 py-4 text-lg font-bold rounded-full text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300"
            >
              Explore Features
            </a>
          </div>
        </div>
      </div>

      {/* ⚡ FEATURES SECTION */}
      <div id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Why use MockEngine?</h2>
            <p className="mt-4 text-lg text-gray-600">Stop waiting for the backend team. Unblock your frontend development today.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Database className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Dynamic Schemas</h3>
              <p className="text-gray-600 leading-relaxed">
                Design custom JSON structures visually. Support for UUIDs, full names, emails, dates, and much more using Faker.js engine.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-7 w-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Latency & Errors</h3>
              <p className="text-gray-600 leading-relaxed">
                Test your UI's loading states and error boundaries by simulating network delays and forcing 404 or 500 status codes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Globe className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Live URLs Instantly</h3>
              <p className="text-gray-600 leading-relaxed">
                Hit save and get a production-ready URL immediately. No deployment required. CORS is fully handled out of the box.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 💻 CODE PREVIEW SECTION (The "Aha!" Moment for Devs) */}
      <div className="bg-gray-900 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Code2 className="h-12 w-12 text-blue-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-8">Works with your favorite tools</h2>
          <div className="bg-gray-800 rounded-xl p-6 text-left shadow-2xl overflow-hidden border border-gray-700">
            <pre className="text-sm sm:text-base font-mono text-gray-300 overflow-x-auto">
              <code>
                <span className="text-pink-400">import</span> axios <span className="text-pink-400">from</span> <span className="text-green-400">'axios'</span>;<br/><br/>
                <span className="text-blue-400">const</span> fetchUsers = <span className="text-blue-400">async</span> () ={'>'} {'{'}<br/>
                {'  '}<span className="text-blue-400">const</span> response = <span className="text-blue-400">await</span> axios.get(<br/>
                {'    '}<span className="text-green-400">'https://api-mocker.com/api/mock/aayushmaan/ecommerce/users'</span><br/>
                {'  '});<br/>
                {'  '}console.log(response.data); <span className="text-gray-500">// Returns 50 perfectly formatted fake users</span><br/>
                {'}'};
              </code>
            </pre>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-8 text-center">
        <p className="text-gray-500">Built with 💻 by Aayushmaan. A MERN Stack Portfolio Project.</p>
      </footer>
    </div>
  );
};

export default Home;