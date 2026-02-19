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
}: SidebarIconProps) {
  return (
    <Image
      src={isActive && activeSrc ? activeSrc : src}
      alt={alt}
      width={width || size}
      height={height || size}
      className={clsx("shrink-0", className)}
    />
  );
}
