import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from '@/components/ui/text';
import { Stack } from 'expo-router';
import { fetchF1News, NewsArticle } from '@/lib/api/news';
import { NewsCard } from '@/components/news/NewsCard';
import { useEffect, useState, useCallback } from 'react';

export default function AllNewsScreen() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadInitialNews = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchF1News();
            if (data.results) {
                setNews(data.results);
                setNextPage(data.nextPage);
            }
    } catch (err: any) {
        console.warn(`[NewsAPI] Fetching failed: ${err.message}`);
        return { status: 'error', totalResults: 0, results: [], nextPage: null };
    } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialNews();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadInitialNews();
        setRefreshing(false);
    }, []);

    const loadMoreNews = useCallback(async () => {
        if (loadingMore || !nextPage) return;

        try {
            setLoadingMore(true);
            const data = await fetchF1News(nextPage);
            if (data.results) {
                setNews((prev) => [...prev, ...data.results]);
                setNextPage(data.nextPage);
            }
        } catch (err) {
            console.error('Error loading more news:', err);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, nextPage]);

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View className="py-4 items-center">
                <ActivityIndicator size="small" className="text-primary" />
            </View>
        );
    };

    if (loading && news.length === 0) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <Stack.Screen options={{ title: 'Actualités F1', headerBackTitle: 'Retour' }} />
                <ActivityIndicator size="large" className="text-primary" />
            </View>
        );
    }

    if (error && news.length === 0) {
        return (
            <View className="flex-1 items-center justify-center bg-background p-4">
                <Stack.Screen options={{ title: 'Actualités F1', headerBackTitle: 'Retour' }} />
                <Text className="text-center text-destructive mb-4">{error}</Text>
                <Text onPress={loadInitialNews} className="text-primary underline">
                    Réessayer
                </Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: 'Toutes les actualités F1', headerBackTitle: 'Retour' }} />
            <FlatList
                className="flex-1 bg-background"
                data={news}
                keyExtractor={(item, index) => `${item.article_id || item.link}-${index}`}
                renderItem={({ item }) => <NewsCard article={item} />}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                onEndReached={loadMoreNews}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E10600" />}
            />
        </>
    );
}
