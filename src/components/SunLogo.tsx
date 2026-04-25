interface Props {
  className?: string;
  size?: number;
}

export const SunLogo = ({ className = "", size = 36 }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    className={className}
    aria-hidden="true"
  >
    <circle cx="32" cy="32" r="11" fill="hsl(45 100% 51%)" />
    <circle cx="32" cy="32" r="6" fill="hsl(45 100% 70%)" />
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 30 * Math.PI) / 180;
      const x1 = 32 + Math.cos(angle) * 16;
      const y1 = 32 + Math.sin(angle) * 16;
      const x2 = 32 + Math.cos(angle) * 26;
      const y2 = 32 + Math.sin(angle) * 26;
      return (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="hsl(45 100% 51%)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      );
    })}
  </svg>
);
