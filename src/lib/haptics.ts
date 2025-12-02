export function vibrate(pattern: number | number[]): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export const hapticFeedback = {
  light: () => vibrate(10),
  medium: () => vibrate(20),
  heavy: () => vibrate(30),
  success: () => vibrate([10, 50, 10]),
  warning: () => vibrate([20, 100, 20]),
  error: () => vibrate([30, 100, 30, 100, 30]),
  selection: () => vibrate(5),
};
