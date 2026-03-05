import { Tabs } from 'expo-router';
import { Home, User, Newspaper, CalendarDays, Gamepad2 } from 'lucide-react-native';

export default function TabLayout() {
    return (
        <Tabs>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
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
