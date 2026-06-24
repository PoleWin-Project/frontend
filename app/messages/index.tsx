import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ChevronLeft, MessageCircle, Users, Search } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { fetchConversations, Conversation } from '@/lib/api/dms';
import { fetchIncomingRequests, FriendRequest, respondToRequest } from '@/lib/api/friends';
import { TourGuideZone } from 'rn-tourguide';
import { useScreenTour } from '@/hooks/usePoleWinTour';
import { tourStep } from '@/lib/onboarding';

export default function MessagesScreen() {
    const router = useRouter();
    const { accessToken, user } = useAuth();
    const { on } = useSocket();
    useScreenTour('messages');

    const [conversations, setConversations]   = useState<Conversation[]>([]);
    const [incoming, setIncoming]             = useState<FriendRequest[]>([]);
    const [loading, setLoading]               = useState(true);
    const [refreshing, setRefreshing]         = useState(false);
    const [tab, setTab]                       = useState<'messages' | 'requests'>('messages');

    const load = useCallback(async () => {
        if (!accessToken) return;
        const [convs, reqs] = await Promise.all([
            fetchConversations(accessToken),
            fetchIncomingRequests(accessToken),
        ]);
        setConversations(convs);
        setIncoming(reqs);
        setLoading(false);
        setRefreshing(false);
    }, [accessToken]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    useEffect(() => {
        const unsubDm = on('dm:received', () => load());
        const unsubFriend = on('friend:status_changed', () => load());
        return () => { unsubDm(); unsubFriend(); };
    }, [on, load]);

    const handleRespond = async (req: FriendRequest, action: 'accept' | 'decline') => {
        if (!accessToken) return;
        await respondToRequest(req.id, action, accessToken);
        setIncoming(prev => prev.filter(r => r.id !== req.id));
    };

    const getAvatar = (username: string) => username[0].toUpperCase();

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) {
            return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    };

    const renderConversation = ({ item }: { item: Conversation }) => {
        const name = item.partner?.profile?.displayName || item.partner?.username || `User #${item.partnerId}`;
        const isUnread = !item.lastMessage.isRead && item.lastMessage.senderId !== user?.id;
        return (
            <TouchableOpacity
                onPress={() => router.push(`/messages/${item.partnerId}` as any)}
                className="flex-row items-center px-4 py-3 border-b border-white/5"
                activeOpacity={0.7}
            >
                <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mr-3">
                    <Text className="text-primary font-black text-lg">{getAvatar(item.partner?.username ?? '?')}</Text>
                </View>
                <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-0.5">
                        <Text className={`font-bold text-sm ${isUnread ? 'text-white' : 'text-white/70'}`}>{name}</Text>
                        <Text className="text-white/30 text-[10px]">{formatTime(item.lastMessage.createdAt)}</Text>
                    </View>
                    <Text
                        numberOfLines={1}
                        className={`text-xs ${isUnread ? 'text-white font-semibold' : 'text-white/40'}`}
                    >
                        {item.lastMessage.senderId === user?.id ? 'Vous : ' : ''}{item.lastMessage.content}
                    </Text>
                </View>
                {isUnread && (
                    <View className="w-2 h-2 rounded-full bg-primary ml-2" />
                )}
            </TouchableOpacity>
        );
    };

    const renderRequest = ({ item }: { item: FriendRequest }) => {
        const sender = item.sender;
        const name = sender?.profile?.displayName || sender?.username || `User #${item.senderId}`;
        return (
            <View className="flex-row items-center px-4 py-3 border-b border-white/5">
                <TouchableOpacity
                    onPress={() => router.push(`/user/${item.senderId}` as any)}
                    className="w-12 h-12 rounded-full bg-white/10 items-center justify-center mr-3"
                >
                    <Text className="text-white font-black text-lg">{getAvatar(sender?.username ?? '?')}</Text>
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-white font-bold text-sm">{name}</Text>
                    <Text className="text-white/40 text-xs">vous a envoyé une demande</Text>
                </View>
                <View className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={() => handleRespond(item, 'accept')}
                        className="bg-primary px-3 py-1.5 rounded-full"
                    >
                        <Text className="text-white text-xs font-bold">Accepter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleRespond(item, 'decline')}
                        className="bg-white/10 px-3 py-1.5 rounded-full"
                    >
                        <Text className="text-white/60 text-xs font-bold">Refuser</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="px-4 pt-14 pb-4 flex-row items-center gap-3 border-b border-white/5">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-white/5 rounded-full">
                    <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
                <Text className="text-white font-black text-xl italic uppercase tracking-widest flex-1">Messages</Text>
                {incoming.length > 0 && (
                    <View className="bg-primary/20 border border-primary/40 px-2 py-0.5 rounded-full">
                        <Text className="text-primary text-xs font-bold">{incoming.length}</Text>
                    </View>
                )}
                <TouchableOpacity
                    onPress={() => router.push('/search' as any)}
                    className="p-2 bg-white/5 rounded-full border border-white/10"
                >
                    <Search size={18} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <TourGuideZone
                zone={1}
                tourKey="messages"
                shape="rectangle"
                text={tourStep(1, 1, 'Tes conversations 💬', 'Discute directement avec tes amis après chaque course.')}
            >
            <View className="flex-row border-b border-white/5">
                {(['messages', 'requests'] as const).map(t => (
                    <TouchableOpacity
                        key={t}
                        onPress={() => setTab(t)}
                        className={`flex-1 py-3 items-center flex-row justify-center gap-2 ${tab === t ? 'border-b-2 border-primary' : ''}`}
                    >
                        {t === 'messages' ? <MessageCircle size={16} color={tab === t ? '#E10600' : 'rgba(255,255,255,0.4)'} /> : <Users size={16} color={tab === t ? '#E10600' : 'rgba(255,255,255,0.4)'} />}
                        <Text className={`text-xs font-bold uppercase ${tab === t ? 'text-primary' : 'text-white/40'}`}>
                            {t === 'messages' ? 'Conversations' : `Demandes${incoming.length ? ` (${incoming.length})` : ''}`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            </TourGuideZone>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#E10600" />
                </View>
            ) : tab === 'messages' ? (
                conversations.length === 0 ? (
                    <View className="flex-1 items-center justify-center px-8">
                        <MessageCircle size={48} color="rgba(255,255,255,0.1)" />
                        <Text className="text-white/30 text-center mt-4">Aucune conversation pour l'instant</Text>
                        <Text className="text-white/20 text-center text-xs mt-2">Ajoutez des amis pour commencer à discuter</Text>
                    </View>
                ) : (
                    <FlatList
                        data={conversations}
                        keyExtractor={i => String(i.partnerId)}
                        renderItem={renderConversation}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#E10600" />}
                    />
                )
            ) : (
                incoming.length === 0 ? (
                    <View className="flex-1 items-center justify-center px-8">
                        <Users size={48} color="rgba(255,255,255,0.1)" />
                        <Text className="text-white/30 text-center mt-4">Aucune demande en attente</Text>
                    </View>
                ) : (
                    <FlatList
                        data={incoming}
                        keyExtractor={i => String(i.id)}
                        renderItem={renderRequest}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#E10600" />}
                    />
                )
            )}
        </View>
    );
}
