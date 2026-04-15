import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View, FlatList, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ChevronLeft, Send } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { fetchMessages, sendDm, DmMessage } from '@/lib/api/dms';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function ConversationScreen() {
    const { userId: userIdParam } = useLocalSearchParams();
    const otherId  = Number(userIdParam);
    const router   = useRouter();
    const { accessToken, user } = useAuth();
    const { on } = useSocket();

    const [messages, setMessages]   = useState<DmMessage[]>([]);
    const [input, setInput]         = useState('');
    const [loading, setLoading]     = useState(true);
    const [sending, setSending]     = useState(false);
    const [otherUsername, setOtherUsername] = useState<string>(`User #${otherId}`);
    const flatRef = useRef<FlatList>(null);

    const loadMessages = useCallback(async () => {
        if (!accessToken) return;
        const msgs = await fetchMessages(otherId, accessToken);
        setMessages(msgs);
        if (msgs[0]?.sender?.username) {
            const other = msgs.find(m => m.senderId === otherId);
            if (other?.sender?.username) setOtherUsername(other.sender.username);
        }
        setLoading(false);
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    }, [accessToken, otherId]);

    useEffect(() => { loadMessages(); }, [loadMessages]);

    // Fetch username if no messages
    useEffect(() => {
        if (!loading && messages.length === 0) {
            fetch(`${API_URL}/users/${otherId}/public`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            })
                .then(r => r.json())
                .then(d => { if (d.user?.username) setOtherUsername(d.user.username); })
                .catch(() => {});
        }
    }, [loading, messages.length, otherId, accessToken]);

    // WebSocket: listen for incoming DMs
    useEffect(() => {
        const unsub = on('dm:received', (msg: DmMessage) => {
            if (msg.senderId === otherId || msg.receiverId === otherId) {
                setMessages(prev => [...prev, msg]);
                setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
            }
        });
        return unsub;
    }, [on, otherId]);

    const handleSend = async () => {
        if (!input.trim() || !accessToken) return;
        setSending(true);
        const content = input.trim();
        setInput('');

        // Optimistic UI
        const optimistic: DmMessage = {
            id: Date.now(),
            senderId: user!.id,
            receiverId: otherId,
            content,
            isRead: false,
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);

        const sent = await sendDm(otherId, content, accessToken);
        if (sent) {
            // Replace optimistic with real message
            setMessages(prev => prev.map(m => m.id === optimistic.id ? sent : m));
        }
        setSending(false);
    };

    const formatTime = (d: string) =>
        new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const renderMessage = ({ item, index }: { item: DmMessage; index: number }) => {
        const isOwn = item.senderId === user?.id;
        const prevMsg = messages[index - 1];
        const showDate = !prevMsg || new Date(item.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

        return (
            <>
                {showDate && (
                    <View className="items-center my-3">
                        <Text className="text-white/20 text-[10px] font-bold uppercase bg-white/5 px-3 py-1 rounded-full">
                            {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
                        </Text>
                    </View>
                )}
                <View className={`flex-row mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <View className={`max-w-[78%] px-3 py-2 rounded-2xl ${isOwn ? 'bg-primary rounded-tr-sm' : 'bg-white/10 rounded-tl-sm'}`}>
                        <Text className="text-white text-sm leading-5">{item.content}</Text>
                        <Text className={`text-[9px] mt-0.5 ${isOwn ? 'text-white/50 text-right' : 'text-white/30'}`}>
                            {formatTime(item.createdAt)}
                        </Text>
                    </View>
                </View>
            </>
        );
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-background"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
        >
            {/* Header */}
            <View className="px-4 pt-14 pb-3 flex-row items-center gap-3 border-b border-white/5">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-white/5 rounded-full">
                    <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => router.push(`/user/${otherId}` as any)}
                    className="w-9 h-9 rounded-full bg-primary/20 items-center justify-center"
                >
                    <Text className="text-primary font-black">{otherUsername[0]?.toUpperCase()}</Text>
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-white font-bold">{otherUsername}</Text>
                </View>
            </View>

            {/* Messages */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#E10600" />
                </View>
            ) : (
                <FlatList
                    ref={flatRef}
                    data={messages}
                    keyExtractor={m => String(m.id)}
                    renderItem={renderMessage}
                    contentContainerStyle={{ padding: 12, paddingBottom: 8, flexGrow: 1, justifyContent: messages.length === 0 ? 'center' : 'flex-end' }}
                    ListEmptyComponent={
                        <View className="items-center py-8">
                            <Text className="text-white/20 text-sm">Commencez la conversation !</Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Input */}
            <View className="px-3 py-3 flex-row items-center gap-2 border-t border-white/5">
                <TextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder="Message..."
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-sm"
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                    editable={!sending}
                    maxLength={2000}
                    multiline
                />
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={sending || !input.trim()}
                    className={`w-10 h-10 rounded-full items-center justify-center ${input.trim() ? 'bg-primary' : 'bg-white/10'}`}
                >
                    {sending ? <ActivityIndicator size="small" color="white" /> : <Send size={16} color="white" />}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
