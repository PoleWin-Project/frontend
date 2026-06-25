import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View, TextInput, FlatList, TouchableOpacity,
    ActivityIndicator, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ChevronLeft, Search, X, Trophy, UserPlus, UserCheck, Clock } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { searchUsers, SearchUser } from '@/lib/api/users';
import { fetchFriendStatus, sendFriendRequest, FriendStatus } from '@/lib/api/friends';

export default function SearchScreen() {
    const router = useRouter();
    const { accessToken, user: me } = useAuth();

    const [query, setQuery]           = useState('');
    const [results, setResults]       = useState<SearchUser[]>([]);
    const [searching, setSearching]   = useState(false);
    const [statuses, setStatuses]     = useState<Record<number, FriendStatus>>({});
    const [actionId, setActionId]     = useState<number | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef    = useRef<TextInput>(null);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    const runSearch = useCallback(async (q: string) => {
        if (!accessToken) return;
        if (!q.trim()) { setResults([]); return; }

        setSearching(true);
        const users = await searchUsers(q, accessToken);
        setResults(users);
        setSearching(false);

        // Fetch friendship status for each result
        const statusEntries = await Promise.all(
            users
                .filter(u => u.id !== me?.id)
                .map(async u => {
                    const s = await fetchFriendStatus(u.id, accessToken);
                    return [u.id, s] as [number, FriendStatus];
                })
        );
        setStatuses(Object.fromEntries(statusEntries));
    }, [accessToken, me?.id]);

    const handleChange = (text: string) => {
        setQuery(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => runSearch(text), 350);
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        inputRef.current?.focus();
    };

    const handleAddFriend = async (userId: number) => {
        if (!accessToken) return;
        setActionId(userId);
        const res = await sendFriendRequest(userId, accessToken);
        if (res.ok) {
            setStatuses(prev => ({
                ...prev,
                [userId]: { status: 'pending', isSender: true, requestId: res.data?.request?.id },
            }));
        }
        setActionId(null);
    };

    const renderStatus = (user: SearchUser) => {
        if (user.id === me?.id) return null;
        const s = statuses[user.id];
        if (!s) return null;

        if (actionId === user.id) return <ActivityIndicator size="small" color="#E10600" />;

        switch (s.status) {
            case 'accepted':
                return (
                    <View className="flex-row items-center gap-1 bg-green-500/10 border border-green-500/30 px-2.5 py-1.5 rounded-full">
                        <UserCheck size={13} color="#22c55e" />
                        <Text className="text-green-500 text-[10px] font-bold">Amis</Text>
                    </View>
                );
            case 'pending':
                return (
                    <View className="flex-row items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-full">
                        <Clock size={13} color="rgba(255,255,255,0.4)" />
                        <Text className="text-white/40 text-[10px] font-bold">
                            {s.isSender ? 'Envoyé' : 'Reçu'}
                        </Text>
                    </View>
                );
            default:
                return (
                    <TouchableOpacity
                        onPress={() => handleAddFriend(user.id)}
                        className="flex-row items-center gap-1 bg-primary/10 border border-primary/30 px-2.5 py-1.5 rounded-full"
                    >
                        <UserPlus size={13} color="#E10600" />
                        <Text className="text-primary text-[10px] font-bold">Ajouter</Text>
                    </TouchableOpacity>
                );
        }
    };

    const renderUser = ({ item }: { item: SearchUser }) => {
        const name = item.profile?.displayName || item.username;
        const isMe = item.id === me?.id;

        return (
            <TouchableOpacity
                onPress={() => { Keyboard.dismiss(); router.push(`/user/${item.id}` as any); }}
                activeOpacity={0.7}
                className="flex-row items-center px-4 py-3 border-b border-white/5"
            >
                {/* Avatar */}
                <View className="w-11 h-11 rounded-full bg-primary/20 items-center justify-center mr-3">
                    <Text className="text-primary font-black text-lg">
                        {item.username[0].toUpperCase()}
                    </Text>
                </View>

                {/* Info */}
                <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                        <Text className="text-white font-bold text-sm">{name}</Text>
                        {isMe && (
                            <View className="bg-primary/20 px-1.5 py-0.5 rounded-full">
                                <Text className="text-primary text-[9px] font-bold">Vous</Text>
                            </View>
                        )}
                    </View>
                    {item.profile?.displayName && (
                        <Text className="text-white/40 text-xs">@{item.username}</Text>
                    )}
                    {item.profile?.points !== undefined && (
                        <View className="flex-row items-center gap-1 mt-0.5">
                            <Trophy size={10} color="rgba(255,255,255,0.3)" />
                            <Text className="text-white/30 text-[10px]">
                                {item.profile.points.toLocaleString()} pts
                            </Text>
                        </View>
                    )}
                </View>

                {/* Friend button */}
                {renderStatus(item)}
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-background">
            {/* Header + search bar */}
            <View className="px-4 pt-14 pb-3 border-b border-white/5">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 bg-white/5 rounded-full"
                    >
                        <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>

                    <View className="flex-1 flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-3 gap-2">
                        <Search size={16} color="rgba(255,255,255,0.3)" />
                        <TextInput
                            ref={inputRef}
                            value={query}
                            onChangeText={handleChange}
                            placeholder="Rechercher un pilote..."
                            placeholderTextColor="rgba(255,255,255,0.25)"
                            className="flex-1 text-white text-sm py-2.5"
                            returnKeyType="search"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={handleClear}>
                                <X size={15} color="rgba(255,255,255,0.4)" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            {/* Results */}
            {searching ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#E10600" />
                </View>
            ) : results.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    {query.length === 0 ? (
                        <>
                            <Search size={48} color="rgba(255,255,255,0.08)" />
                            <Text className="text-white/25 text-center mt-4 text-sm">
                                Tape un nom d'utilisateur pour le trouver
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text className="text-white/30 text-center text-sm">
                                Aucun résultat pour «{query}»
                            </Text>
                        </>
                    )}
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={u => String(u.id)}
                    renderItem={renderUser}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            )}
        </View>
    );
}
