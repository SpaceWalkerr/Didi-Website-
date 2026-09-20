/** Small pill used for trust markers, status and the "most booked" flag. */
export default function Badge({ children, tone = 'brand', className = '', icon: Icon }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-800 ring-brand-200',
    care: 'bg-care-50 text-care-800 ring-care-200',
    warm: 'bg-surface-100 text-slate-700 ring-surface-300',
    amber: 'bg-amber-50 text-amber-900 ring-amber-300',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium
                  ring-1 ring-inset ${tones[tone]} ${className}`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}
