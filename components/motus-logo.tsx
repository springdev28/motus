type MotusLogoProps = {
  className?: string;
  variant: 'on-dark' | 'on-light';
};

const LOGO_SOURCE = {
  'on-dark': '/motus-mark-white-v2.svg',
  'on-light': '/motus-mark-purple-outline-v2.svg',
} as const;

export function MotusLogo({ className, variant }: MotusLogoProps) {
  return (
    // oxlint-disable-next-line next/no-img-element
    <img
      alt=""
      aria-hidden="true"
      className={className}
      decoding="async"
      draggable={false}
      height="640"
      src={LOGO_SOURCE[variant]}
      width="640"
    />
  );
}
