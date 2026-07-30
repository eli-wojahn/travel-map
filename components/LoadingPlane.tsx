'use client';

interface LoadingPlaneProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  hideLabel?: boolean;
  className?: string;
  videoClassName?: string;
  labelClassName?: string;
  ariaLabel?: string;
}

const sizeClasses: Record<NonNullable<LoadingPlaneProps['size']>, string> = {
  sm: 'w-5 max-w-full',
  md: 'w-12 sm:w-14 max-w-full',
  lg: 'w-32 sm:w-40 md:w-52 lg:w-60 max-w-[72%]',
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Loading visual padrao usando video em loop.
 */
export default function LoadingPlane({
  label,
  size = 'md',
  hideLabel = false,
  className,
  videoClassName,
  labelClassName,
  ariaLabel,
}: LoadingPlaneProps) {
  const resolvedAriaLabel = ariaLabel || label || 'Loading';

  return (
    <div className={joinClasses('flex flex-col items-center justify-center gap-3', className)}>
      <video
        src="/loading-plane.mp4"
        className={joinClasses(sizeClasses[size], 'h-auto rounded-md object-contain', videoClassName)}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-label={resolvedAriaLabel}
      />
      {hideLabel ? <span className="sr-only">{resolvedAriaLabel}</span> : null}
      {!hideLabel && label ? (
        <p className={joinClasses('text-muted-foreground text-center', labelClassName)}>{label}</p>
      ) : null}
    </div>
  );
}