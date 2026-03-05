import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Link, Stack } from 'expo-router';
import { MoonStar, Star, Sun, ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Image, type ImageStyle, View, ScrollView, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchF1News, NewsArticle } from '@/lib/api/news';
import { NewsCard } from '@/components/news/NewsCard';
import { NextSessionWidget } from '@/components/calendar/NextSessionWidget';
import { QuickStats } from '@/components/home/QuickStats';
import { F1Loader } from '@/components/ui/F1Loader';

const LOGO = {
  light: require('@/assets/images/react-native-reusables-light.png'),
  dark: require('@/assets/images/react-native-reusables-dark.png'),
};

const IMAGE_STYLE: ImageStyle = {
  height: 76,
  width: 76,
};

export default function Screen() {
  const { colorScheme } = useColorScheme();
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <>
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ─── Hero Section v6: Minimalist Clean ─── */}
        <View style={{ height: 210, backgroundColor: '#050505', position: 'relative', overflow: 'hidden' }}>
          <LinearGradient
            colors={['#0a0a0a', '#1a050a', '#0a0a0a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            {/* Very subtle glow behind logo */}
            <View
              style={{
                position: 'absolute', width: 140, height: 140,
                borderRadius: 70, backgroundColor: '#ef4444',
                opacity: 0.05, transform: [{ scale: 1.5 }]
              }}
            />

            {/* Logo alone (since it already contains the brand name) */}
            <View
              style={{
                shadowColor: '#000', shadowOffset: { width: 0, height: 15 },
                shadowOpacity: 0.4, shadowRadius: 20, elevation: 20
              }}
            >
              <Image
                source={require('@/assets/images/polewin.png')}
                style={{ width: 100, height: 100 }}
                resizeMode="contain"
              />
            </View>

            {/* Discrete season info at the bottom-right of the hero */}
            <View className="absolute bottom-4 right-6 bg-white/5 border border-white/10 px-2 py-0.5 rounded-sm">
              <Text className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Season 2026</Text>
            </View>
          </LinearGradient>
        </View>

        <View className="px-4 mt-6">
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
            <View className="items-center rounded-lg bg-destructive/10 p-4">
              <Text className="text-center text-destructive">{error}</Text>
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



