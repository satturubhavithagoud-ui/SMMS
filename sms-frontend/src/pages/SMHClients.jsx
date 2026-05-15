import SMHLayout from '../components/SMHLayout';
import { Link } from 'react-router-dom';

export default function SMHClients() {
  return (
    <SMHLayout>
      <div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
          <div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface mb-xs">Clients</h1>
            <p className="text-body-md text-outline">Manage 24 active accounts across your workspace.</p>
          </div>
          <div className="flex items-center gap-md">
            <button className="bg-primary text-on-primary px-lg py-md rounded-lg font-bold flex items-center gap-sm shadow-md hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Add Client</span>
            </button>
          </div>
        </div>

        {/* Client Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm overflow-hidden flex flex-col transition-transform hover:-translate-y-1">
            <div className="p-lg">
              <div className="flex justify-between items-start mb-md">
                <div className="flex items-center gap-md">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-surface-container">
                    <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida/ADBb0uiyDTxLulY7CukQTwM8-mLnxlzTnvYp78oUmWUPR5uaFksQWMfwL70VtiAXNX1Uzv_mxHse1c8WC7hRBMvwF-1DE3f07HnEko_0OjSmydCstYlKTwezwb7_0ylf3nmseUbLWIHIhKbIwflmxmct8nAC048wtTXy0HhXMZ9X295R9JaiDpMNeOC-Ipfi2IavvXFEKobHqNIITZC-GE7ccMNboECUFRQG4mh_l17AFzBd3UkltNJ393TSv93buaRTE5EJ6wbYTjv2ByY" />
                  </div>
                  <div>
                    <h3 className="font-headline-md text-[16px] text-on-surface">Luxe Hotels Group</h3>
                    <p className="text-[12px] text-outline">Hospitality & Travel</p>
                  </div>
                </div>
                <span className="bg-teal-50 text-teal-700 text-[10px] px-sm py-unit rounded font-bold border border-teal-100 uppercase tracking-tighter">Active</span>
              </div>
            </div>
            <div className="mt-auto border-t border-surface-variant px-lg py-md flex items-center justify-between bg-surface-bright">
              <div className="flex items-center gap-sm">
                <Link to="/smh-analytics" className="text-primary font-label-bold text-label-bold hover:underline">Analytics</Link>
                <span className="text-outline">•</span>
                <Link to="/smh-scheduler" className="text-primary font-label-bold text-label-bold hover:underline">Schedule</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SMHLayout>
  );
}
