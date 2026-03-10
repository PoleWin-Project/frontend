import { View, Image, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MeetingItem, SessionItem, fetchSessions } from '@/lib/api/meetings';
import { Calendar, MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

interface MeetingCardProps {
    meeting: MeetingItem;
    isPast?: boolean;
}

export function MeetingCard({ meeting, isPast = false }: MeetingCardProps) {
    const router = useRouter();

    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        setSessionsLoading(true);
        fetchSessions(meeting.meeting_key, meeting.year)
            .then(data =>
                setSessions(data.sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime()))
            )
            .catch(() => setSessions([]))
            .finally(() => setSessionsLoading(false));
    }, [meeting.meeting_key, meeting.year]);

    const handlePress = () => {
        router.push({
            pathname: '/meeting/[id]' as any,
            params: {
                id: meeting.meeting_key,
                meeting_name: meeting.meeting_name,
                country_name: meeting.country_name,
                country_flag: meeting.country_flag,
                circuit_short_name: meeting.circuit_short_name,
                circuit_image: meeting.circuit_image,
                location: meeting.location,
                date_start: meeting.date_start,
                date_end: meeting.date_end,
                year: meeting.year
            }
        });
    };

    const startDate = new Date(meeting.date_start);
    const endDate = new Date(meeting.date_end);

    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, mins: number } | null>(null);
    const [isUpcoming, setIsUpcoming] = useState(startDate.getTime() > Date.now());

    useEffect(() => {
        if (!isUpcoming) return;

        function updateCountdown() {
            const difference = new Date(meeting.date_start).getTime() - Date.now();
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    mins: Math.floor((difference / 1000 / 60) % 60)
                });
            } else {
                setTimeLeft(null);
                setIsUpcoming(false);
            }
        }

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000);
        return () => clearInterval(interval);
    }, [meeting.date_start, isUpcoming]);

    const formatMonth = (date: Date) => date.toLocaleDateString('fr-FR', { month: 'short' });
    const formatDay = (date: Date) => date.getDate();

    const formatSessionTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatSessionDay = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    let dateRangeStr = '';
    if (startDate.getMonth() === endDate.getMonth()) {
        dateRangeStr = `${formatDay(startDate)} - ${formatDay(endDate)} ${formatMonth(endDate)}`;
    } else {
        dateRangeStr = `${formatDay(startDate)} ${formatMonth(startDate)} - ${formatDay(endDate)} ${formatMonth(endDate)}`;
    }

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
            <View className="mb-4 overflow-hidden rounded-xl border border-border bg-card">
                {/* Country Flag & Date Range Header */}
                <View className="flex-row items-center justify-between bg-muted/50 p-4 border-b border-border/50">
                    <View className="flex-row items-center gap-3">
                        {meeting.country_flag ? (
                            <Image
                                source={{ uri: meeting.country_flag }}
                                style={{ width: 28, height: 20, borderRadius: 2 }}
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="w-7 h-5 bg-muted rounded-sm" />
                        )}
                        <Text className="font-heading font-bold text-foreground uppercase tracking-wide">
                            {meeting.country_name}
                        </Text>
                    </View>

                    <View className="flex-row items-center gap-1.5 bg-background px-2.5 py-1 rounded-full border border-border">
                        <Calendar size={14} className="text-muted-foreground" color="gray" />
                        <Text className="text-xs font-medium text-foreground capitalize">
                            {dateRangeStr}
                        </Text>
                    </View>
                </View>

                {/* Circuit Image and Details Content */}
                <View className="p-4 pt-5">
                    <Text className="font-heading text-xl font-bold text-foreground mb-1 leading-tight">
                        {meeting.meeting_name}
                    </Text>

                    <View className="flex-row items-center mt-2 justify-between">
                        <View className="flex-row items-center flex-1 pr-2 gap-1">
                            <MapPin size={14} className="text-primary flex-shrink-0" color="#ef4444" />
                            <Text className="text-sm text-muted-foreground flex-1" numberOfLines={1}>
                                {meeting.circuit_short_name} • {meeting.location}
                            </Text>
                        </View>

                        {isUpcoming && timeLeft && (
                            <View className="flex-row items-center bg-primary/10 px-2 py-1 rounded-md gap-1">
                                <Clock size={12} className="text-primary" color="#ef4444" />
                                <Text className="text-xs font-semibold text-primary">
                                    {timeLeft.days > 0 ? `${timeLeft.days}j ` : ''}{timeLeft.hours}h {timeLeft.mins}m
                                </Text>
                            </View>
                        )}
                    </View>

                    {meeting.circuit_image && (
                        <View className="mt-6 border border-border/40 rounded-lg p-3 bg-background/50 h-[140px] justify-center overflow-hidden">
                            <Image
                                source={{ uri: meeting.circuit_image }}
                                style={{ width: '100%', height: '100%', opacity: 0.8 }}
                                resizeMode="contain"
                                className="scale-95"
                                tintColor="#9ca3af"
                            />
                        </View>
                    )}

                    {/* Inline Session Details */}
                    {(
                        <View className="mt-4">
                            <TouchableOpacity
                                onPress={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                                activeOpacity={0.7}
                                className="flex-row items-center justify-between py-2 border-t border-border/40"
                            >
                                <Text className="text-xs uppercase tracking-widest text-primary font-bold">
                                    Sessions ({sessions.length})
                                </Text>
                                {expanded ? (
                                    <ChevronUp size={16} color="#ef4444" />
                                ) : (
                                    <ChevronDown size={16} color="#ef4444" />
                                )}
                            </TouchableOpacity>

                            {expanded && (
                                sessionsLoading ? (
                                    <View className="py-4 items-center">
                                        <ActivityIndicator size="small" color="#ef4444" />
                                    </View>
                                ) : sessions.length > 0 ? (
                                    <View className="gap-1 mt-1">
                                        {sessions.map((session, index) => {
                                            const isRace = session.session_type === 'Race' || session.session_name.toLowerCase().includes('race');
                                            const isQuali = session.session_name.toLowerCase().includes('qualifying');

                                            return (
                                                <View
                                                    key={session.session_key}
                                                    className={`flex-row items-center justify-between py-2.5 px-2 rounded-lg ${isRace ? 'bg-primary/10' : ''} ${index !== sessions.length - 1 ? 'border-b border-border/20' : ''}`}
                                                >
                                                    <View className="flex-row items-center flex-1">
                                                        <View className={`w-2 h-2 rounded-full mr-2.5 ${isRace ? 'bg-primary' : isQuali ? 'bg-orange-500' : 'bg-muted-foreground/40'}`} />
                                                        <Text className={`text-sm ${isRace ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                                                            {session.session_name}
                                                        </Text>
                                                    </View>

                                                    <View className="flex-row items-center gap-3">
                                                        <Text className="text-[11px] text-muted-foreground capitalize">
                                                            {formatSessionDay(session.date_start)}
                                                        </Text>
                                                        <View className={`px-2 py-0.5 rounded-md ${isRace ? 'bg-primary' : 'bg-muted/80'}`}>
                                                            <Text className={`text-xs font-bold font-mono ${isRace ? 'text-white' : 'text-foreground'}`}>
                                                                {formatSessionTime(session.date_start)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                ) : (
                                    <Text className="text-xs text-muted-foreground text-center py-3">
                                        Aucune session enregistrée.
                                    </Text>
                                )
                            )}
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}
