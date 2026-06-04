export function getPositionBadgeClass(position: number) {
  if (position === 1) return "bg-amber-100 text-amber-800 ring-amber-300";
  if (position === 2) return "bg-slate-200 text-slate-800 ring-slate-300";
  if (position === 3) return "bg-orange-100 text-orange-800 ring-orange-300";
  return "bg-blue-50 text-blue-700 ring-blue-100";
}
