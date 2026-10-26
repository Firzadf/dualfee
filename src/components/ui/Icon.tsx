const P: Record<string, string> = {
  lab: 'M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3',
  board: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 3',
  calc: 'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01',
  convert: 'M7 7h13l-4-4M17 17H4l4 4',
  deploy: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5',
  verify: 'M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3zM9 12l2 2 4-4',
  docs: 'M5 4h10l4 4v12H5zM15 4v4h4M8 12h8M8 16h6',
  home: 'M3 11l9-7 9 7v9H3zM9 20v-6h6v6',
};
export default function Icon({ name, className = 'h-4 w-4' }: { name: keyof typeof P | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] ?? P.docs} />
    </svg>
  );
}
