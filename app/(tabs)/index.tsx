import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Link, Stack } from 'expo-router';
import { MoonStar, Star, Sun, ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Image, type ImageStyle, View, ScrollView, ActivityIndicator } from 'react-native';
import { fetchF1News, NewsArticle } from '@/lib/api/news';
import { NewsCard } from '@/components/news/NewsCard';

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

      <ScrollView className="flex-1 p-4 mb-4">
        <View className="mb-8 mt-4 items-center gap-4">
          <Image source={LOGO[colorScheme ?? 'light']} style={IMAGE_STYLE} resizeMode="contain" />
          <Text className="font-heading text-2xl font-bold text-foreground">PoleWin F1</Text>
        </View>

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
          <View className="h-40 items-center justify-center">
            <ActivityIndicator size="large" className="text-primary" />
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
      </ScrollView>
    </>
  );
}



