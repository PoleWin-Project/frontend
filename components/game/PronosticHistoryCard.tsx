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
            case 'PODIUM':        return 'Podium (Top 3)';
            case 'SAFETY_CAR':    return 'Safety Car';
            case 'DNF':           return 'Abandon (DNF)';
            case 'FASTEST_LAP':   return 'Meilleur Tour';
            default:              return type.replace(/_/g, ' ');
        }
    };

    const formatValue = (type?: string, value?: string) => {
        if (!value) return 'Inconnu';
        if (type === 'PODIUM') {
            const drivers = value.split(',');
            return drivers.map((d, i) => `${i + 1}. ${d}`).join(' | ');
        }
        if (type === 'DNF') {
            const drivers = value.split(',').map(d => d.trim()).filter(Boolean);
            if (drivers.length === 0) return value;
            if (drivers[0] === 'NONE') return 'Aucun abandon';
            return drivers.join(', ');
        }
        if (type === 'SAFETY_CAR') {
            return value === 'YES' ? 'OUI' : value === 'NO' ? 'NON' : value;
        }
        return value;
    };

    const prediction = pronostic.prediction as any;
    const sessionName = prediction?.session?.name ? prediction.session.name.split(' - ')[0] : null;

    return (
        <View className="bg-card/80 border border-border/40 rounded-2xl p-4 mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-full bg-muted/50 items-center justify-center mr-4">
                    {getStatusIcon()}
                </View>
                <View className="flex-1">
                    <Text className="text-foreground font-bold text-lg leading-tight mb-0.5 mt-0.5">
                        {formatValue(prediction?.type, pronostic.detail?.value)}
                    </Text>
                    <View className="flex-row items-center">
                        <Text className="text-muted-foreground text-[10px] font-medium uppercase">
                            {prediction ? formatType(prediction.type) : 'Pronostic'}
                        </Text>
                        <Text className="text-muted-foreground mx-1">•</Text>
                        <Text className={`text-[10px] font-bold uppercase ${getStatusColor()}`}>
                            {getStatusText()}
                        </Text>
                    </View>
                    {prediction?.winningValue && (isLost || isWon) && (
                        <View className={`mt-1.5 self-start px-2 py-0.5 rounded border ${isWon ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                            <Text className={`text-[10px] font-bold ${isWon ? 'text-green-500' : 'text-red-400'}`}>
                                Vrai résultat : {formatValue(prediction.type, prediction.winningValue)}
                            </Text>
                        </View>
                    )}
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
