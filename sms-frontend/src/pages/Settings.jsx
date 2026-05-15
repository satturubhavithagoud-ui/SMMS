export default function Settings() {
  const sections = [
    { title: 'Account', icon: 'person', desc: 'Manage your profile and personal information.' },
    { title: 'Agency Settings', icon: 'business', desc: 'Configure workspace, team members, and branding.' },
    { title: 'Notifications', icon: 'notifications', desc: 'Control email and in-app alert preferences.' },
    { title: 'Security', icon: 'security', desc: 'Manage password, 2FA, and session history.' },
    { title: 'Billing', icon: 'payments', desc: 'View invoices and manage subscription plans.' },
    { title: 'Integrations', icon: 'api', desc: 'Connect third-party tools and API access.' },
  ];

  return (
    <div className="p-xl max-w-6xl mx-auto">
      <div className="mb-xl">
        <h1 className="font-headline-xl text-headline-xl text-on-surface mb-xs">Settings</h1>
        <p className="text-body-md text-outline">Manage your account and agency preferences.</p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden shadow-sm">
        {sections.map((s, i) => (
          <div key={s.title} className={`p-lg flex items-center justify-between hover:bg-surface-container transition-colors cursor-pointer ${i !== sections.length - 1 ? 'border-b border-surface-variant/50' : ''}`}>
            <div className="flex items-center gap-lg">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined">{s.icon}</span>
              </div>
              <div>
                <h3 className="font-label-bold text-body-lg text-on-surface">{s.title}</h3>
                <p className="text-body-md text-outline">{s.desc}</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline">chevron_right</span>
          </div>
        ))}
      </div>

      <div className="mt-xl flex justify-end gap-md">
        <button className="px-lg py-md border border-error/30 text-error rounded-lg font-bold hover:bg-error/5 transition-colors">Log Out</button>
      </div>
    </div>
  );
}
