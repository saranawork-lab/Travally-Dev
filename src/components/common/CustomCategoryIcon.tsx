import React from "react";

interface CustomCategoryIconProps {
  src: string;
  alt: string;
  className?: string;
}

export const CustomCategoryIcon: React.FC<CustomCategoryIconProps> = ({ src, alt, className = "" }) => {
  return (
    <img 
      src={src} 
      alt={alt} 
      className={`object-contain select-none transition-transform duration-200 ${className}`} 
      loading="lazy"
    />
  );
};
