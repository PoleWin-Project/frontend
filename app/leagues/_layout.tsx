import { Stack } from 'expo-router';

/** Un seul en-tête, dessiné par chaque écran : aucun nom de route technique. */
export default function LeaguesLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: '#050507' } }} />;
}
