import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ChevronLeft, Trophy, UserPlus, UserCheck, MessageCircle, UserX, Clock } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import {
    fetchFriendStatus, sendFriendRequest, cancelRequest,
    respondToRequest, unfriend, FriendStatus,
} from '@/lib/api/friends';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface PublicProfile {
    id: number;
    username: string;
    profile?: {
        displayName: string | null;
        bio: string | null;
        avatarUrl: string | null;
        points: number;
        favoriteTeamCode: string | null;
        favoriteDriverCode: string | null;
    } | null;
}

export default function UserProfileScreen() {
    const { id } = useLocalSearchParams();
    const userId = Number(id);
    const router = useRouter();
    const { accessToken, user: me } = useAuth();

    const [profile, setProfile]       = useState<PublicProfile | null>(null);
    const [status, setStatus]         = useState<FriendStatus>({ status: 'none' });
    const [loading, setLoading]       = useState(true);
    const [actionLoading, setAction]  = useState(false);

    const load = useCallback(async () => {
        if (!accessToken) return;
        const [profileRes, statusRes] = await Promise.all([
            fetch(`${API_URL}/users/${userId}/public`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            }).then(r => r.json()).catch(() => null),
            fetchFriendStatus(userId, accessToken),
        ]);
        if (profileRes?.user) setProfile(profileRes.user);
        setStatus(statusRes);
        setLoading(false);
    }, [accessToken, userId]);

    useEffect(() => { load(); }, [load]);

    const handleSendRequest = async () => {
        if (!accessToken) return;
        setAction(true);
        const res = await sendFriendRequest(userId, accessToken);
        if (res.ok) setStatus({ status: 'pending', isSender: true, requestId: res.data?.request?.id });
        setAction(false);
    };

    const handleCancel = async () => {
        if (!accessToken || !status.requestId) return;
        setAction(true);
        await cancelRequest(status.requestId, accessToken);
        setStatus({ status: 'none' });
        setAction(false);
    };

    const handleAccept = async () => {
        if (!accessToken || !status.requestId) return;
        setAction(true);
        await respondToRequest(status.requestId, 'accept', accessToken);
        setStatus({ status: 'accepted' });
        setAction(false);
    };

    const handleUnfriend = async () => {
        if (!accessToken) return;
        setAction(true);
        await unfriend(userId, accessToken);
        setStatus({ status: 'none' });
        setAction(false);
    };

    const isMe = me?.id === userId;
    const displayName = profile?.profile?.displayName || profile?.username || `User #${userId}`;

    const renderFriendButton = () => {
        if (isMe) return null;
        if (actionLoading) return <ActivityIndicator color="#E10600" />;

        switch (status.status) {
            case 'accepted':
                return (
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={() => router.push(`/messages/${userId}` as any)}
                            className="flex-1 bg-primary flex-row items-center justify-center gap-2 py-3 rounded-2xl"
                        >
                            <MessageCircle size={18} color="white" />
                            <Text className="text-white font-bold">Message</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleUnfriend}
                            className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl items-center"
                        >
                            <UserX size={18} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                    </View>
                );
            case 'pending':
                if (status.isSender) {
                    return (
                        <TouchableOpacity
                            onPress={handleCancel}
                            className="flex-row items-center justify-center gap-2 bg-white/5 border border-white/10 py-3 rounded-2xl"
                        >
                            <Clock size={18} color="rgba(255,255,255,0.5)" />
                            <Text className="text-white/50 font-bold">Demande envoyée</Text>
                        </TouchableOpacity>
                    );
                }
                return (
                    <TouchableOpacity
                        onPress={handleAccept}
                        className="flex-row items-center justify-center gap-2 bg-primary py-3 rounded-2xl"
                    >
                        <UserCheck size={18} color="white" />
                        <Text className="text-white font-bold">Accepter la demande</Text>
                    </TouchableOpacity>
                );
            default:
                return (
                    <TouchableOpacity
                        onPress={handleSendRequest}
                        className="flex-row items-center justify-center gap-2 bg-primary py-3 rounded-2xl"
                    >
                        <UserPlus size={18} color="white" />
                        <Text className="text-white font-bold">Ajouter en ami</Text>
                    </TouchableOpacity>
                );
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator color="#E10600" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="px-4 pt-14 pb-4 flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-white/5 rounded-full">
                    <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
                <Text className="text-white font-black text-lg italic uppercase tracking-widest flex-1">Profil</Text>
            </View>

            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                {/* Avatar + name */}
                <View className="items-center mb-6 mt-2">
                    <View className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/30 items-center justify-center mb-4">
                        <Text className="text-primary font-black text-4xl">
                            {displayName[0]?.toUpperCase()}
                        </Text>
                    </View>
                    <Text className="text-white font-black text-2xl italic uppercase">{displayName}</Text>
                    {profile?.profile?.displayName && (
                        <Text className="text-white/40 text-sm mt-0.5">@{profile.username}</Text>
                    )}
                    {isMe && (
                        <View className="mt-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                            <Text className="text-primary text-xs font-bold">Votre profil</Text>
                        </View>
                    )}
                </View>

                {/* Points */}
                {profile?.profile?.points !== undefined && (
                    <View className="bg-white/5 border border-white/5 rounded-3xl p-4 mb-4 flex-row items-center justify-between">
                        <Text className="text-white/60 font-bold uppercase text-xs">Points PoleWin</Text>
                        <View className="flex-row items-center gap-2">
                            <Trophy size={16} color="#E10600" />
                            <Text className="text-white font-black text-lg">{profile.profile.points.toLocaleString()}</Text>
                        </View>
                    </View>
                )}

                {/* Bio */}
                {profile?.profile?.bio ? (
                    <View className="bg-white/5 border border-white/5 rounded-3xl p-4 mb-4">
                        <Text className="text-white/40 font-bold uppercase text-[10px] mb-2">À propos</Text>
                        <Text className="text-white/80 text-sm leading-5">{profile.profile.bio}</Text>
                    </View>
                ) : null}

                {/* Favorites */}
                {(profile?.profile?.favoriteTeamCode || profile?.profile?.favoriteDriverCode) && (
                    <View className="bg-white/5 border border-white/5 rounded-3xl p-4 mb-4">
                        <Text className="text-white/40 font-bold uppercase text-[10px] mb-3">Favoris F1</Text>
                        {profile?.profile?.favoriteTeamCode && (
                            <View className="flex-row items-center justify-between py-2 border-b border-white/5">
                                <Text className="text-white/60 text-sm">Écurie</Text>
                                <Text className="text-white font-bold text-sm">{profile.profile.favoriteTeamCode}</Text>
                            </View>
                        )}
                        {profile?.profile?.favoriteDriverCode && (
                            <View className="flex-row items-center justify-between py-2">
                                <Text className="text-white/60 text-sm">Pilote</Text>
                                <Text className="text-white font-bold text-sm">{profile.profile.favoriteDriverCode}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Friend action button */}
                <View className="mb-8">
                    {renderFriendButton()}
                </View>
            </ScrollView>
        </View>
    );
}
