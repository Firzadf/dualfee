export type NavItem = { to: string; label: string; short: string; icon: string };

export const APP_NAV: NavItem[] = [
  { to: '/app/lab', label: 'Fee Lab', short: 'Lab', icon: 'lab' },
  { to: '/app/leaderboard', label: 'Leaderboard', short: 'Board', icon: 'board' },
  { to: '/app/history', label: 'History', short: 'History', icon: 'history' },
  { to: '/app/calculator', label: 'Calculator', short: 'Calc', icon: 'calc' },
  { to: '/app/convert', label: 'Address converter', short: 'Convert', icon: 'convert' },
  { to: '/app/deploy', label: 'Deploy / Record', short: 'Deploy', icon: 'deploy' },
  { to: '/app/verify', label: 'Verify report', short: 'Verify', icon: 'verify' },
];
