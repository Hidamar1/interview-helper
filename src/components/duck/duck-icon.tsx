import { useId } from "react";

export function DuckIcon({ size = 32 }: { size?: number }) {
  const gradientId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id={gradientId} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#FFD166" />
          <stop offset="100%" stopColor="#FFB01F" />
        </radialGradient>
      </defs>
      {/* 不对称圆形身体，呼应原型 border-radius: 50% 50% 46% 54% */}
      <path
        d="M32 3 C49 3 61 15 61 32 C61 48 49 61 32 61 C15 61 3 49 3 33 C3 16 15 3 32 3 Z"
        fill={`url(#${gradientId})`}
      />
      <circle cx="25" cy="25" r="5" fill="#333333" />
      <rect x="9" y="33" width="26" height="14" rx="7" fill="#FF7D00" />
    </svg>
  );
}
