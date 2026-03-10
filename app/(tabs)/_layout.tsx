import { Tabs } from 'expo-router';
import { Home, User, Newspaper, CalendarDays, Gamepad2 } from 'lucide-react-native';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            headerTitleAlign: 'left',
            headerStyle: {
                backgroundColor: '#0B0B0D',
                height: 120,
            },
            headerTitleStyle: {
                fontFamily: 'Montserrat_Bold_Italic',
                fontSize: 28,
                color: '#ffffffff',
            },
            headerTitleContainerStyle: {
                paddingHorizontal: 16,
                marginTop: 20,
                paddingBottom: 10,
            },
            headerShadowVisible: false,
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
