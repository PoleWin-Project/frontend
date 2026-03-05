import { View, Image, Text, TouchableOpacity } from 'react-native';
// Removed custom Card import
import { MeetingItem } from '@/lib/api/meetings';
import { Calendar, MapPin, Clock } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

interface MeetingCardProps {
    meeting: MeetingItem;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
    const router = useRouter();

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

    // Formatting the date range gracefully
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
                setTimeLeft(null); // Event started
                setIsUpcoming(false);
            }
        }

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000); // Mettre à jour toutes les minutes
        return () => clearInterval(interval);
    }, [meeting.date_start, isUpcoming]);

    const formatMonth = (date: Date) => date.toLocaleDateString('fr-FR', { month: 'short' });
    const formatDay = (date: Date) => date.getDate();

    // E.g. "21 - 23 Août" or "30 Août - 01 Sept" if months differ
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

                        {/* Countdown Timer for Upcoming */}
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
                                // Adding negative scale trick + tinting to mimic a highly precise, thin stroke
                                className="scale-95"
                                tintColor="#9ca3af" // Tailwind gray-400 for a sharper, subtle look
                            />
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}
