import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SMHLayout from '../components/SMHLayout';
import PlatformLogo from '../components/PlatformLogo';
import { useSearch } from '../context/SearchContext';
import { apiRequest } from '../services/api.js';

const AVATAR_COLORS = [
  'bg-[#4F46E5] text-white',
  'bg-[#059669] text-white',
  'bg-[#7C3AED] text-white',
  'bg-[#0EA5E9] text-white',
  'bg-[#F97316] text-white',
  'bg-[#EC4899] text-white',
  'bg-[#DC2626] text-white',
  'bg-[#0891B2] text-white',
];

function avatarColor(name) {
  const n = (name || '').trim();
  let hash = 0;
  for (let i = 0; i < n.length; i += 1) hash = (hash * 31 + n.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function firstLetter(name) {
  return (name || '?').trim().charAt(0).toUpperCase() || '?';
}

function ClientsContent() {
  const { searchQuery } = useSearch();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ fullname: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/smh/dashboard/summary/', { method: 'GET' });
      const roster = Array.isArray(data) ? data : data?.client_roster || [];
      setClients(roster);
    } catch (e) {
      setError(e.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest('/smh/clients/', {
        method: 'POST',
        body: JSON.stringify(form),
        headers: { 'Content-Type': 'application/json' },
      });
      setForm({ fullname: '', email: '', password: '' });
      document.getElementById('add-client-modal').close();
      fetchClients();
    } catch (e) {
      setError(e.message || 'Failed to add client');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.industry && c.industry.toLowerCase().includes(q)) ||
        (c.plan && c.plan.toLowerCase().includes(q))
    );
  }, [clients, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-xs">Clients</h1>
          <p className="text-body-md text-outline">Manage active client accounts across your workspace.</p>
        </div>
        <div className="flex items-center gap-md">
          <button
            className="bg-primary text-on-primary px-lg py-md rounded-lg font-bold flex items-center gap-sm shadow-md hover:opacity-90 transition-opacity"
            onClick={() => document.getElementById('add-client-modal').showModal()}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {searchQuery && (
        <p className="text-sm text-on-surface-variant mb-md">
          Showing {filteredClients.length} of {clients.length} clients
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm overflow-hidden">
              <div className="p-lg space-y-md">
                <div className="flex items-center gap-md">
                  <span className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-surface-container-high" />
                  <span className="flex-1 space-y-2">
                    <span className="block h-3 w-28 animate-pulse rounded bg-surface-container-high" />
                    <span className="block h-2.5 w-20 animate-pulse rounded bg-surface-container-low" />
                  </span>
                </div>
                <span className="block h-2.5 w-40 animate-pulse rounded bg-surface-container-low" />
                <span className="block h-2.5 w-32 animate-pulse rounded bg-surface-container-low" />
              </div>
              <div className="border-t border-surface-variant px-lg py-md bg-surface-bright">
                <span className="block h-3 w-24 animate-pulse rounded bg-surface-container-high" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-md py-20 text-center">
          <span className="material-symbols-outlined text-4xl text-error">cloud_off</span>
          <p className="text-on-surface-variant">{error}</p>
          <button onClick={fetchClients} className="px-lg py-sm bg-primary text-on-primary rounded-lg font-label-bold shadow-md hover:opacity-95">
            Retry
          </button>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-md py-20 text-center border border-dashed border-outline-variant rounded-xl">
          <span className="material-symbols-outlined text-4xl text-outline/40">group</span>
          <p className="text-on-surface-variant">{searchQuery ? `No clients match "${searchQuery}"` : 'No clients yet. Add your first client to get started.'}</p>
          {!searchQuery && (
            <button
              className="bg-primary text-on-primary px-lg py-md rounded-lg font-bold shadow-md hover:opacity-90 transition-opacity"
              onClick={() => document.getElementById('add-client-modal').showModal()}
            >
              Add Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">
          {filteredClients.map((c) => (
            <div key={c.id} className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm overflow-hidden flex flex-col transition-transform hover:-translate-y-1">
              <div className="p-lg flex flex-col flex-1 min-w-0">
                <div className="flex justify-between items-start gap-sm mb-md">
                  <div className="flex items-center gap-md min-w-0">
                    {c.logo ? (
                      <div className="w-12 h-12 shrink-0 rounded-full overflow-hidden border-2 border-surface-container bg-surface-container-high">
                        <img className="w-full h-full object-cover" src={c.logo} alt={c.name || 'Client'} />
                      </div>
                    ) : (
                      <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${avatarColor(c.name)}`}>
                        {firstLetter(c.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-headline-md text-[16px] text-on-surface truncate max-w-full">{c.name || 'Unnamed client'}</h3>
                      <p className="text-[12px] text-outline truncate">{c.industry || 'General'}</p>
                    </div>
                  </div>
                  <span className="shrink-0 bg-teal-50 text-teal-700 text-[10px] px-sm py-unit rounded font-bold border border-teal-100 uppercase tracking-tighter">
                    {c.plan}
                  </span>
                </div>

                <div className="flex items-center gap-sm mb-md min-h-[28px]">
                  {c.platforms?.length ? (
                    <>
                      {c.platforms.slice(0, 4).map((p) => (
                        <PlatformLogo key={p} platform={p} size={16} variant="badge" />
                      ))}
                      {c.platforms.length > 4 && (
                        <span className="text-[11px] text-outline">+{c.platforms.length - 4}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-[11px] text-outline">No platforms connected</span>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between gap-sm pt-md">
                  <span className={`text-[11px] px-sm py-unit rounded-full font-bold uppercase tracking-tighter ${
                    c.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    {c.status || 'Pending'}
                  </span>
                  <span className="text-[11px] text-outline whitespace-nowrap">{c.weekly_posts || '0 posts'}</span>
                </div>
              </div>

              <div className="border-t border-surface-variant px-lg py-md flex items-center justify-between bg-surface-bright">
                <Link to={`/smh-analytics?client=${c.id}`} className="text-primary font-label-bold hover:underline">
                  Analytics
                </Link>
                <span className="text-outline">•</span>
                <Link to={`/smh-scheduler?client=${c.id}`} className="text-primary font-label-bold hover:underline">
                  Schedule
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <dialog id="add-client-modal" className="rounded-lg p-5">
        <form method="dialog" onSubmit={handleSubmit} className="flex flex-col gap-md">
          <h2 className="font-headline-lg text-headline-lg">Add New Client</h2>
          <input name="fullname" placeholder="Full Name" value={form.fullname} onChange={handleChange} className="border rounded p-2" required />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className="border rounded p-2" required />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} className="border rounded p-2" required />
          <button type="submit" disabled={submitting} className="bg-primary text-on-primary px-lg py-md rounded-lg font-bold">
            {submitting ? 'Adding…' : 'Add Client'}
          </button>
        </form>
        <button onClick={() => document.getElementById('add-client-modal').close()} className="mt-2 text-gray-500">Close</button>
      </dialog>
    </div>
  );
}

export default function SMHClients() {
  return (
    <SMHLayout>
      <ClientsContent />
    </SMHLayout>
  );
}
