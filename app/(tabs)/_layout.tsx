import { Tabs } from 'expo-router';
import { Home, User, Newspaper, Trophy, Medal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlatformPressable } from '@react-navigation/elements';
import { TourGuideZone } from 'rn-tourguide';
import { tourStep } from '@/lib/onboarding';

// Total d'étapes du tour d'accueil (logo + messagerie + 4 widgets + 5 onglets).
const TOUR_TOTAL = 11;

// Bouton d'onglet enveloppé d'une TourGuideZone → le tutoriel peut focaliser
// chaque onglet de la barre de navigation (toujours visible en bas, donc pas
// de scroll). Composants définis au niveau module = identité stable.
function makeTabButton(zone: number, title: string, body: string) {
    return function TourTabButton(props: any) {
        return (
            <TourGuideZone
                zone={zone}
                tourKey="home"
                shape="rectangle"
                style={{ flex: 1 }}
                // Onglets en bas → rn-tourguide place la bulle « au-dessus » mais
                // suppose une hauteur de ~135px ; la nôtre est plus grande (avatar).
                // Cet offset la remonte pour qu'elle soit AU-DESSUS de la nav bar,
                // pas par-dessus.
                tooltipBottomOffset={140}
                text={tourStep(zone, TOUR_TOTAL, title, body)}
            >
                <PlatformPressable {...props} />
            </TourGuideZone>
        );
    };
}

const AccueilTabButton = makeTabButton(7, 'Accueil 🏠', "L'accueil : ton tableau de bord — actus, prochain GP et raccourcis.");
const ChampionnatTabButton = makeTabButton(8, 'Championnat 🏆', 'Le championnat : calendrier des GP et classements pilotes & écuries.');
const ClassementTabButton = makeTabButton(9, 'Classement 🥇', 'Le classement : ta position face aux autres joueurs.');
const PronosTabButton = makeTabButton(10, 'Pronos 🎯', 'Les pronos : parie sur le Top 3 avant chaque course.');
const ProfilTabButton = makeTabButton(11, 'Profil 👤', 'Ton profil : badges, statistiques et réglages.');

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
                    tabBarButton: AccueilTabButton,
                }}
            />
            <Tabs.Screen
                name="championnat"
                options={{
                    title: 'Championnat',
                    tabBarIcon: ({ color }) => <Trophy color={color} size={24} />,
                    tabBarButton: ChampionnatTabButton,
                }}
            />
            <Tabs.Screen
                name="classement"
                options={{
                    title: 'Classement',
                    tabBarIcon: ({ color }) => <Medal color={color} size={24} />,
                    tabBarButton: ClassementTabButton,
                }}
            />
            <Tabs.Screen
                name="pronostics"
                options={{
                    title: 'Pronos',
                    tabBarIcon: ({ color }) => <Newspaper color={color} size={24} />,
                    tabBarButton: PronosTabButton,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color }) => <User color={color} size={24} />,
                    tabBarButton: ProfilTabButton,
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
