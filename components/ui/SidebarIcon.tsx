import Image from "next/image";
import clsx from "clsx";

interface SidebarIconProps {
  src: string;
  activeSrc?: string;
  isActive?: boolean;
  size?: number; 
  alt: string;
  className?: string;
}

export function SidebarIcon({
  src,
  activeSrc,
  isActive = false,
  size = 20,
  alt,
  className,
}: SidebarIconProps) {
  return (
    <Image
      src={isActive && activeSrc ? activeSrc : src}
      alt={alt}
      width={size}
      height={size}
      className={clsx("shrink-0", className)}
    />
  );
}
