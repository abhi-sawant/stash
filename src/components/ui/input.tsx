import * as React from 'react';

import { cn } from '@/lib/utils';

interface InputProps extends React.ComponentProps<'input'> {
  visualSize?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 text-xs px-2 rounded-sm',
  md: 'h-10 text-sm px-3 rounded-md',
  lg: 'h-12 text-base px-4 rounded-lg',
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, visualSize = 'md', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'border-input bg-bg-input file:bg-bg-input file:text-foreground placeholder:text-muted-foreground focus-visible:ring-primary flex w-full rounded-md border shadow-sm transition-colors file:border-0 file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          sizeClasses[visualSize],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
