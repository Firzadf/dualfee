import { useEffect, useState } from 'react';
import { HISTORY_EVENT, loadHistory, type HistoryEntry } from './history';

export function useHistory(): HistoryEntry[] {
  const [h, setH] = useState<HistoryEntry[]>(() => loadHistory());
  useEffect(() => {
    const on = () => setH(loadHistory());
    window.addEventListener(HISTORY_EVENT, on);
    window.addEventListener('storage', on);
    return () => { window.removeEventListener(HISTORY_EVENT, on); window.removeEventListener('storage', on); };
  }, []);
  return h;
}
