import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { MessageCircle, Send } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { fetchSessionChatChannel, fetchMessages, sendMessage, ChatMessage, ChatChannel } from '@/lib/api/chat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const POLL_INTERVAL_MS = 3000;

interface LiveChatProps {
    sessionKey: number;
}

export function LiveChat({ sessionKey }: LiveChatProps) {
    const { user, accessToken } = useAuth();
    const insets = useSafeAreaInsets();

    const [channel, setChannel] = useState<ChatChannel | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [channelLoading, setChannelLoading] = useState(true);
    const [channelError, setChannelError] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastMessageIdRef = useRef<number>(0);

    const loadChannel = useCallback(async () => {
        setChannelLoading(true);
        setChannelError(false);
        const ch = await fetchSessionChatChannel(sessionKey);
        if (!ch) {
            setChannelError(true);
            setChannelLoading(false);
            return;
        }
        setChannel(ch);

        const msgs = await fetchMessages(ch.id, { limit: 50 });
        setMessages(msgs);
        if (msgs.length > 0) {
            lastMessageIdRef.current = msgs[msgs.length - 1].id;
        }
        setChannelLoading(false);
    }, [sessionKey]);

    useEffect(() => {
        loadChannel();
    }, [loadChannel]);

    useEffect(() => {
        if (!channel) return;

        const poll = async () => {
            const newMsgs = await fetchMessages(channel.id, {
                after: lastMessageIdRef.current || undefined,
                limit: 30,
            });
            if (newMsgs.length > 0) {
                setMessages(prev => {
                    const seen = new Set(prev.map(m => m.id));
                    const merged = [...prev, ...newMsgs.filter(m => !seen.has(m.id))];
                    return merged;
                });
                lastMessageIdRef.current = Math.max(
                    lastMessageIdRef.current,
                    newMsgs[newMsgs.length - 1].id,
                );
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }
        };

        pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [channel]);

    const handleSend = async () => {
        if (!inputText.trim() || !accessToken || !channel) return;
        setIsSending(true);
        const content = inputText.trim();
        setInputText('');

        const msg = await sendMessage(channel.id, content, accessToken);
        if (msg) {
            setMessages(prev => [...prev, msg]);
            lastMessageIdRef.current = Math.max(lastMessageIdRef.current, msg.id);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
        setIsSending(false);
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isOwn = user?.id === item.senderId;
        return (
            <View className={`flex-row mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {!isOwn && (
                    <View className="w-7 h-7 rounded-full bg-white/10 items-center justify-center mr-2 mt-1">
                        <Text className="text-white text-[10px] font-black">
                            {(item.sender?.username ?? '?')[0].toUpperCase()}
                        </Text>
                    </View>
                )}
                <View className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {!isOwn && (
                        <Text className="text-white/40 text-[9px] font-bold uppercase mb-0.5 ml-1">
                            {item.sender?.username ?? 'Anonyme'}
                        </Text>
                    )}
                    <View
                        className={`px-3 py-2 rounded-2xl ${
                            isOwn
                                ? 'bg-primary rounded-tr-sm'
                                : 'bg-white/10 rounded-tl-sm'
                        }`}
                    >
                        <Text className="text-white text-sm leading-5">{item.content}</Text>
                    </View>
                    <Text className="text-white/25 text-[9px] mt-0.5 mx-1">
                        {formatTime(item.createdAt)}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            style={{ flex: 1 }}
        >
            <View className="flex-1 bg-white/[0.03] rounded-3xl border border-white/5 overflow-hidden">
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                    <View className="flex-row items-center gap-2">
                        <View className="w-2 h-2 rounded-full bg-red-500" />
                        <Text className="text-white font-black uppercase italic tracking-widest text-xs">
                            Chat Live
                        </Text>
                    </View>
                    <Text className="text-white/30 text-[9px] font-bold uppercase tracking-widest">
                        {messages.length} msg
                    </Text>
                </View>

                <View className="flex-1">
                    {channelLoading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator color="#E10600" />
                            <Text className="text-white/40 text-xs mt-2 uppercase font-bold">
                                Connexion au chat...
                            </Text>
                        </View>
                    ) : channelError ? (
                        <View className="flex-1 items-center justify-center px-6">
                            <Text className="text-white/40 text-center text-sm">
                                Chat non disponible pour cette session.
                            </Text>
                        </View>
                    ) : messages.length === 0 ? (
                        <View className="flex-1 items-center justify-center px-6">
                            <MessageCircle size={28} color="rgba(255,255,255,0.1)" />
                            <Text className="text-white/30 text-center text-sm mt-3">
                                Soyez le premier à commenter !
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={(item) => String(item.id)}
                            renderItem={renderMessage}
                            contentContainerStyle={{ padding: 12, paddingBottom: 4 }}
                            onContentSizeChange={() =>
                                flatListRef.current?.scrollToEnd({ animated: false })
                            }
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>

                <View 
                    className="px-3 py-2 border-t border-white/5 bg-white/[0.02]"
                    style={{ paddingBottom: Math.max(insets.bottom, 8) }}
                >
                    {!user ? (
                        <View className="bg-white/5 rounded-2xl px-4 py-2.5 items-center">
                            <Text className="text-white/40 text-xs font-bold uppercase">
                                Connectez-vous pour participer
                            </Text>
                        </View>
                    ) : (
                        <View className="flex-row items-center gap-2">
                            <TextInput
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Votre message..."
                                placeholderTextColor="rgba(255,255,255,0.25)"
                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-white text-sm"
                                onSubmitEditing={handleSend}
                                returnKeyType="send"
                                editable={!isSending}
                                maxLength={500}
                            />
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={isSending || !inputText.trim()}
                                className={`w-9 h-9 rounded-full items-center justify-center ${
                                    inputText.trim() ? 'bg-primary' : 'bg-white/10'
                                }`}
                            >
                                {isSending ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Send size={14} color="white" />
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
