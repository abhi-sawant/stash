import {
  Folder,
  Star,
  Heart,
  Bookmark,
  BookOpen,
  Film,
  Music,
  ShoppingBag,
  Coffee,
  Utensils,
  Plane,
  Car,
  Home,
  Briefcase,
  Code,
  Laptop,
  Smartphone,
  Camera,
  Gamepad2,
  Dumbbell,
  Bike,
  Palette,
  Scissors,
  GraduationCap,
  Sparkles,
  Lightbulb,
  Rocket,
  Trophy,
  Gift,
  MapPin,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const COLLECTION_ICONS = {
  folder: { icon: Folder, label: 'Folder' },
  star: { icon: Star, label: 'Star' },
  heart: { icon: Heart, label: 'Heart' },
  bookmark: { icon: Bookmark, label: 'Bookmark' },
  book: { icon: BookOpen, label: 'Book' },
  film: { icon: Film, label: 'Film' },
  music: { icon: Music, label: 'Music' },
  shopping: { icon: ShoppingBag, label: 'Shopping' },
  coffee: { icon: Coffee, label: 'Coffee' },
  food: { icon: Utensils, label: 'Food' },
  travel: { icon: Plane, label: 'Travel' },
  car: { icon: Car, label: 'Car' },
  home: { icon: Home, label: 'Home' },
  work: { icon: Briefcase, label: 'Work' },
  code: { icon: Code, label: 'Code' },
  laptop: { icon: Laptop, label: 'Laptop' },
  phone: { icon: Smartphone, label: 'Phone' },
  camera: { icon: Camera, label: 'Camera' },
  game: { icon: Gamepad2, label: 'Game' },
  fitness: { icon: Dumbbell, label: 'Fitness' },
  bike: { icon: Bike, label: 'Bike' },
  art: { icon: Palette, label: 'Art' },
  fashion: { icon: Scissors, label: 'Fashion' },
  education: { icon: GraduationCap, label: 'Education' },
  sparkles: { icon: Sparkles, label: 'Sparkles' },
  idea: { icon: Lightbulb, label: 'Idea' },
  rocket: { icon: Rocket, label: 'Rocket' },
  trophy: { icon: Trophy, label: 'Trophy' },
  gift: { icon: Gift, label: 'Gift' },
  location: { icon: MapPin, label: 'Location' },
} as const;

export type CollectionIconName = keyof typeof COLLECTION_ICONS;

interface IconPickerProps {
  selectedIcon: CollectionIconName;
  onSelectIcon: (icon: CollectionIconName) => void;
}

export function IconPicker({ selectedIcon, onSelectIcon }: IconPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {(Object.keys(COLLECTION_ICONS) as CollectionIconName[]).map(iconKey => {
        const { icon: Icon, label } = COLLECTION_ICONS[iconKey];
        const isSelected = selectedIcon === iconKey;

        return (
          <button
            key={iconKey}
            type="button"
            onClick={() => onSelectIcon(iconKey)}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-all',
              'hover:bg-gray-50 dark:hover:bg-gray-800',
              'active:scale-95',
              isSelected
                ? 'border-primary bg-primary/10 dark:bg-primary/20'
                : 'border-gray-200 dark:border-gray-700'
            )}
            title={label}
          >
            <Icon
              className={cn(
                'h-6 w-6',
                isSelected ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export function getCollectionIcon(iconName?: string): LucideIcon {
  if (!iconName || !(iconName in COLLECTION_ICONS)) {
    return COLLECTION_ICONS.folder.icon;
  }
  return COLLECTION_ICONS[iconName as CollectionIconName].icon;
}
