import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, Lock, Trash2, HelpCircle, X, Flag } from 'lucide-react-native';
import {
    ApiError,
    Prediction,
    Pronostic,
    Driver,
    placePronostic,
    updatePronostic,
    deletePronostic,
    rewardFor,
    rewardRange,
} from '@/lib/api/meetings';
import { useAuth } from '@/context/AuthContext';

interface PredictionCardProps {
    prediction: Prediction;
    initialPronostic: Pronostic | null;
    drivers: Driver[];
    onRefresh: () => void;
}

/**
 * Carte de pronostic — modèle « championnat » (aucune mise).
 *
 * Le joueur choisit seulement une réponse. Chaque choix affiche le nombre de
 * points de championnat qu'il rapporte S'IL EST CORRECT (valeur calculée et figée
 * par le serveur). Un pronostic incorrect rapporte 0 point et ne retire rien.
 * ⚠️ Ne jamais réintroduire ici de vocabulaire de pari (mise, cote, gain potentiel…).
 */
export function PredictionCard({ prediction, initialPronostic, drivers, onRefresh }: PredictionCardProps) {
    const { refreshProfile } = useAuth();
    const isPodium = prediction.type === 'PODIUM';
    const isSafetyCar = prediction.type === 'SAFETY_CAR';
    const [pickerVisible, setPickerVisible] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [podiumDrivers, setPodiumDrivers] = useState<(Driver | null)[]>([null, null, null]);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [infoModalVisible, setInfoModalVisible] = useState(false);
    const [infoContent, setInfoContent] = useState<{ title: string, message: string } | null>(null);

    // Resynchronise la sélection quand le pronostic change (après validation / refresh).
    React.useEffect(() => {
        if (initialPronostic) {
            if (isPodium) {
                const acronyms = initialPronostic.detail?.value.split(',') || [];
                setPodiumDrivers([
                    drivers.find(d => d.name_acronym === acronyms[0]) || null,
                    drivers.find(d => d.name_acronym === acronyms[1]) || null,
                    drivers.find(d => d.name_acronym === acronyms[2]) || null,
                ]);
            } else if (isSafetyCar) {
                setSelectedOption(initialPronostic.detail?.value || null);
            } else {
                const driver = drivers.find(d => d.name_acronym === initialPronostic.detail?.value);
                if (driver) setSelectedDriver(driver);
            }
        } else {
            setSelectedDriver(null);
            setPodiumDrivers([null, null, null]);
            setSelectedOption(null);
        }
    }, [initialPronostic, drivers, isPodium, isSafetyCar]);

    const isLocked = new Date(prediction.closesAt).getTime() < Date.now();
    const hasPronostic = !!initialPronostic;
    const isResolved = initialPronostic?.status === 'won' || initialPronostic?.status === 'lost';
    const range = rewardRange(prediction);

    /** Valeur actuellement sélectionnée dans la modale (format attendu par l'API). */
    const currentValue = (): string | null => {
        if (isPodium) return podiumDrivers.includes(null) ? null : podiumDrivers.map(d => d!.name_acronym).join(',');
        if (isSafetyCar) return selectedOption;
        return selectedDriver?.name_acronym ?? null;
    };

    /** Récompense indicative de la sélection en cours (la valeur définitive est fixée par le serveur). */
    const selectionReward = (() => {
        const value = currentValue();
        return value ? rewardFor(prediction, value) : null;
    })();

    const handleSubmit = async () => {
        const value = currentValue();
        if (!value) return;

        setLoading(true);
        try {
            if (hasPronostic) {
                await updatePronostic(prediction.id, value);
            } else {
                await placePronostic(prediction.id, value);
            }
            setPickerVisible(false);
            onRefresh();
            refreshProfile();
        } catch (error) {
            const message = error instanceof ApiError ? error.message : 'Impossible d’enregistrer le pronostic.';
            Alert.alert('Pronostic non enregistré', message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            await deletePronostic(prediction.id);
            setPickerVisible(false);
            onRefresh();
            refreshProfile();
        } catch (error) {
            const message = error instanceof ApiError ? error.message : 'Impossible de retirer le pronostic.';
            Alert.alert('Erreur', message);
        } finally {
            setLoading(false);
        }
    };

    const formatType = (type: string) => {
        switch (type) {
            case 'POLE_POSITION': return 'Qui finira 1er aux qualifs ?';
            case 'RACE_WINNER': return 'Qui gagnera la course ?';
            case 'SPRINT_WINNER': return 'Qui gagnera le sprint ?';
            case 'PODIUM': return 'Quel sera le podium ?';
            case 'SAFETY_CAR': return 'Y aura-t-il une Safety Car ?';
            case 'DNF': return 'Quel pilote va abandonner ?';
            case 'FASTEST_LAP': return 'Qui fera le meilleur tour ?';
            default: return type.replace(/_/g, ' ');
        }
    };

    const showExplanation = (type: string) => {
        const podiumFull = prediction.rewardOptions?.find(o => o.value === '*');
        const explanations: Record<string, { title: string, message: string }> = {
            'PODIUM': {
                title: 'Podium',
                message: podiumFull
                    ? `Choisis les 3 pilotes du podium. ${podiumFull.rewardPoints} points si l'ordre exact est trouvé, ${podiumFull.partialRewardPoints ?? 0} points si les 3 pilotes sont bons dans le désordre.`
                    : 'Choisis les 3 pilotes du podium. L’ordre exact rapporte le plus de points.',
            },
            'SAFETY_CAR': {
                title: 'Safety Car',
                message: 'Pronostique si la voiture de sécurité (Safety Car) sortira sur la piste pendant la course (Virtual Safety Car non incluse).'
            },
            'DNF': {
                title: 'Abandon (DNF)',
                message: 'Choisis un pilote qui n\'arrivera pas à terminer la course (abandon, crash ou disqualification).'
            },
            'FASTEST_LAP': {
                title: 'Meilleur Tour',
                message: 'Pronostique le pilote qui réalisera le meilleur tour absolu sur l\'ensemble de la course.'
            }
        };
        const info = explanations[type];
        if (info) {
            setInfoContent(info);
            setInfoModalVisible(true);
        }
    };

    const showRewardsInfo = () => {
        setInfoContent({
            title: 'Points de championnat',
            message: 'Chaque choix indique les points qu’il rapporte s’il est correct : un pronostic audacieux rapporte plus qu’un pronostic évident. Un pronostic incorrect ne coûte rien.',
        });
        setInfoModalVisible(true);
    };

    const handleDriverSelect = (driver: Driver) => {
        if (isPodium) {
            if (podiumDrivers.find(d => d?.driver_number === driver.driver_number)) {
                setPodiumDrivers(prev => prev.map(d => d?.driver_number === driver.driver_number ? null : d));
                return;
            }
            const emptyIndex = podiumDrivers.findIndex(d => d === null);
            if (emptyIndex !== -1) {
                setPodiumDrivers(prev => {
                    const next = [...prev];
                    next[emptyIndex] = driver;
                    return next;
                });
            }
        } else {
            setSelectedDriver(driver);
        }
    };

    const rewardLabel = range
        ? (range.min === range.max ? `${range.max} points si correct` : `De ${range.min} à ${range.max} points si correct`)
        : 'Points de championnat si correct';

    return (
        <Card className="border-border/40 shadow-sm bg-card/80 overflow-hidden">
            <View className={`h-1 w-full ${isLocked ? 'bg-muted' : 'bg-primary'}`} />
            <CardHeader className="flex-row items-center justify-between pb-2">
                <View className="flex-1">
                    <View className="flex-row items-center gap-2 pr-2">
                        <CardTitle className="text-lg font-bold uppercase tracking-tight text-foreground flex-shrink">
                            {formatType(prediction.type)}
                        </CardTitle>
                        {['PODIUM', 'SAFETY_CAR', 'DNF', 'FASTEST_LAP'].includes(prediction.type) && (
                            <TouchableOpacity onPress={() => showExplanation(prediction.type)} className="p-1">
                                <HelpCircle size={16} color="#9ca3af" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <View className="flex-row items-center mt-1">
                        <Clock size={12} color={isLocked ? '#9ca3af' : '#6b7280'} />
                        <Text className="text-[10px] text-muted-foreground ml-1">
                            {isLocked ? 'Fermé' : `Ferme le ${new Date(prediction.closesAt).toLocaleString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`}
                        </Text>
                    </View>
                </View>
                {isLocked ? <Lock size={20} color="#9ca3af" /> : <Flag size={20} color="#ef4444" />}
            </CardHeader>

            <CardContent className="pt-2">
                {hasPronostic ? (
                    <View className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1 pr-2">
                                {!isPodium && !isSafetyCar && (
                                    <>
                                        <View
                                            style={{ backgroundColor: selectedDriver ? `#${selectedDriver.team_colour}` : '#3b82f6' }}
                                            className="w-1 h-8 rounded-full mr-3"
                                        />
                                        <View>
                                            <Text className="text-xs text-muted-foreground font-medium">Ton pronostic</Text>
                                            <Text className="text-base font-bold text-foreground">
                                                {selectedDriver?.full_name || initialPronostic?.detail?.value}
                                            </Text>
                                        </View>
                                    </>
                                )}
                                {isSafetyCar && (
                                    <View>
                                        <Text className="text-xs text-muted-foreground font-medium">Ton pronostic</Text>
                                        <Text className="text-base font-bold text-foreground">
                                            {selectedOption === 'YES' ? 'OUI' : selectedOption === 'NO' ? 'NON' : initialPronostic?.detail?.value}
                                        </Text>
                                    </View>
                                )}
                                {isPodium && (
                                    <View>
                                        <Text className="text-xs text-muted-foreground font-medium mb-1">Ton podium</Text>
                                        <View className="flex-row items-center gap-1.5 flex-wrap">
                                            {podiumDrivers.map((d, i) => (
                                                <View key={i} className="bg-background/50 px-1.5 py-0.5 rounded border border-border/50">
                                                    <Text className="text-[11px] font-bold text-foreground">
                                                        <Text className="text-[9px] text-muted-foreground">{i + 1}.</Text> {d?.name_acronym}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                            <View className="items-end">
                                {isResolved ? (
                                    <Text className={`text-sm font-bold ${initialPronostic?.status === 'won' ? 'text-green-500' : 'text-muted-foreground'}`}>
                                        {initialPronostic?.status === 'won'
                                            ? `+${initialPronostic?.championshipPointsAwarded ?? 0} pts`
                                            : '0 pt'}
                                    </Text>
                                ) : (
                                    <View className="flex-row items-center bg-primary/15 px-2 py-1 rounded-md">
                                        <Trophy size={12} color="#ef4444" />
                                        <Text className="text-xs font-bold text-primary ml-1">
                                            {initialPronostic?.rewardPointsSnapshot ?? '—'} pts si correct
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        {!isLocked && (
                            <View className="flex-row gap-2 mt-3">
                                <Button
                                    variant="outline"
                                    onPress={() => setPickerVisible(true)}
                                    className="flex-1 h-8 border-primary/20 bg-transparent"
                                >
                                    <Text className="text-primary text-xs font-bold uppercase">Modifier mon pronostic</Text>
                                </Button>
                                <Button
                                    variant="outline"
                                    onPress={handleDelete}
                                    disabled={loading}
                                    className="px-4 h-8 border-red-500/20 bg-red-500/10"
                                >
                                    {loading ? <ActivityIndicator size="small" color="#ef4444" /> : <Trash2 size={16} color="#ef4444" />}
                                </Button>
                            </View>
                        )}
                    </View>
                ) : (
                    <View className="bg-muted/30 border border-border/50 rounded-xl p-4">
                        <TouchableOpacity onPress={showRewardsInfo} className="flex-row items-center justify-between mb-4">
                            <View className="flex-1 pr-2">
                                <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Points possibles</Text>
                                <Text className="text-base font-black text-foreground">{rewardLabel}</Text>
                            </View>
                            <HelpCircle size={16} color="#9ca3af" />
                        </TouchableOpacity>
                        <Button
                            onPress={() => !isLocked && setPickerVisible(true)}
                            disabled={isLocked}
                            className="w-full bg-foreground h-10"
                        >
                            <Text className="text-background font-bold uppercase tracking-widest text-xs">
                                {isLocked ? 'Pronostics fermés' : 'Faire mon prono'}
                            </Text>
                        </Button>
                    </View>
                )}
            </CardContent>

            {/* Modale de choix */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={pickerVisible}
                onRequestClose={() => setPickerVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/60">
                    <View className="bg-card rounded-t-3xl p-6 h-[80%] border-t border-border/50">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-bold text-foreground">{hasPronostic ? "Modifier le prono" : "Faire son prono"}</Text>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <Text className="text-primary font-bold">Annuler</Text>
                            </TouchableOpacity>
                        </View>

                        {isPodium && (
                            <View className="flex-row justify-between mb-4 gap-2">
                                {[0, 1, 2].map((i) => (
                                    <View key={i} className={`flex-1 p-3 rounded-xl border items-center justify-center ${podiumDrivers[i] ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20'}`}>
                                        <Text className="text-xs font-bold text-muted-foreground uppercase mb-1">P{i + 1}</Text>
                                        <Text className="text-sm font-black text-foreground">
                                            {podiumDrivers[i]?.name_acronym || '---'}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {isSafetyCar ? (
                            <View className="flex-row justify-between mb-6 gap-4">
                                {(['YES', 'NO'] as const).map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        onPress={() => setSelectedOption(option)}
                                        className={`flex-1 p-4 rounded-xl border items-center justify-center ${selectedOption === option ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20'}`}
                                    >
                                        <Text className="text-lg font-black text-foreground">{option === 'YES' ? 'OUI' : 'NON'}</Text>
                                        {rewardFor(prediction, option) !== null && (
                                            <Text className="text-[10px] font-bold text-muted-foreground mt-1">
                                                {rewardFor(prediction, option)} pts si correct
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <>
                                <Text className="text-sm font-bold text-muted-foreground uppercase mb-3">Choisir un pilote</Text>
                                <ScrollView className="flex-1 mb-4" showsVerticalScrollIndicator={false}>
                                    <View className="flex-row flex-wrap gap-2">
                                        {drivers.map((driver) => {
                                            const isSelected = isPodium
                                                ? podiumDrivers.some(d => d?.driver_number === driver.driver_number)
                                                : selectedDriver?.driver_number === driver.driver_number;
                                            const reward = isPodium ? null : rewardFor(prediction, driver.name_acronym);

                                            return (
                                                <TouchableOpacity
                                                    key={driver.driver_number}
                                                    onPress={() => handleDriverSelect(driver)}
                                                    className={`w-[48%] p-3 rounded-xl border flex-row items-center ${isSelected
                                                            ? 'border-primary bg-primary/10'
                                                            : 'border-border/50 bg-muted/20'
                                                        }`}
                                                >
                                                    <View
                                                        style={{ backgroundColor: `#${driver.team_colour}` }}
                                                        className="w-1.5 h-6 rounded-full mr-2"
                                                    />
                                                    <View className="flex-1">
                                                        <Text className="text-xs text-muted-foreground font-mono">{driver.name_acronym}</Text>
                                                        <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                                                            {driver.full_name.split(' ').pop()}
                                                        </Text>
                                                        {reward !== null && (
                                                            <Text className="text-[10px] font-bold text-muted-foreground">{reward} pts si correct</Text>
                                                        )}
                                                    </View>
                                                    {isPodium && isSelected && (
                                                        <View className="bg-primary px-1.5 rounded">
                                                            <Text className="text-white text-xs font-bold">
                                                                P{podiumDrivers.findIndex(d => d?.driver_number === driver.driver_number) + 1}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </ScrollView>
                            </>
                        )}

                        {/* Récapitulatif : points si correct, et rappel qu'une erreur ne coûte rien */}
                        <View className="mb-4 p-3 rounded-xl bg-muted/30 border border-border/50">
                            <Text className="text-sm font-bold text-foreground">
                                {selectionReward !== null
                                    ? `${selectionReward} points de championnat si correct`
                                    : 'Choisis ta réponse'}
                            </Text>
                            <Text className="text-[11px] text-muted-foreground mt-0.5">
                                Un pronostic incorrect ne coûte rien.
                            </Text>
                        </View>

                        <Button
                            onPress={handleSubmit}
                            disabled={!currentValue() || loading}
                            className="w-full bg-primary h-14 rounded-2xl"
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-lg font-bold">Faire mon prono</Text>
                            )}
                        </Button>
                    </View>
                </View>
            </Modal>

            {/* Modale d'information */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={infoModalVisible}
                onRequestClose={() => setInfoModalVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/60 p-4">
                    <View className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
                        <TouchableOpacity
                            onPress={() => setInfoModalVisible(false)}
                            className="absolute top-4 right-4 z-10 w-8 h-8 items-center justify-center rounded-full bg-white/5"
                        >
                            <X size={18} color="#9ca3af" />
                        </TouchableOpacity>

                        <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mb-4">
                            <HelpCircle size={24} color="#ef4444" />
                        </View>

                        <Text className="text-xl font-black text-white uppercase italic mb-2">
                            {infoContent?.title}
                        </Text>
                        <Text className="text-base text-white/80 leading-relaxed mb-6">
                            {infoContent?.message}
                        </Text>

                        <Button
                            onPress={() => setInfoModalVisible(false)}
                            className="w-full bg-primary rounded-xl h-12"
                        >
                            <Text className="text-white text-sm font-bold uppercase tracking-widest">J'ai compris</Text>
                        </Button>
                    </View>
                </View>
            </Modal>
        </Card>
    );
}
