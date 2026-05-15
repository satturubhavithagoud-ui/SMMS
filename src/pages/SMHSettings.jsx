import SMHLayout from '../components/SMHLayout';

export default function SMHSettings() {
  return (
    <SMHLayout>
      <main className="p-xl max-w-7xl mx-auto">
        <header className="mb-xl">
          <h2 className="font-headline-xl text-headline-xl text-primary font-bold">Settings</h2>
          <p className="text-on-surface-variant text-body-md">Manage your agency workspace, team, and billing.</p>
        </header>

        <div className="flex border-b border-outline-variant mb-xl gap-xl">
          <button className="pb-md text-primary font-bold border-b-2 border-primary">General</button>
          <button className="pb-md text-on-surface-variant hover:text-primary transition-colors">Security</button>
          <button className="pb-md text-on-surface-variant hover:text-primary transition-colors">Team</button>
          <button className="pb-md text-on-surface-variant hover:text-primary transition-colors">Integrations</button>
          <button className="pb-md text-on-surface-variant hover:text-primary transition-colors">Billing</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
          <div className="lg:col-span-8 space-y-xl">
            {/* Profile Settings */}
            <section className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm">
              <div className="flex items-center justify-between mb-lg">
                <h3 className="font-headline-md text-headline-md text-on-surface">Profile Settings</h3>
                <span className="material-symbols-outlined text-primary/40">person</span>
              </div>
              <div className="flex items-start gap-xl">
                <div className="relative group cursor-pointer shrink-0">
                  <img alt="Upload" className="w-24 h-24 rounded-xl object-cover ring-4 ring-surface-container shadow-md" src="https://lh3.googleusercontent.com/aida/ADBb0uiyDTxLulY7CukQTwM8-mLnxlzTnvYp78oUmWUPR5uaFksQWMfwL70VtiAXNX1Uzv_mxHse1c8WC7hRBMvwF-1DE3f07HnEko_0OjSmydCstYlKTwezwb7_0ylf3nmseUbLWIHIhKbIwflmxmct8nAC048wtTXy0HhXMZ9X295R9JaiDpMNeOC-Ipfi2IavvXFEKobHqNIITZC-GE7ccMNboECUFRQG4mh_l17AFzBd3UkltNJ393TSv93buaRTE5EJ6wbYTjv2ByY" />
                  <div className="absolute inset-0 bg-primary/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-on-primary">photo_camera</span>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div className="space-y-xs">
                    <label className="font-label-bold text-label-bold text-on-surface-variant">Full Name</label>
                    <input className="w-full border-outline-variant border rounded-lg bg-surface focus:border-primary focus:ring-1 focus:ring-primary py-sm px-md text-body-md" type="text" defaultValue="Alex Chen" />
                  </div>
                  <div className="space-y-xs">
                    <label className="font-label-bold text-label-bold text-on-surface-variant">Email Address</label>
                    <input className="w-full border-outline-variant border rounded-lg bg-surface focus:border-primary focus:ring-1 focus:ring-primary py-sm px-md text-body-md" type="email" defaultValue="alex@socialpro.io" />
                  </div>
                  <div className="md:col-span-2 space-y-xs">
                    <label className="font-label-bold text-label-bold text-on-surface-variant">Bio</label>
                    <textarea className="w-full border-outline-variant border rounded-lg bg-surface focus:border-primary focus:ring-1 focus:ring-primary py-sm px-md text-body-md resize-none" rows="3" defaultValue="Senior Growth Manager and Social Strategy Lead. Passionate about data-driven engagement and AI-powered storytelling."></textarea>
                  </div>
                </div>
              </div>
            </section>

            {/* Team Management */}
            <section className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm">
              <div className="flex items-center justify-between mb-lg">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Team Management</h3>
                  <p className="text-body-md text-on-surface-variant">Manage your agency members and their access levels.</p>
                </div>
                <button className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-bold flex items-center gap-sm">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Invite Member
                </button>
              </div>
              <div className="space-y-md">
                {[
                  { name: 'Jordan Day', email: 'jordan@agency.com', role: 'Content Creator', initials: 'JD', color: 'bg-primary-fixed-dim text-primary' },
                  { name: 'Maria Lopez', email: 'm.lopez@agency.com', role: 'Strategist', initials: 'ML', color: 'bg-tertiary-fixed-dim text-tertiary' },
                ].map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-sm hover:bg-surface-container-low/40 rounded-xl transition-colors border border-transparent hover:border-outline-variant">
                    <div className="flex items-center gap-md">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${m.color}`}>{m.initials}</div>
                      <div>
                        <p className="font-label-bold text-on-surface">{m.name}</p>
                        <p className="text-body-md text-on-surface-variant">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-xl">
                      <span className="px-md py-xs bg-secondary-container text-on-secondary-container text-[11px] font-bold rounded-full uppercase tracking-wider">{m.role}</span>
                      <button className="text-on-surface-variant hover:text-error transition-colors">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-xl">
            {/* Subscription Card */}
            <section className="bg-primary text-on-primary rounded-xl overflow-hidden shadow-lg">
              <div className="p-lg">
                <div className="flex justify-between items-start mb-lg">
                  <div>
                    <p className="font-label-bold text-on-primary/60 uppercase tracking-widest text-[10px]">Current Plan</p>
                    <h4 className="font-headline-md text-headline-md">Agency Elite</h4>
                  </div>
                  <span className="px-md py-xs bg-primary-fixed text-primary text-[10px] font-bold rounded-full">ACTIVE</span>
                </div>
                <div className="space-y-md mb-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-on-primary/70 text-body-md">Next billing:</span>
                    <span className="font-bold">Oct 24, 2024</span>
                  </div>
                </div>
                <button className="w-full bg-on-primary text-primary py-sm rounded-lg font-bold transition-transform active:scale-95">Manage Billing</button>
              </div>
            </section>

            {/* Notifications */}
            <section className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-lg">Notifications</h3>
              <div className="space-y-md">
                {[
                  { label: 'Email Notifications', active: true },
                  { label: 'Push Notifications', active: false },
                  { label: 'Weekly Reports', active: true },
                ].map((n, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-body-md text-on-surface-variant">{n.label}</span>
                    <button className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${n.active ? 'bg-primary' : 'bg-surface-container-highest'}`}>
                      <span className={`${n.active ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <footer className="mt-xl pt-lg border-t border-outline-variant flex justify-end gap-md">
          <button className="px-xl py-md text-on-surface-variant font-label-bold hover:text-primary transition-colors">Discard Changes</button>
          <button className="px-xl py-md bg-primary text-on-primary rounded-xl font-label-bold shadow-md hover:opacity-95 transition-all active:scale-95">Save & Update Profile</button>
        </footer>
      </main>
    </SMHLayout>
  );
}
