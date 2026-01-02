export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 100 100"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#10b981", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#059669", stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#logoGrad)" />
        <text
          x="50"
          y="65"
          fontFamily="Arial, sans-serif"
          fontSize="40"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
        >
          5
        </text>
      </svg>
      <span className="text-2xl font-light text-slate-800 dark:text-slate-100">
        Lottery Generator
      </span>
    </div>
  );
}

