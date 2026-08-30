type MotusLogoProps = {
  className?: string;
};

export function MotusLogo({ className }: MotusLogoProps) {
  return (
    // Keep the cleaned transparent mark unmasked so its antialiased edges survive.
    // oxlint-disable-next-line next/no-img-element
    <img
      alt=""
      aria-hidden="true"
      className={className}
      draggable={false}
      height="256"
      src="/motus-logo-256.png"
      width="256"
    />
  );
}
