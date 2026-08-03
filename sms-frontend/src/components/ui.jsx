const STATUS_MAP = {
  POSTED: { label: 'Published', cls: 'badge-success' },
  SCHEDULED: { label: 'Scheduled', cls: 'badge-warning' },
  FAILED: { label: 'Failed', cls: 'badge-danger' },
  DRAFT: { label: 'Draft', cls: 'badge-neutral' },
  PENDING_APPROVAL: { label: 'Pending', cls: 'badge-info' },
};

export function statusDotColor(status) {
  if (status === 'POSTED') return 'bg-emerald-500';
  if (status === 'FAILED') return 'bg-red-500';
  if (status === 'SCHEDULED') return 'bg-primary';
  if (status === 'DRAFT') return 'bg-outline-variant';
  return 'bg-outline-variant';
}

export function StatusBadge({ status }) {
  const meta = STATUS_MAP[status] || { label: status || 'Unknown', cls: 'badge-neutral' };
  return <span className={`badge ${meta.cls}`}>{meta.label}</span>;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="font-manrope text-[26px] font-bold leading-8 text-on-surface md:text-[28px] md:leading-9">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-on-surface-variant md:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function SectionCard({ title, subtitle, icon, action, children, className = '', bodyClassName = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || icon || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-surface-variant/60 px-5 py-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {icon && <span className="material-symbols-outlined shrink-0 text-primary/50">{icon}</span>}
            <div className="min-w-0">
              <h3 className="card-heading">{title}</h3>
              {subtitle && <p className="mt-0.5 text-sm text-on-surface-variant">{subtitle}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className={`px-5 py-5 md:px-6 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function StatCard({ icon, iconBgClass = 'bg-primary/10 text-primary', label, value, sub, trend, className = '' }) {
  return (
    <div className={`card card-hover flex h-full flex-col p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${iconBgClass}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${trend === 'up' ? 'text-emerald-600' : 'text-error'}`}>
            <span className="material-symbols-outlined text-[14px]">{trend === 'up' ? 'trending_up' : 'trending_down'}</span>
            {trend === 'up' ? 'Up' : 'Down'}
          </span>
        )}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 truncate font-manrope text-[26px] font-bold leading-9 text-on-surface tabular-nums md:text-[28px]">{value}</p>
      {sub && <p className="mt-auto pt-2 text-xs font-medium text-on-surface-variant">{sub}</p>}
    </div>
  );
}

export function EmptyState({ icon = 'inbox', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-outline-variant/70 px-6 py-12 text-center">
      <span className="material-symbols-outlined text-5xl text-outline/40">{icon}</span>
      <div>
        <p className="font-manrope text-base font-semibold text-on-surface">{title}</p>
        {message && <p className="mt-1 text-sm text-on-surface-variant">{message}</p>}
      </div>
      {action}
    </div>
  );
}
