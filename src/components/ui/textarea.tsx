import * as React from 'react';

import { cn } from '@/lib/utils';

interface TextareaProps extends React.ComponentProps<'textarea'> {
  visualSize?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'min-h-20 text-xs px-2 rounded-sm',
  md: 'min-h-24 text-sm px-3 rounded-md',
  lg: 'min-h-28 text-base px-4 rounded-lg',
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, visualSize = 'md', ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'border-input bg-bg-input placeholder:text-muted-foreground focus-visible:ring-primary flex w-full border py-2 shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          sizeClasses[visualSize],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
