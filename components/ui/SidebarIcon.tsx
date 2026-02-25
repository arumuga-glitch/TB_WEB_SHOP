import Image from "next/image";
import clsx from "clsx";

export interface SidebarIconProps {
  src: string;
  activeSrc?: string;
  isActive?: boolean;
  size?: number;
  width?: number;
  height?: number;
  alt: string;
  className?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
}

export function SidebarIcon({
  src,
  activeSrc,
  isActive = false,
  size = 20,
  width,
  height,
  alt,
  className,
  priority,
  loading,
}: SidebarIconProps) {
  const w = width || size;
  const h = height || size;

  return (
    <Image
      src={isActive && activeSrc ? activeSrc : src}
      alt={alt}
      width={w}
      height={h}
      className={clsx("shrink-0", className)}
      priority={priority}
      loading={loading}
      style={{ width: `${w}px`, height: `${h}px` }}
    />
  );
}
