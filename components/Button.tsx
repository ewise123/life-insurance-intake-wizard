import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  children, 
  ...props 
}) => {
  const baseStyles = "transition-all duration-200 font-semibold px-8 py-3 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand-primary text-white shadow-md hover:bg-opacity-90 active:transform active:scale-95",
    secondary: "border-2 border-brand-primary text-brand-primary bg-transparent hover:bg-brand-secondary/10",
    ghost: "text-brand-textSecondary hover:text-brand-primary hover:underline bg-transparent px-4"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
