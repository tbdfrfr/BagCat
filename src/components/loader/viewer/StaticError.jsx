import { GlobeX } from 'lucide-react';

export default function StaticError() {
  return (
    <div className="flex flex-col items-center gap-2">
      <GlobeX size={32} />
      <p className="text-xl">Uh oh, the request failed!</p>
      <div className="text-center mt-1">
        <p>No working Wisp server was found to route your request.</p>
        <p className="text-xs">
          Try again later, or configure a custom Wisp endpoint (e.g. <span className="font-mono">wss://your-domain/wisp/</span>).
        </p>
      </div>
    </div>
  );
}
