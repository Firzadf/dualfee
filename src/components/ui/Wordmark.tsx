export default function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-tight ${className}`}>
      <span className="text-evm">Dual</span><span className="text-native">Fee</span>
    </span>
  );
}
