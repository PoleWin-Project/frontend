import { Tabs } from 'expo-router';
import { Home, User, Newspaper, Trophy, Medal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#E10600',
            tabBarInactiveTintColor: '#888888',
            tabBarStyle: {
                backgroundColor: '#0B0B0D',
                borderTopWidth: 0,
                height: 60 + insets.bottom,
                paddingBottom: insets.bottom,
                paddingTop: 10,
            },
            tabBarAllowFontScaling: false,
            tabBarLabelStyle: {
                fontSize: 10,
                marginTop: 2,
            }
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Accueil',
                    tabBarIcon: ({ color }) => <Home color={color} size={24} />,
                }}
            />
            <Tabs.Screen
                name="championnat"
                options={{
                    title: 'Championnat',
                    tabBarIcon: ({ color }) => <Trophy color={color} size={24} />,
                }}
            />
            <Tabs.Screen
                name="classement"
                options={{
                    title: 'Classement',
                    tabBarIcon: ({ color }) => <Medal color={color} size={24} />,
                }}
            />
            <Tabs.Screen
                name="pronostics"
                options={{
                    title: 'Pronos',
                    tabBarIcon: ({ color }) => <Newspaper color={color} size={24} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color }) => <User color={color} size={24} />,
                }}
            />
            <Tabs.Screen
                name="calendrier"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="game"
                options={{ href: null }}
            />
        </Tabs>
    );
}
