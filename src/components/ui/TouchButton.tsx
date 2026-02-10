import { ButtonHTMLAttributes, forwardRef } from 'react';

interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

/**
 * Touch-optimized button component
 * Ensures minimum 44x44px touch target
 */
export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  function TouchButton({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    ...props
  }, ref) {
    const baseClasses = [
      'inline-flex items-center justify-center',
      'font-medium transition-all duration-150',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'active:scale-95 touch-manipulation',
    ].join(' ');

    const sizeClasses = {
      sm: 'min-w-[44px] min-h-[36px] px-3 py-2 text-xs rounded',
      md: 'min-w-[44px] min-h-[44px] px-4 py-2.5 text-sm rounded-md',
      lg: 'min-w-[48px] min-h-[48px] px-6 py-3 text-base rounded-lg',
    };

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
      ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
