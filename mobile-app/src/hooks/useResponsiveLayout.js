import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { responsiveLayout } from '../utils/responsiveLayout';

export default function useResponsiveLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return { ...responsiveLayout(width - insets.left - insets.right, fontScale), height, fontScale };
}
