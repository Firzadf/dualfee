import Spinner from './ui/Spinner';
import { useNet } from '../lib/network';

/**
 * The one "measure" button. While either surface is still handshaking it says so (with a spinner)
 * instead of sitting disabled and unlabeled; once both have answered (even with an error) it is enabled,
 * because the SDK reports a failed surface as "unavailable" rather than throwing.
 */
export default function MeasureButton({ busy, onClick, idle = 'Measure now', busyLabel = 'Measuring both surfaces…', className = 'btn-primary', disabled = false }: {
  busy: boolean;
  onClick: () => void;
  idle?: string;
  busyLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const net = useNet();
  const waiting = !net.ready;
  const which = net.evm === null && net.native === null ? 'EVM + Native' : net.evm === null ? 'EVM' : 'Native';
  return (
    <button className={className} onClick={onClick} disabled={busy || waiting || disabled} aria-busy={busy || waiting}>
      {waiting ? (
        <><Spinner /> Connecting to {which}…</>
      ) : busy ? (
        <><Spinner /> {busyLabel}</>
      ) : (
        idle
      )}
    </button>
  );
}
