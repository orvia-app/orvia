type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className = "" }: BrandMarkProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.5 20.5C7.5 13.5964 13.0964 8 20 8H24.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M24.5 11.5V8H21"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M7.5 20.5C10.8333 17.1667 14.1667 17.1667 17.5 20.5C20.8333 23.8333 24.1667 23.8333 27.5 20.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle
        cx="7.5"
        cy="20.5"
        r="2.75"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle
        cx="24.5"
        cy="8"
        r="2.75"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}
