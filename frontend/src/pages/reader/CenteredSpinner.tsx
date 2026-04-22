import { LoaderCircle } from 'lucide-react';

export default function CenteredSpinner({ padded }: { padded?: boolean } = {}) {
  return (
    <div className={`flex items-center justify-center text-[var(--muted)] ${padded ? 'py-32' : 'min-h-svh'}`}>
      <LoaderCircle size={22} className="animate-spin" />
    </div>
  );
}
