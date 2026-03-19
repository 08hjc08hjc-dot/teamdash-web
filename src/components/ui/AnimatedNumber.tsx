import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';

export function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const animated = useAnimatedNumber(value);
  return <>{animated}{suffix}</>;
}
