import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { CheckCircle2, Clock, XCircle, Trophy, Coins, Ban } from 'lucide-react-native';
import { Pronostic } from '@/lib/api/meetings';

export function PronosticHistoryCard({ pronostic }: { pronostic: Pronostic }) {
    const isWon = pronostic.status === 'won';
    const isLost = pronostic.status === 'lost';
    const isVoid = pronostic.status === 'void';

    const getStatusIcon = () => {
        if (isWon) return <CheckCircle2 size={24} color="#22c55e" />;
        if (isLost) return <XCircle size={24} color="#ef4444" />;
        if (isVoid) return <Ban size={24} color="#9ca3af" />;
        return <Clock size={24} color="#f59e0b" />;
    };

    const getStatusText = () => {
        if (isWon) return 'Gagné';
        if (isLost) return 'Perdu';
        if (isVoid) return 'Annulé · remboursé';
        return 'En attente';
    };

    const getStatusColor = () => {
        if (isWon) return 'text-green-500';
        if (isLost) return 'text-red-500';
        if (isVoid) return 'text-muted-foreground';
        return 'text-amber-500';
    };

    const formatType = (type?: string) => {
        if (!type) return 'Prono';
        switch (type) {
            case 'POLE_POSITION': return 'Pole · Qualifs';
            case 'RACE_WINNER':   return 'Vainqueur Course';
            case 'SPRINT_WINNER': return 'Vainqueur Sprint';
            default:              return type.replace(/_/g, ' ');
        }
    };

    const prediction = pronostic.prediction as any;

    return (
        <View className="bg-card/80 border border-border/40 rounded-2xl p-4 mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-full bg-muted/50 items-center justify-center mr-4">
                    {getStatusIcon()}
                </View>
                <View className="flex-1">
                    <Text className="text-foreground font-bold text-lg">
                        {pronostic.detail?.value || 'Pilote inconnu'}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                        <Text className="text-muted-foreground text-xs font-medium uppercase">
                            {prediction ? formatType(prediction.type) : 'Pronostic'}
                        </Text>
                        <Text className="text-muted-foreground mx-1">•</Text>
                        <Text className={`text-xs font-bold uppercase ${getStatusColor()}`}>
                            {getStatusText()}
                        </Text>
                    </View>
                </View>
            </View>
            <View className="items-end">
                <View className="flex-row items-center mb-1">
                    <Coins size={14} color="#ef4444" />
                    <Text className="text-foreground font-bold ml-1">{pronostic.pointsStaked} pts</Text>
                </View>
                {isWon && (
                    <Text className="text-green-500 font-bold text-xs uppercase">+{pronostic.pointsEarned}</Text>
                )}
                {isLost && (
                    <Text className="text-red-500 font-bold text-xs uppercase">-{pronostic.pointsStaked}</Text>
                )}
                {isVoid && (
                    <Text className="text-muted-foreground font-bold text-xs uppercase">+{pronostic.pointsStaked} remb.</Text>
                )}
            </View>
        </View>
    );
}
