export type NavItem = { to: string; label: string; short: string; icon: string };

export const APP_NAV: NavItem[] = [
  { to: '/app/lab', label: 'Fee Lab', short: 'Lab', icon: 'lab' },
  { to: '/app/leaderboard', label: 'Leaderboard', short: 'Board', icon: 'board' },
  { to: '/app/deploy', label: 'Deploy / Record', short: 'Deploy', icon: 'deploy' },
];
