'use client';

export function PrintDpaButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
      style={{ minHeight: '44px' }}
    >
      Print or save as PDF
    </button>
  );
}
