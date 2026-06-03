import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Link, Stack, useRouter, useFocusEffect } from 'expo-router';
import { MoonStar, Star, Sun, ChevronRight, Info, Trophy, User, MessageCircle } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { Image, type ImageStyle, View, ScrollView, ImageBackground, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchF1News, NewsArticle } from '@/lib/api/news';
import { NewsCard } from '@/components/news/NewsCard';
import { NextSessionWidget } from '@/components/calendar/NextSessionWidget';
import { QuickStats } from '@/components/home/QuickStats';
import { F1Loader } from '@/components/ui/F1Loader';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { PitStopWidget } from '@/components/home/PitStopWidget';
import { fetchUnreadCount } from '@/lib/api/dms';
import { fetchIncomingRequests } from '@/lib/api/friends';

const LOGO = {
  light: require('@/assets/images/react-native-reusables-light.png'),
  dark: require('@/assets/images/react-native-reusables-dark.png'),
};

const IMAGE_STYLE: ImageStyle = {
  height: 76,
  width: 76,
};

export default function Screen() {
  const { user, accessToken } = useAuth();
  const { on } = useSocket();
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [incomingCount, setIncomingCount] = useState(0);

  useEffect(() => {
    async function loadNews() {
      try {
        const data = await fetchF1News();
        if (data.results) {
          setLatestNews(data.results.slice(0, 3));
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching news');
      } finally {
        setLoading(false);
      }
    }
    loadNews();
  }, []);

  const loadBadges = useCallback(() => {
    if (!accessToken) return;
    fetchUnreadCount(accessToken).then(setUnreadCount);
    fetchIncomingRequests(accessToken).then(reqs => setIncomingCount(reqs.length));
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadBadges();
    }, [loadBadges])
  );

  useEffect(() => {
    if (!accessToken) return;
    const interval = setInterval(loadBadges, 30000);
    
    const unsubDm = on('dm:received', () => loadBadges());
    const unsubFriend = on('friend:status_changed', () => loadBadges());
    
    return () => {
      clearInterval(interval);
      unsubDm();
      unsubFriend();
    };
  }, [accessToken, on, loadBadges]);

  const totalBadgeCount = unreadCount + incomingCount;

  return (
    <>
      <ScrollView 
        className="flex-1 bg-background" 
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero Section v7: Immersive Full Bleed ─── */}
        <ImageBackground
          source={require('@/assets/images/hero-bg.png')}
          style={{ height: 350, width: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' }}
          resizeMode="cover"
        >
          {/* Message icon — top right */}
          {user && (
            <TouchableOpacity
              onPress={() => router.push('/messages' as any)}
              style={{ position: 'absolute', top: 52, right: 16, zIndex: 10 }}
              className="w-10 h-10 bg-black/40 border border-white/20 rounded-full items-center justify-center"
            >
              <MessageCircle size={20} color="white" />
              {totalBadgeCount > 0 && (
                <View className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-primary rounded-full items-center justify-center px-1">
                  <Text className="text-white text-[9px] font-black">{totalBadgeCount > 99 ? '99' : totalBadgeCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          {/* Gradient Overlay for blending into the background and text readability */}
          <LinearGradient
            colors={['rgba(11, 11, 13, 0.2)', 'rgba(11, 11, 13, 0.7)', '#0B0B0D']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Logo center piece */}
          <View
            style={{
              shadowColor: '#E10600', shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3, shadowRadius: 25, elevation: 15,
              marginTop: 40,
            }}
          >
            <Image
              source={require('@/assets/images/polewin.png')}
              style={{ width: 140, height: 140 }}
              resizeMode="contain"
            />
          </View>

          {/* Stylized Season Badge */}
          <View className="absolute bottom-6 bg-[#E10600]/20 border border-[#E10600]/50 px-3 py-1 rounded-full">
            <Text style={{ fontFamily: 'Montserrat_700Bold', color: '#E10600', letterSpacing: 2 }}>
              SEASON 2026
            </Text>
          </View>
        </ImageBackground>

        <View className="px-4 mt-10">
          {/* User Points Card */}
          {user && (
            <View className="bg-card border border-white/5 p-4 rounded-3xl mb-6 flex-row items-center justify-between shadow-sm">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mr-4">
                  <User size={24} className="text-primary" />
                </View>
                <View>
                  <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Pilote</Text>
                  <Text className="text-foreground font-bold text-base">{user.username}</Text>
                </View>
              </View>
              <View className="bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20 flex-row items-center">
                <Trophy size={16} color="#ef4444" />
                <Text className="text-primary font-black ml-2 text-lg">
                  {user.points?.toLocaleString() || '0'} <Text className="text-[10px] uppercase opacity-70">pts</Text>
                </Text>
              </View>
            </View>
          )}

          {/* Pit Stop / Garage Widget */}
          <PitStopWidget />

          {/* Prochain Grand Prix (Sessions) */}
          <NextSessionWidget />

          {/* Quick Stats / Actions */}
          <QuickStats />

          <View className="mb-6 flex-row items-center justify-between">
            <Text className="font-heading text-xl font-bold text-foreground">Dernières Actualités</Text>
            <Link href="/news" asChild>
              <Button variant="ghost" className="flex-row gap-1">
                <Text>Voir tout</Text>
                <Icon as={ChevronRight} size={16} />
              </Button>
            </Link>
          </View>

          {loading ? (
            <View className="h-48 items-center justify-center">
              <F1Loader />
            </View>
          ) : error ? (
            <View className="items-center justify-center py-10 px-6 bg-card/30 border border-white/5 rounded-3xl">
              <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center mb-4">
                <Icon as={Info} size={24} color="#ef4444" />
              </View>
              <Text className="text-center text-foreground font-bold mb-1">
                Actualités indisponibles
              </Text>
              <Text className="text-center text-muted-foreground text-xs">
                Le service d'information est temporairement hors ligne.
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {latestNews.map((article) => (
                <NewsCard key={article.article_id || article.link} article={article} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}



