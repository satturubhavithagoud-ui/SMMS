import { Link } from 'react-router-dom';

export default function Clients() {
  const clients = [
    {
      name: 'Luxe Hotels Group',
      industry: 'Hospitality & Travel',
      status: 'Active',
      reach: '1.2M',
      campaigns: 4,
      platforms: ['camera_alt', 'social_leaderboard', 'person_add'],
      img: 'https://lh3.googleusercontent.com/aida/ADBb0uiyDTxLulY7CukQTwM8-mLnxlzTnvYp78oUmWUPR5uaFksQWMfwL70VtiAXNX1Uzv_mxHse1c8WC7hRBMvwF-1DE3f07HnEko_0OjSmydCstYlKTwezwb7_0ylf3nmseUbLWIHIhKbIwflmxmct8nAC048wtTXy0HhXMZ9X295R9JaiDpMNeOC-Ipfi2IavvXFEKobHqNIITZC-GE7ccMNboECUFRQG4mh_l17AFzBd3UkltNJ393TSv93buaRTE5EJ6wbYTjv2ByY',
    },
    {
      name: 'SwiftEats Delivery',
      industry: 'Food & Beverage',
      status: 'Pending',
      reach: '450K',
      campaigns: 0,
      platforms: ['camera_alt', 'chat'],
      img: 'https://lh3.googleusercontent.com/aida/ADBb0ujLIo2tXXOSmsvcPByJg4RmDdJCtaUS19xFpDcM1D4WOF_6fK-e8zAAdFwr5OQa3PBM9aItSY9ZihrjEaTVHYf6H1H9Fw22UqTZvTIrpo5BWGiwuoPg_y0G7bxp5CXAEwCy9k9_0exfDPZUOtFuBVcyB4awS2IaSxQYNwMJUVuP58AGaCGvewf0GhQ2ejmDOAZQi8JXHln78s3kRuLLi14nKKbRPC6qvyf_IIlE131rW_KrgQjdSi1bDxOGYTKHG12YjfTreIisozA',
    },
    {
      name: 'TechCore Solutions',
      industry: 'Software & SaaS',
      status: 'Active',
      reach: '2.8M',
      campaigns: 12,
      platforms: ['person_add', 'social_leaderboard'],
      img: 'https://lh3.googleusercontent.com/aida/ADBb0ujKwsanRkXbzZCQusaDz-_CSHISAe6etTFauis1hwR7LCfLX2w7FhlibgvuvJJD1YdbOEw06R_jz673DTK3i2mI1EmFKQtLcx3eIZRUN1To9apWENwOYyjOfm9PDG6x9yT2MwwRr_BW4rl8ILysYNoCbIo1_JiJV3QNItoX0-c8n8V_VBikY904NU-ZLWSAT_mZXVB-0YhIFngMIKZJCBNkaeY5EIepGlzWq7TkYpGDQNXUneW38oVKFC5mMgWRzH_lg7p0bRriG8s',
    },
    {
      name: 'Vivid Studios',
      industry: 'Creative Agency',
      status: 'Paused',
      reach: '120K',
      campaigns: 0,
      platforms: ['camera_alt'],
      img: 'https://lh3.googleusercontent.com/aida/ADBb0uiyDTxLulY7CukQTwM8-mLnxlzTnvYp78oUmWUPR5uaFksQWMfwL70VtiAXNX1Uzv_mxHse1c8WC7hRBMvwF-1DE3f07HnEko_0OjSmydCstYlKTwezwb7_0ylf3nmseUbLWIHIhKbIwflmxmct8nAC048wtTXy0HhXMZ9X295R9JaiDpMNeOC-Ipfi2IavvXFEKobHqNIITZC-GE7ccMNboECUFRQG4mh_l17AFzBd3UkltNJ393TSv93buaRTE5EJ6wbYTjv2ByY',
    },
  ];

  return (
    <div className="p-xl max-w-6xl mx-auto">
      {/* Page Header Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-xs">Clients</h1>
          <p className="text-body-md text-outline">Manage 24 active accounts across your workspace.</p>
        </div>
        <div className="flex items-center gap-md flex-wrap">
          <div className="flex bg-surface-container-high rounded-lg p-unit">
            <button className="px-md py-xs bg-surface-container-lowest shadow-sm rounded-md font-label-bold text-label-bold text-on-surface">Grid View</button>
            <button className="px-md py-xs text-outline font-label-bold text-label-bold hover:text-on-surface transition-colors">List View</button>
          </div>
          <button className="flex items-center gap-sm px-md py-xs border border-outline-variant rounded-lg hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            <span className="font-label-bold text-label-bold">Filter</span>
          </button>
          <button className="bg-primary text-on-primary px-lg py-md rounded-lg font-bold flex items-center gap-sm shadow-md hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg mb-xl">
        <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-variant/50 flex flex-col justify-between h-[120px]">
          <span className="text-outline font-label-bold text-[11px] uppercase tracking-wider">Total Combined Reach</span>
          <div className="flex items-end justify-between">
            <span className="font-stat-lg text-stat-lg text-primary">8.4M</span>
            <span className="text-teal-600 font-label-bold text-xs flex items-center gap-xs">
              +12% <span className="material-symbols-outlined text-[14px]">trending_up</span>
            </span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-variant/50 flex flex-col justify-between h-[120px]">
          <span className="text-outline font-label-bold text-[11px] uppercase tracking-wider">Active Campaigns</span>
          <div className="flex items-end justify-between">
            <span className="font-stat-lg text-stat-lg text-primary">42</span>
            <span className="bg-secondary-container px-sm py-unit rounded text-[10px] font-bold text-on-secondary-container">8 STARTING SOON</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-surface-variant/50 flex flex-col justify-between h-[120px]">
          <span className="text-outline font-label-bold text-[11px] uppercase tracking-wider">Pending Approvals</span>
          <div className="flex items-end justify-between">
            <span className="font-stat-lg text-stat-lg text-primary">14</span>
            <span className="text-primary font-label-bold text-xs">Needs review</span>
          </div>
        </div>
        <div className="bg-primary p-lg rounded-xl shadow-sm flex flex-col justify-between h-[120px]">
          <span className="text-on-primary/60 font-label-bold text-[11px] uppercase tracking-wider">Workspace Health</span>
          <div className="flex items-end justify-between">
            <span className="font-stat-lg text-stat-lg text-on-primary">98%</span>
            <span className="w-10 h-10 rounded-full bg-on-primary/10 flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined">verified</span>
            </span>
          </div>
        </div>
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">
        {clients.map((client, i) => (
          <div key={i} className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm overflow-hidden flex flex-col transition-transform hover:-translate-y-1 group">
            <div className="p-lg">
              <div className="flex justify-between items-start mb-md">
                <div className="flex items-center gap-md">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-surface-container">
                    <img className="w-full h-full object-cover" src={client.img} alt={client.name} />
                  </div>
                  <div>
                    <h3 className="font-headline-md text-[16px] text-on-surface">{client.name}</h3>
                    <p className="text-[12px] text-outline">{client.industry}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-sm py-unit rounded font-bold border uppercase tracking-tighter ${
                  client.status === 'Active' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                  client.status === 'Pending' ? 'bg-secondary-container text-on-secondary-container border-outline-variant' :
                  'bg-surface-container-highest text-outline border-outline-variant'
                }`}>
                  {client.status}
                </span>
              </div>
              <div className="flex gap-sm mb-lg">
                {client.platforms.map((p, idx) => (
                  <div key={idx} className="w-6 h-6 rounded-full bg-primary/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] text-primary">{p}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-md mb-lg">
                <div className="bg-surface-container p-sm rounded-lg">
                  <p className="text-[10px] text-outline font-bold uppercase tracking-tight">Monthly Reach</p>
                  <p className="font-label-bold text-primary">{client.reach}</p>
                </div>
                <div className="bg-surface-container p-sm rounded-lg">
                  <p className="text-[10px] text-outline font-bold uppercase tracking-tight">Campaigns</p>
                  <p className="font-label-bold text-primary">{client.campaigns} Active</p>
                </div>
              </div>
            </div>
            <div className="mt-auto border-t border-surface-variant px-lg py-md flex items-center justify-between bg-surface-bright">
              <div className="flex items-center gap-sm">
                <Link to="/analytics" className="text-primary font-label-bold text-label-bold hover:underline">Analytics</Link>
                <span className="text-outline">•</span>
                <Link to="/scheduler" className="text-primary font-label-bold text-label-bold hover:underline">Schedule</Link>
              </div>
              <button className="bg-surface-container hover:bg-surface-container-high text-on-surface text-label-bold font-label-bold px-md py-unit rounded-md transition-colors">
                View Profile
              </button>
            </div>
          </div>
        ))}

        {/* Featured Campaign Callout */}
        <div className="lg:col-span-2 bg-primary-container text-on-primary-container rounded-xl overflow-hidden shadow-lg relative min-h-[280px] flex">
          <div className="p-xl relative z-10 w-full md:w-1/2 flex flex-col justify-center">
            <span className="bg-inverse-primary text-primary px-sm py-unit rounded-full text-[10px] font-bold w-fit mb-md">NEW FEATURE</span>
            <h2 className="font-headline-xl text-headline-md text-white mb-md leading-tight">Advanced Audience Insights for Enterprise</h2>
            <p className="text-primary-fixed-dim text-body-md mb-lg">Unlock deeper demographic data and performance tracking for your high-value clients.</p>
            <button className="bg-white text-primary px-lg py-md rounded-lg font-bold w-fit hover:bg-surface-container transition-colors shadow-lg">Upgrade Now</button>
          </div>
          <div className="absolute right-0 top-0 w-full h-full hidden md:block">
            <img className="w-full h-full object-cover opacity-60" alt="Data visualization" src="https://lh3.googleusercontent.com/aida/ADBb0ujKwsanRkXbzZCQusaDz-_CSHISAe6etTFauis1hwR7LCfLX2w7FhlibgvuvJJD1YdbOEw06R_jz673DTK3i2mI1EmFKQtLcx3eIZRUN1To9apWENwOYyjOfm9PDG6x9yT2MwwRr_BW4rl8ILysYNoCbIo1_JiJV3QNItoX0-c8n8V_VBikY904NU-ZLWSAT_mZXVB-0YhIFngMIKZJCBNkaeY5EIepGlzWq7TkYpGDQNXUneW38oVKFC5mMgWRzH_lg7p0bRriG8s" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-container via-primary-container/80 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-xl flex flex-col md:flex-row items-center justify-between gap-md py-lg border-t border-surface-variant">
        <p className="text-body-md text-outline">Showing <span className="font-bold text-on-surface">1 - 4</span> of <span className="font-bold text-on-surface">24</span> clients</p>
        <div className="flex items-center gap-xs">
          <button className="p-sm rounded hover:bg-surface-container-high transition-colors text-outline">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="w-8 h-8 rounded bg-primary text-on-primary font-bold text-sm">1</button>
          <button className="w-8 h-8 rounded hover:bg-surface-container-high text-on-surface transition-colors font-bold text-sm">2</button>
          <button className="w-8 h-8 rounded hover:bg-surface-container-high text-on-surface transition-colors font-bold text-sm">3</button>
          <span className="text-outline mx-xs">...</span>
          <button className="w-8 h-8 rounded hover:bg-surface-container-high text-on-surface transition-colors font-bold text-sm">6</button>
          <button className="p-sm rounded hover:bg-surface-container-high transition-colors text-outline">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
