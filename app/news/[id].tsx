import { View, Image, ScrollView, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ExternalLink } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';

export default function ArticleScreen() {
    const { title, description, content, image_url, source_id, pubDate, link } = useLocalSearchParams<{
        title: string;
        description: string;
        content: string;
        image_url: string;
        source_id: string;
        pubDate: string;
        link: string;
    }>();

    const handleOpenOriginal = async () => {
        if (link) {
            try {
                await WebBrowser.openBrowserAsync(link);
            } catch (error) {
                console.error("Failed to open article:", error);
                Alert.alert("Erreur", "Impossible d'ouvrir l'article original.");
            }
        }
    };

    // Use full content if available, otherwise fallback to description
    const textToDisplay = content && content.length > description?.length ? content : description;

    return (
        <View className="flex-1 bg-background">
            <Stack.Screen options={{ title: 'Article', headerBackTitle: 'Retour' }} />
            <ScrollView showsVerticalScrollIndicator={false}>
                {image_url ? (
                    <Image
                        source={{ uri: image_url }}
                        style={{ width: '100%', height: 250 }}
                        resizeMode="cover"
                    />
                ) : (
                    <View className="h-[250px] w-full items-center justify-center bg-muted">
                        <Text className="text-muted-foreground">Aucune image</Text>
                    </View>
                )}

                <View className="p-6">
                    <Text className="font-heading text-2xl font-bold text-foreground mb-4 leading-tight">
                        {title}
                    </Text>

                    <View className="border-b border-border pb-4 mb-6 gap-1">
                        <Text className="font-medium text-primary uppercase text-sm tracking-wider">
                            {source_id}
                        </Text>
                        <Text className="text-muted-foreground text-sm">
                            {pubDate ? new Date(pubDate).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            }) : ''}
                        </Text>
                    </View>

                    <Text className="text-foreground text-lg leading-loose mb-8">
                        {textToDisplay || 'Aucun contenu supplémentaire disponible pour le moment.'}
                    </Text>

                    {link && (
                        <Button onPress={handleOpenOriginal} className="w-full flex-row gap-2 mt-4">
                            <Text>Lire l'article complet sur le site original</Text>
                            <ExternalLink size={18} className="text-primary-foreground" />
                        </Button>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
