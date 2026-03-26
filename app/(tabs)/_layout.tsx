import { Tabs } from 'expo-router';
import { Home, User, Newspaper, CalendarDays, Gamepad2, Trophy } from 'lucide-react-native';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#E10600',
            tabBarInactiveTintColor: '#888888',
            tabBarStyle: {
                backgroundColor: '#0B0B0D',
                borderTopWidth: 0,
            }
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: ({ color }) => <Home color={color} />,
                }}
            />
            <Tabs.Screen
                name="calendrier"
                options={{
                    title: 'Calendrier',
                    tabBarIcon: ({ color }) => <CalendarDays color={color} />,
                }}
            />
            <Tabs.Screen
                name="classement"
                options={{
                    title: 'Classement',
                    tabBarIcon: ({ color }) => <Trophy color={color} />,
                }}
            />
            <Tabs.Screen
                name="game"
                options={{
                    title: 'Jeux',
                    tabBarIcon: ({ color }) => <Gamepad2 color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <User color={color} />,
                }}
            />

        </Tabs>
    );
}
