import { Plus } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';
import { Button } from '../ui/button';

interface FABProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
}

export function FAB({ onClick, icon, label }: FABProps) {
  const handleClick = () => {
    onClick();
    hapticFeedback.medium();
  };

  return (
    <Button
      onClick={handleClick}
      className="fixed right-4 bottom-20 z-50 rounded-full shadow-lg transition-all hover:shadow-xl active:scale-95"
      visualSize="lg"
      aria-label={label || 'Add'}
    >
      {icon || <Plus className="h-6 w-6" />}
    </Button>
  );
}
