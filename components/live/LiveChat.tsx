import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { MessageCircle, Send, X, ChevronDown } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { fetchSessionChatChannel, fetchMessages, sendMessage, ChatMessage, ChatChannel } from '@/lib/api/chat';

const POLL_INTERVAL_MS = 3000;

interface LiveChatProps {
    sessionKey: number;
}

export function LiveChat({ sessionKey }: LiveChatProps) {
    const { user, accessToken } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [channel, setChannel] = useState<ChatChannel | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [channelLoading, setChannelLoading] = useState(false);
    const [channelError, setChannelError] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastMessageIdRef = useRef<number>(0);
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Load channel once when first opened
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

        // Load initial messages
        const msgs = await fetchMessages(ch.id, { limit: 50 });
        setMessages(msgs);
        if (msgs.length > 0) {
            lastMessageIdRef.current = msgs[msgs.length - 1].id;
        }
        setChannelLoading(false);
    }, [sessionKey]);

    // Open / close animation + data loading
    useEffect(() => {
        if (isOpen) {
            Animated.spring(slideAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();

            if (!channel) {
                loadChannel();
            }
        } else {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();
        }
    }, [isOpen]);

    // Polling for new messages
    useEffect(() => {
        if (!isOpen || !channel) return;

        const poll = async () => {
            if (lastMessageIdRef.current === 0) return;
            const newMsgs = await fetchMessages(channel.id, {
                after: lastMessageIdRef.current,
                limit: 30,
            });
            if (newMsgs.length > 0) {
                setMessages(prev => [...prev, ...newMsgs]);
                lastMessageIdRef.current = newMsgs[newMsgs.length - 1].id;
                // Scroll to bottom
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }
        };

        pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [isOpen, channel]);

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

    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [420, 0],
    });

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
        <>
            {/* Floating chat button */}
            <TouchableOpacity
                onPress={() => setIsOpen(true)}
                className="absolute bottom-6 right-4 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
                style={{ elevation: 8 }}
            >
                <MessageCircle size={24} color="white" />
                {messages.length > 0 && !isOpen && (
                    <View className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full items-center justify-center">
                        <Text className="text-primary text-[9px] font-black">
                            {messages.length > 99 ? '99' : messages.length}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Chat drawer overlay */}
            {isOpen && (
                <View className="absolute inset-0" style={{ pointerEvents: 'box-none' as any }}>
                    {/* Backdrop */}
                    <TouchableOpacity
                        className="absolute inset-0 bg-black/40"
                        activeOpacity={1}
                        onPress={() => setIsOpen(false)}
                    />

                    {/* Drawer */}
                    <Animated.View
                        style={{ transform: [{ translateY }] }}
                        className="absolute bottom-0 left-0 right-0 bg-[#0f0f0f] rounded-t-3xl border-t border-white/10"
                    >
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        >
                            {/* Handle & Header */}
                            <View className="items-center pt-3 pb-2">
                                <View className="w-10 h-1 bg-white/20 rounded-full" />
                            </View>
                            <View className="flex-row items-center justify-between px-4 pb-3 border-b border-white/5">
                                <View className="flex-row items-center gap-2">
                                    <View className="w-2 h-2 rounded-full bg-red-500" />
                                    <Text className="text-white font-black uppercase italic tracking-widest text-sm">
                                        Chat Live
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setIsOpen(false)}
                                    className="p-1.5 bg-white/5 rounded-full"
                                >
                                    <ChevronDown size={18} color="rgba(255,255,255,0.6)" />
                                </TouchableOpacity>
                            </View>

                            {/* Messages area */}
                            <View style={{ height: 340 }}>
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
                                        <MessageCircle size={32} color="rgba(255,255,255,0.1)" />
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

                            {/* Input area */}
                            <View className="px-4 py-3 border-t border-white/5">
                                {!user ? (
                                    <View className="bg-white/5 rounded-2xl px-4 py-3 items-center">
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
                                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-sm"
                                            onSubmitEditing={handleSend}
                                            returnKeyType="send"
                                            editable={!isSending}
                                            maxLength={500}
                                        />
                                        <TouchableOpacity
                                            onPress={handleSend}
                                            disabled={isSending || !inputText.trim()}
                                            className={`w-10 h-10 rounded-full items-center justify-center ${
                                                inputText.trim() ? 'bg-primary' : 'bg-white/10'
                                            }`}
                                        >
                                            {isSending ? (
                                                <ActivityIndicator size="small" color="white" />
                                            ) : (
                                                <Send size={16} color="white" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </KeyboardAvoidingView>
                    </Animated.View>
                </View>
            )}
        </>
    );
}
