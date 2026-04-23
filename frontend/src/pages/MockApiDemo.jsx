import { useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Database,
  FileJson2,
  Gauge,
  Loader2,
  Play,
  RefreshCcw,
  Server,
} from 'lucide-react';

const DEFAULT_MOCK_URL = 'http://localhost:5001/api/mock/your-user-id/your-project-id/users';

const formatDuration = (milliseconds) => {
  if (milliseconds === null) return '--';
  if (milliseconds < 1000) return `${milliseconds} ms`;
  return `${(milliseconds / 1000).toFixed(2)} s`;
};

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') return [payload];
  return [];
};

const getColumns = (rows) => {
  const keys = new Set();

  rows.slice(0, 10).forEach((row) => {
    if (row && typeof row === 'object' && !Array.isArray(row)) {
      Object.keys(row).forEach((key) => keys.add(key));
    }
  });

  return Array.from(keys).slice(0, 6);
};

const getStatusTone = (statusCode) => {
  if (!statusCode) return 'text-zinc-500';
  if (statusCode >= 200 && statusCode < 300) return 'text-emerald-700';
  if (statusCode >= 400) return 'text-rose-700';
  return 'text-amber-700';
};

const MockApiDemo = () => {
  const [mockUrl, setMockUrl] = useState(() => (
    localStorage.getItem('mockengine-demo-url') || DEFAULT_MOCK_URL
  ));
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [statusCode, setStatusCode] = useState(null);
  const [duration, setDuration] = useState(null);
  const [loading, setLoading] = useState(false);

  const rows = useMemo(() => normalizeRows(data), [data]);
  const columns = useMemo(() => getColumns(rows), [rows]);
  const hasTableData = rows.length > 0 && columns.length > 0;

  const fetchMockApi = async () => {
    const url = mockUrl.trim();

    if (!url) {
      setError('Please paste a generated mock API URL.');
      setStatusCode(null);
      setData(null);
      return;
    }

    localStorage.setItem('mockengine-demo-url', url);
    setLoading(true);
    setError('');
    setData(null);
    setStatusCode(null);
    setDuration(null);

    const startedAt = performance.now();

    try {
      const response = await axios.get(url);
      setStatusCode(response.status);
      setData(response.data);
    } catch (err) {
      setStatusCode(err.response?.status || null);
      setData(err.response?.data || null);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          'Request failed'
      );
    } finally {
      setDuration(Math.round(performance.now() - startedAt));
      setLoading(false);
    }
  };

  const resetDemo = () => {
    setMockUrl(DEFAULT_MOCK_URL);
    setData(null);
    setError('');
    setStatusCode(null);
    setDuration(null);
    localStorage.removeItem('mockengine-demo-url');
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-800">
                <Server className="h-4 w-4" />
                Frontend API Test Screen
              </div>
              <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
                Validate your generated mock API from a real React page
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
                Run the endpoint, inspect status, measure response time, render tabular data, and view the raw JSON payload.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="rounded-md bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-zinc-500">
                  <Gauge className="h-4 w-4" />
                  Status
                </div>
                <p className={`mt-2 text-2xl font-bold ${getStatusTone(statusCode)}`}>
                  {statusCode || '--'}
                </p>
              </div>
              <div className="rounded-md bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-zinc-500">
                  <Clock3 className="h-4 w-4" />
                  Time
                </div>
                <p className="mt-2 text-2xl font-bold text-zinc-900">{formatDuration(duration)}</p>
              </div>
              <div className="rounded-md bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-zinc-500">
                  <Database className="h-4 w-4" />
                  Rows
                </div>
                <p className="mt-2 text-2xl font-bold text-zinc-900">{rows.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[410px_1fr] lg:px-8">
        <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <label htmlFor="mock-url" className="text-sm font-bold text-zinc-900">
            Generated mock API URL
          </label>
          <textarea
            id="mock-url"
            value={mockUrl}
            onChange={(event) => setMockUrl(event.target.value)}
            rows={4}
            className="mt-3 w-full resize-none rounded-md border border-zinc-300 px-3 py-3 font-mono text-sm text-zinc-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
            placeholder={DEFAULT_MOCK_URL}
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <button
              type="button"
              onClick={fetchMockApi}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-cyan-500"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run Request
            </button>
            <button
              type="button"
              onClick={resetDemo}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-900">Demo endpoint format</p>
            <code className="mt-3 block rounded-md bg-white p-3 text-xs leading-5 text-zinc-700">
              http://localhost:5001/api/mock/:userId/:projectId/users
            </code>
          </div>
        </aside>

        <div className="space-y-6">
          {loading && (
            <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-5">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-700" />
                <div>
                  <p className="font-bold text-cyan-950">Request running</p>
                  <p className="text-sm text-cyan-800">The page is waiting for the mock API response.</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-rose-700" />
                <div>
                  <p className="font-bold text-rose-950">Request failed</p>
                  <p className="mt-1 text-sm text-rose-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && data && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                <div>
                  <p className="font-bold text-emerald-950">Response received</p>
                  <p className="mt-1 text-sm text-emerald-800">The mock endpoint returned data successfully.</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">Rendered Response</h2>
                <p className="text-sm text-zinc-500">First 8 rows, first 6 fields</p>
              </div>
              <Database className="h-5 w-5 text-zinc-400" />
            </div>

            {hasTableData ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200">
                  <thead className="bg-zinc-50">
                    <tr>
                      {columns.map((column) => (
                        <th
                          key={column}
                          scope="col"
                          className="px-5 py-3 text-left text-xs font-bold uppercase text-zinc-500"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {rows.slice(0, 8).map((row, rowIndex) => (
                      <tr key={`${rowIndex}-${columns.map((column) => row?.[column]).join('-')}`} className="hover:bg-zinc-50">
                        {columns.map((column) => (
                          <td key={column} className="max-w-[220px] truncate px-5 py-4 text-sm text-zinc-700">
                            {String(row?.[column] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex min-h-[240px] items-center justify-center px-5 py-10 text-center">
                <div>
                  <FileJson2 className="mx-auto h-11 w-11 text-zinc-300" />
                  <p className="mt-4 font-bold text-zinc-900">No response rendered</p>
                  <p className="mt-1 text-sm text-zinc-500">Run a request to display generated mock data.</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <h2 className="text-lg font-bold text-white">Raw JSON</h2>
              <FileJson2 className="h-5 w-5 text-zinc-400" />
            </div>
            <pre className="max-h-[420px] overflow-auto p-5 text-sm leading-6 text-zinc-100">
              {data ? JSON.stringify(data, null, 2) : '// Response JSON will appear here'}
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
};

export default MockApiDemo;
