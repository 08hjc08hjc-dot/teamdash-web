import { getInitials } from '../../utils/formatters';

interface AvatarProps {
  name: string;
  color: string;
  avatarUrl?: string;
  size?: number;
}

export function Avatar({ name, color, avatarUrl, size = 40 }: AvatarProps) {
  const fontSize = Math.round(size * 0.4);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="rounded-full object-cover shrink-0 ring-2 ring-white/10"
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0 ring-2 ring-white/10"
      style={{ width: size, height: size, backgroundColor: color, fontSize }}
    >
      {getInitials(name)}
    </div>
  );
}
