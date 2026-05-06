import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Copy,
  CheckCircle2,
  ServerCrash,
  Pencil,
  X,
  Activity,
  Clock3,
  Globe,
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { BACKEND_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

const DATA_TYPES = ['string', 'number', 'boolean', 'uuid', 'email', 'fullName', 'date'];

const ApiBuilder = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [endpointAnalytics, setEndpointAnalytics] = useState({});
  const [recentLogs, setRecentLogs] = useState([]);

  const [path, setPath] = useState('');
  const [method, setMethod] = useState('GET');
  const [itemCount, setItemCount] = useState(10);
  const [delay, setDelay] = useState(0);
  const [forceError, setForceError] = useState(false);
  const [errorCode, setErrorCode] = useState(500);
  const [fields, setFields] = useState([
    { fieldName: 'id', dataType: 'uuid' },
    { fieldName: '', dataType: 'string' }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEndpointId, setEditingEndpointId] = useState(null);

  const fetchEndpoints = useCallback(async () => {
    const response = await axiosInstance.get(`api/projects/${projectId}/endpoints`);
    setEndpoints(response.data.data || []);
  }, [projectId]);

  const fetchAnalytics = useCallback(async () => {
    const response = await axiosInstance.get(`api/projects/${projectId}/endpoints/logs`);
    const analyticsMap = Object.fromEntries(
      (response.data.data || []).map((entry) => [entry.endpointId, entry])
    );

    setEndpointAnalytics(analyticsMap);
    setRecentLogs(response.data.recentLogs || []);
  }, [projectId]);

  useEffect(() => {
    const loadWorkspaceData = async () => {
      try {
        await Promise.all([fetchEndpoints(), fetchAnalytics()]);
      } catch (error) {
        console.error('Error fetching workspace data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaceData();
  }, [fetchEndpoints, fetchAnalytics]);

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

  const resetForm = () => {
    setEditingEndpointId(null);
    setPath('');
    setMethod('GET');
    setItemCount(10);
    setDelay(0);
    setForceError(false);
    setErrorCode(500);
    setFields([{ fieldName: 'id', dataType: 'uuid' }]);
  };

  const handleGenerateAPI = async (e) => {
    e.preventDefault();
    if (!path.trim()) return alert('Path is required');

    const validFields = fields.filter((field) => field.fieldName.trim() !== '');
    if (validFields.length === 0) return alert('Add at least one valid field');

    try {
      setIsSaving(true);
      const payload = {
        path,
        method,
        fields: validFields,
        config: {
          itemCount: Number(itemCount),
          delay: Number(delay),
          forceError,
          errorCode: Number(errorCode)
        }
      };

      if (editingEndpointId) {
        const response = await axiosInstance.put(`api/projects/${editingEndpointId}`, payload);
        setEndpoints((currentEndpoints) =>
          currentEndpoints.map((endpoint) =>
            endpoint._id === editingEndpointId ? response.data.data : endpoint
          )
        );
        resetForm();
      } else {
        const createPayload = {
          ...payload,
          itemCount: payload.config.itemCount,
          delay: payload.config.delay,
          forceError: payload.config.forceError,
          errorCode: payload.config.errorCode
        };

        await axiosInstance.post(`api/projects/${projectId}/endpoints`, createPayload);
        resetForm();
      }

      await Promise.all([fetchEndpoints(), fetchAnalytics()]);
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (endpointId, fullPath) => {
    const normalizedPath = fullPath?.trim() || '/';
    const mockUrl = `${BACKEND_BASE_URL}/api/mock/${user.id}/${projectId}${normalizedPath}`;
    navigator.clipboard.writeText(mockUrl);
    setCopiedId(endpointId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteEndpoint = async (endpointId) => {
    if (!window.confirm('Are you sure you want to delete this endpoint?')) return;

    try {
      await axiosInstance.delete(`api/projects/${endpointId}`);
      setEndpoints((currentEndpoints) =>
        currentEndpoints.filter((endpoint) => endpoint._id !== endpointId)
      );
      setEndpointAnalytics((currentAnalytics) => {
        const updatedAnalytics = { ...currentAnalytics };
        delete updatedAnalytics[endpointId];
        return updatedAnalytics;
      });
      await fetchAnalytics();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete endpoint');
    }
  };

  const handleEditClick = (endpoint) => {
    setEditingEndpointId(endpoint._id);
    setPath(endpoint.path.replace(/^\//, ''));
    setMethod(endpoint.method);
    setItemCount(endpoint.config.itemCount || 10);
    setDelay(endpoint.config.delay || 0);
    setForceError(endpoint.config.forceError || false);
    setErrorCode(endpoint.config.errorCode || 500);
    setFields(
      endpoint.fields.length > 0
        ? endpoint.fields.map((field) => ({
            fieldName: field.fieldName,
            dataType: field.dataType
          }))
        : [{ fieldName: 'id', dataType: 'uuid' }]
    );

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never hit';
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading your workspace...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center shadow-sm">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="ml-8 text-xl font-bold text-gray-800">API Schema Builder</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Live Endpoints</h2>

          {endpoints.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-gray-500 text-sm shadow-sm">
              No endpoints created yet. Build one on the right!
            </div>
          ) : (
            endpoints.map((endpoint) => {
              const analytics = endpointAnalytics[endpoint._id];

              return (
                <div
                  key={endpoint._id}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative"
                >
                  <button
                    onClick={() => handleEditClick(endpoint)}
                    className="absolute top-4 right-12 text-gray-400 hover:text-blue-500 transition-colors bg-white rounded-full p-1 hover:bg-blue-50 cursor-pointer"
                    title="Edit Endpoint"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteEndpoint(endpoint._id)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-1 hover:bg-red-50 cursor-pointer"
                    title="Delete Endpoint"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex justify-between items-start mb-2 pr-15">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {endpoint.method}
                    </span>
                    <span className="text-xs text-gray-500">{endpoint.config.itemCount} items</span>
                  </div>

                  <p className="font-mono text-sm font-medium text-gray-800 break-all">{endpoint.path}</p>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg bg-gray-50 px-3 py-2 border border-gray-100">
                      <div className="flex items-center gap-1 text-gray-500 mb-1">
                        <Activity className="h-3.5 w-3.5" />
                        Hits
                      </div>
                      <p className="font-semibold text-gray-900">{analytics?.hitCount || 0}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2 border border-gray-100">
                      <div className="flex items-center gap-1 text-gray-500 mb-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        Avg Time
                      </div>
                      <p className="font-semibold text-gray-900">{analytics?.avgResponseTime || 0} ms</p>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-500 space-y-1">
                    <p>
                      Last status:{' '}
                      <span className="font-medium text-gray-700">{analytics?.lastStatusCode || '--'}</span>
                    </p>
                    <p>
                      Last hit:{' '}
                      <span className="font-medium text-gray-700">{formatLastSeen(analytics?.lastAccessedAt)}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => copyToClipboard(endpoint._id, endpoint.path)}
                    className="mt-4 w-full flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {copiedId === endpoint._id ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copiedId === endpoint._id ? 'Copied URL!' : 'Copy Mock URL'}
                  </button>
                </div>
              );
            })
          )}

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Recent API Activity</h3>
            </div>

            {recentLogs.length === 0 ? (
              <p className="text-sm text-gray-500">No mock API hits recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {recentLogs.slice(0, 8).map((log) => (
                  <div key={log.id} className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-3">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-mono text-xs font-medium text-gray-800">
                          {log.method} {log.path}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{formatLastSeen(log.createdAt)}</p>
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{log.statusCode}</span>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>{log.responseTime} ms</span>
                      <span>{log.ipAddress}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {editingEndpointId ? 'Edit Endpoint' : 'Create New Endpoint'}
          </h2>

          <form onSubmit={handleGenerateAPI} className="space-y-8">
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
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                  <option>PATCH</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Array Size</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={itemCount}
                  onChange={(e) => setItemCount(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Simulate Delay (ms)</label>
                <input
                  type="number"
                  min="0"
                  value={delay}
                  onChange={(e) => setDelay(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
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
                <input
                  type="checkbox"
                  id="forceError"
                  checked={forceError}
                  onChange={(e) => setForceError(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="forceError" className="text-sm font-medium text-gray-700 flex items-center">
                  <ServerCrash className="h-4 w-4 mr-1 text-red-500" /> Force Error
                </label>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium text-gray-900">Data Response Schema</h3>
                <button
                  type="button"
                  onClick={addField}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors cursor-pointer"
                >
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
                      {DATA_TYPES.map((type) => (
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

            <div className="flex justify-end space-x-4">
              {editingEndpointId && (
                <button
                  type="button"
                  onClick={resetForm}
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
                {isSaving ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    {editingEndpointId ? 'Update Endpoint' : 'Generate Endpoint API'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApiBuilder;
