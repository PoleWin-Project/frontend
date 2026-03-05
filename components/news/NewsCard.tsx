import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { View, Image, Linking, TouchableOpacity } from 'react-native';
import { NewsArticle } from '@/lib/api/news';

import { useRouter } from 'expo-router';

interface NewsCardProps {
    article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
    const router = useRouter();

    const handlePress = () => {
        // Encode article properties to pass them safely through the URL
        router.push({
            pathname: '/news/[id]',
            params: {
                id: article.article_id || encodeURIComponent(article.link),
                title: article.title,
                description: article.description,
                content: article.content || '',
                image_url: article.image_url || '',
                pubDate: article.pubDate,
                source_id: article.source_id,
                link: article.link,
            },
        });
    };

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
            <Card className="mb-4 overflow-hidden rounded-xl border border-border bg-card">
                {article.image_url ? (
                    <Image
                        source={{ uri: article.image_url }}
                        style={{ width: '100%', height: 160 }}
                        resizeMode="cover"
                    />
                ) : (
                    <View className="h-40 w-full items-center justify-center bg-muted">
                        <Text className="text-muted-foreground">Aucune image</Text>
                    </View>
                )}
                <View className="p-4">
                    <Text className="mb-2 font-heading text-lg font-bold text-foreground" numberOfLines={2}>
                        {article.title}
                    </Text>
                    <Text className="mb-3 text-sm text-muted-foreground" numberOfLines={3}>
                        {article.description || 'Résumé non disponible.'}
                    </Text>
                    <View className="mt-1 gap-1">
                        <Text className="text-xs text-muted-foreground font-medium">
                            {article.source_id.toUpperCase()}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                            {new Date(article.pubDate).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                            })}
                        </Text>
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );
}
