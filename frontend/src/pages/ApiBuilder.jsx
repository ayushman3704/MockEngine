import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { Plus, Trash2, Save, ArrowLeft, Copy, CheckCircle2, ServerCrash } from 'lucide-react';
import { Plus, Trash2, Save, ArrowLeft, Copy, CheckCircle2, ServerCrash, Pencil, X } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

// Allowed data types jo backend se match karte hain
const DATA_TYPES = ['string', 'number', 'boolean', 'uuid', 'email', 'fullName', 'date'];

const ApiBuilder = () => {
  const { projectId } = useParams(); // URL se projectId extract kiya
  const navigate = useNavigate();
  const { user } = useAuth();

  // 1️⃣ Global States
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // 2️⃣ Form States (The Blueprint)
  const [path, setPath] = useState('');
  const [method, setMethod] = useState('GET');
  const [itemCount, setItemCount] = useState(10);
  const [delay, setDelay] = useState(0);
  const [forceError, setForceError] = useState(false);
  const [errorCode, setErrorCode] = useState(500);
  
  // Dynamic Array State for Fields!
  const [fields, setFields] = useState([
    { fieldName: 'id', dataType: 'uuid' },
    { fieldName: '', dataType: 'string' }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // 🌟 NAYI STATE: Edit mode track karne ke liye
  const [editingEndpointId, setEditingEndpointId] = useState(null);

  // Initial Data Fetch
  useEffect(() => {
    fetchEndpoints();
  }, [projectId]);

  const fetchEndpoints = async () => {
    try {
      // Backend api to get all endpoints for this project
      const response = await axiosInstance.get(`/projects/${projectId}/endpoints`);
      setEndpoints(response.data.data || []);
    } catch (error) {
      console.error('Error fetching endpoints:', error);
    } finally {
      setLoading(false);
    }
  };

  // 3️⃣ Dynamic Field Handlers
  const addField = () => {
    setFields([...fields, { fieldName: '', dataType: 'string' }]);
  };

  const removeField = (indexToRemove) => {
    setFields(fields.filter((_, index) => index !== indexToRemove));
  };

  const updateField = (index, key, value) => {
    const updatedFields = [...fields];
    updatedFields[index][key] = value;
    setFields(updatedFields);
  };

  // // 4️⃣ Submit Handler
  // const handleGenerateAPI = async (e) => {
  //   e.preventDefault();
    
  //   // Basic validation
  //   if (!path.trim()) return alert("Path is required");
  //   const validFields = fields.filter(f => f.fieldName.trim() !== '');
  //   if (validFields.length === 0) return alert("Add at least one valid field");

  //   try {
  //     setIsSaving(true);
  //     const payload = {
  //       path,
  //       method,
  //       itemCount: Number(itemCount),
  //       delay: Number(delay),
  //       forceError,
  //       errorCode: Number(errorCode),
  //       fields: validFields
  //     };

  //     await axiosInstance.post(`/projects/${projectId}/endpoints`, payload);
      
  //     // Reset form & refresh list
  //     setPath('');
  //     setFields([{ fieldName: 'id', dataType: 'uuid' }]);
  //     fetchEndpoints(); 
      
  //   } catch (error) {
  //     alert(error.response?.data?.message || 'Failed to save endpoint');
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  // 🚀 Unified Submit Handler (Create & Update)
  const handleGenerateAPI = async (e) => {
    e.preventDefault();
    if (!path.trim()) return alert("Path is required");
    const validFields = fields.filter(f => f.fieldName.trim() !== '');
    if (validFields.length === 0) return alert("Add at least one valid field");

    try {
      setIsSaving(true);
      const payload = {
        path,
        method,
        // Update function expects fields and config objects
        fields: validFields,
        config: {
          itemCount: Number(itemCount),
          delay: Number(delay),
          forceError,
          errorCode: Number(errorCode)
        }
      };

      if (editingEndpointId) {
        // 🔄 UPDATE LOGIC (PUT Request)
        const response = await axiosInstance.put(`/projects/${editingEndpointId}`, payload);
        
        // Optimistic UI Update: Array mein purane endpoint ko naye se replace karo
        setEndpoints(endpoints.map(ep => 
          ep._id === editingEndpointId ? response.data.data : ep
        ));
        cancelEdit(); // Form clear and close edit mode
        
      } else {
        // ➕ CREATE LOGIC (POST Request - Jo aapka pehle se tha)
        // Apne purane payload structure ke hisaab se bhejein
        const createPayload = {
          ...payload,
          itemCount: payload.config.itemCount,
          delay: payload.config.delay,
          forceError: payload.config.forceError,
          errorCode: payload.config.errorCode
        };
        
        await axiosInstance.post(`/projects/${projectId}/endpoints`, createPayload);
        setPath('');
        setFields([{ fieldName: 'id', dataType: 'uuid' }]);
        fetchEndpoints(); 
      }
      
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed');
    } finally {
      setIsSaving(false);
    }
  };

  // Copy to Clipboard Utility
  const copyToClipboard = (endpointId, fullPath) => {
    // Ye mock URL backend base url + project route ke hisaab se banega
    const mockUrl = `http://localhost:5000/api/mock/${user.id}/${projectId}${fullPath}`;
    navigator.clipboard.writeText(mockUrl);
    setCopiedId(endpointId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 🗑️ Delete Endpoint Logic
  const handleDeleteEndpoint = async (endpointId) => {
    if (!window.confirm("Are you sure you want to delete this endpoint?")) return;

    try {
      await axiosInstance.delete(`/projects/${endpointId}`);
      setEndpoints(endpoints.filter(ep => ep._id !== endpointId));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete endpoint');
    }
  };

  // 📝 Edit Button Click Handler
  const handleEditClick = (endpoint) => {
    setEditingEndpointId(endpoint._id);
    // Remove leading slash if it exists so it looks clean in the input box
    setPath(endpoint.path.replace(/^\//, '')); 
    setMethod(endpoint.method);
    setItemCount(endpoint.config.itemCount || 10);
    setDelay(endpoint.config.delay || 0);
    setForceError(endpoint.config.forceError || false);
    setErrorCode(endpoint.config.errorCode || 500);
    
    // Map fields specifically to ensure they match our UI state format
    const mappedFields = endpoint.fields.map(f => ({
      fieldName: f.fieldName,
      dataType: f.dataType
    }));
    setFields(mappedFields.length > 0 ? mappedFields : [{ fieldName: 'id', dataType: 'uuid' }]);
    
    // Scroll to top automatically so user sees the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ❌ Cancel Edit Handler
  const cancelEdit = () => {
    setEditingEndpointId(null);
    setPath('');
    setMethod('GET');
    setItemCount(10);
    setDelay(0);
    setForceError(false);
    setErrorCode(500);
    setFields([{ fieldName: 'id', dataType: 'uuid' }]);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your workspace...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center shadow-sm">
        <button onClick={() => navigate('/dashboard')} className="flex items-center text-gray-600 hover:text-blue-600 transition-colors cursor-pointer">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="ml-8 text-xl font-bold text-gray-800">API Schema Builder</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Existing Endpoints */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Live Endpoints</h2>
          {endpoints.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-gray-500 text-sm shadow-sm">
              No endpoints created yet. Build one on the right!
            </div>
          ) : (
            endpoints.map((ep) => (
              // ⚠️ Dhyan dein: 'relative' class add ki hai taaki button top-right par place ho sake
              <div key={ep._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative">

                {/* <div key={ep._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative"> */}
                
                {/* 🔵 NAYA EDIT BUTTON */}
                <button 
                  onClick={() => handleEditClick(ep)}
                  className="absolute top-4 right-12 text-gray-400 hover:text-blue-500 transition-colors bg-white rounded-full p-1 hover:bg-blue-50 cursor-pointer"
                  title="Edit Endpoint"
                >
                  <Pencil className="h-4 w-4" />
                </button>

                {/* 🔴 PURANA DELETE BUTTON */}
                <button 
                  onClick={() => handleDeleteEndpoint(ep._id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-1 hover:bg-red-50 cursor-pointer"
                  title="Delete Endpoint"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {/* // ... baaki card ka content ... */}
                
                {/* 🔴 YAHAN PASTE KARIYE APNA DELETE BUTTON */}
                {/* <button 
                  onClick={() => handleDeleteEndpoint(ep._id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-1 hover:bg-red-50 cursor-pointer"
                  title="Delete Endpoint"
                >
                  <Trash2 className="h-4 w-4" />
                </button> */}

                <div className="flex justify-between items-start mb-2 pr-15">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${ep.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {ep.method}
                  </span>
                  <span className="text-xs text-gray-500">{ep.config.itemCount} items</span>
                </div>
                
                {/* ... baaki code (path aur copy button) waise hi rahega ... */}
                <p className="font-mono text-sm font-medium text-gray-800 break-all">{ep.path}</p>
                
                <button 
                  onClick={() => copyToClipboard(ep._id, ep.path)}
                  className="mt-4 w-full flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {copiedId === ep._id ? <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copiedId === ep._id ? 'Copied URL!' : 'Copy Mock URL'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* RIGHT COLUMN: The Builder Form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Endpoint</h2>
          
          <form onSubmit={handleGenerateAPI} className="space-y-8">
            
            {/* Row 1: Path & Method */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint Path</label>
                <div className="flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    /api/mock/
                  </span>
                  <input
                    type="text"
                    required
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="users"
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                </select>
              </div>
            </div>

            {/* Row 2: Advanced Configs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Array Size</label>
                <input type="number" min="1" max="1000" value={itemCount} onChange={(e) => setItemCount(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Simulate Delay (ms)</label>
                <input type="number" min="0" value={delay} onChange={(e) => setDelay(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Error Code</label>
                <select
                  value={errorCode}
                  onChange={(e) => setErrorCode(e.target.value)}
                  disabled={!forceError}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value={400}>400 Bad Request</option>
                  <option value={401}>401 Unauthorized</option>
                  <option value={403}>403 Forbidden</option>
                  <option value={404}>404 Not Found</option>
                  <option value={409}>409 Conflict</option>
                  <option value={422}>422 Validation Error</option>
                  <option value={500}>500 Server Error</option>
                  <option value={502}>502 Bad Gateway</option>
                  <option value={503}>503 Unavailable</option>
                </select>
              </div>
              <div className="flex items-center space-x-3 pt-6">
                <input type="checkbox" id="forceError" checked={forceError} onChange={(e) => setForceError(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label htmlFor="forceError" className="text-sm font-medium text-gray-700 flex items-center">
                  <ServerCrash className="h-4 w-4 mr-1 text-red-500" /> Force Error
                </label>
              </div>
            </div>

            {/* Row 3: The Dynamic Data Schema */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium text-gray-900">Data Response Schema</h3>
                <button type="button" onClick={addField} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors cursor-pointer">
                  <Plus className="h-4 w-4 mr-1" /> Add Field
                </button>
              </div>
              
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={index} className="flex items-center space-x-4 animate-in slide-in-from-top-2">
                    <input
                      type="text"
                      placeholder="field_name (e.g., price)"
                      value={field.fieldName}
                      onChange={(e) => updateField(index, 'fieldName', e.target.value)}
                      className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <select
                      value={field.dataType}
                      onChange={(e) => updateField(index, 'dataType', e.target.value)}
                      className="w-48 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      {DATA_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      disabled={fields.length === 1}
                      className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* <hr className="border-gray-200" /> */}

            <div className="flex justify-end space-x-4">
              {/* Agar edit mode mein hain, toh Cancel button dikhayein */}
              {editingEndpointId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancel Edit
                </button>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-70 cursor-pointer"
              >
                {isSaving ? 'Saving...' : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    {editingEndpointId ? 'Update Endpoint' : 'Generate Endpoint API'}
                  </>
                )}
              </button>
            </div>

            {/* <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 cursor-pointer"
              >
                {isSaving ? 'Saving Blueprint...' : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Generate Endpoint API
                  </>
                )}
              </button>
            </div> */}
          </form>
        </div>

      </div>
    </div>
  );
};

export default ApiBuilder;
