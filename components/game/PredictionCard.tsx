import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, CheckCircle2, Lock, User, Coins, Trash2, HelpCircle, X } from 'lucide-react-native';
import { Prediction, Pronostic, Driver, placePronostic, updatePronostic, deletePronostic } from '@/lib/api/meetings';
import { useAuth } from '@/context/AuthContext';

interface PredictionCardProps {
    prediction: Prediction;
    initialPronostic: Pronostic | null;
    drivers: Driver[];
    onRefresh: () => void;
}

export function PredictionCard({ prediction, initialPronostic, drivers, onRefresh }: PredictionCardProps) {
    const { refreshProfile } = useAuth();
    const isPodium = prediction.type === 'PODIUM';
    const isSafetyCar = prediction.type === 'SAFETY_CAR';
    const [pickerVisible, setPickerVisible] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [podiumDrivers, setPodiumDrivers] = useState<(Driver | null)[]>([null, null, null]);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [points, setPoints] = useState(initialPronostic?.pointsStaked.toString() || '10');
    const [loading, setLoading] = useState(false);
    const [infoModalVisible, setInfoModalVisible] = useState(false);
    const [infoContent, setInfoContent] = useState<{ title: string, message: string } | null>(null);

    // Sync state when props change (important for refresh after placing a prono)
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
            setPoints(initialPronostic.pointsStaked.toString());
        } else {
            setSelectedDriver(null);
            setPodiumDrivers([null, null, null]);
            setSelectedOption(null);
            setPoints('10');
        }
    }, [initialPronostic, drivers, isPodium, isSafetyCar]);

    const isLocked = new Date(prediction.closesAt).getTime() < Date.now();
    const hasBet = !!initialPronostic;

    const handlePlaceBet = async () => {
        let valueToSubmit: string | undefined;
        if (isPodium) {
            if (podiumDrivers.includes(null)) return;
            valueToSubmit = podiumDrivers.map(d => d?.name_acronym).join(',');
        } else if (isSafetyCar) {
            if (!selectedOption) return;
            valueToSubmit = selectedOption;
        } else {
            if (!selectedDriver) return;
            valueToSubmit = selectedDriver.name_acronym;
        }

        setLoading(true);
        try {
            if (hasBet) {
                await updatePronostic(prediction.id, parseInt(points), valueToSubmit!);
            } else {
                await placePronostic(prediction.id, parseInt(points), valueToSubmit!);
            }
            setPickerVisible(false);
            onRefresh();
            refreshProfile(); // Call refreshProfile after onRefresh
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBet = async () => {
        setLoading(true);
        try {
            await deletePronostic(prediction.id);
            setPickerVisible(false);
            onRefresh();
            refreshProfile();
        } catch (error) {
            console.error(error);
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
        const explanations: Record<string, { title: string, message: string }> = {
            'PODIUM': {
                title: 'Podium',
                message: 'Choisissez les 3 pilotes du podium. Gain de x4 si l\'ordre exact est trouvé, ou x2 si vous avez les 3 bons pilotes dans le désordre.'
            },
            'SAFETY_CAR': {
                title: 'Safety Car',
                message: 'Pronostiquez si la voiture de sécurité (Safety Car) sortira sur la piste pendant la course (Virtual Safety Car non incluse).'
            },
            'DNF': {
                title: 'Abandon (DNF)',
                message: 'Choisissez un pilote qui n\'arrivera pas à terminer la course (abandon, crash ou disqualification).'
            },
            'FASTEST_LAP': {
                title: 'Meilleur Tour',
                message: 'Pronostiquez le pilote qui réalisera le meilleur tour absolu sur l\'ensemble de la course (souvent réalisé dans les derniers tours).'
            }
        };
        const info = explanations[type];
        if (info) {
            setInfoContent(info);
            setInfoModalVisible(true);
        }
    };

    const handleDriverSelect = (driver: Driver) => {
        if (isPodium) {
            if (podiumDrivers.find(d => d?.driver_number === driver.driver_number)) {
                // Remove it
                setPodiumDrivers(prev => prev.map(d => d?.driver_number === driver.driver_number ? null : d));
                return;
            }
            // Add to first available slot
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
                {isLocked ? (
                    <Lock size={20} color="#9ca3af" />
                ) : (
                    <Trophy size={20} color="#ef4444" />
                )}
            </CardHeader>

            <CardContent className="pt-2">
                {hasBet ? (
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
                                            <Text className="text-xs text-muted-foreground font-medium">Votre pronostic</Text>
                                            <Text className="text-base font-bold text-foreground">
                                                {selectedDriver?.full_name || initialPronostic?.detail?.value}
                                            </Text>
                                        </View>
                                    </>
                                )}
                                {isSafetyCar && (
                                    <View>
                                        <Text className="text-xs text-muted-foreground font-medium">Votre pronostic</Text>
                                        <Text className="text-base font-bold text-foreground">
                                            {selectedOption === 'YES' ? 'OUI' : selectedOption === 'NO' ? 'NON' : initialPronostic?.detail?.value}
                                        </Text>
                                    </View>
                                )}
                                {isPodium && (
                                    <View>
                                        <Text className="text-xs text-muted-foreground font-medium mb-1">Votre podium</Text>
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
                                <View className="flex-row items-center bg-primary/20 px-2 py-1 rounded-md mb-1">
                                    <Coins size={14} color="#ef4444" />
                                    <Text className="text-sm font-bold text-primary ml-1">{initialPronostic?.pointsStaked}</Text>
                                </View>
                                <View className="flex-row items-center mt-0.5">
                                    <Text className="text-[10px] text-green-500 font-bold uppercase">+{Math.floor((initialPronostic?.pointsStaked || 0) * (initialPronostic?.detail?.multiplier || 2))} pts</Text>
                                    <Text className="text-[9px] text-muted-foreground font-bold ml-1 uppercase">(x{(initialPronostic?.detail?.multiplier || 2).toFixed(1)})</Text>
                                </View>
                            </View>
                        </View>
                        {!isLocked && (
                            <View className="flex-row gap-2 mt-3">
                                <Button
                                    variant="outline"
                                    onPress={() => setPickerVisible(true)}
                                    className="flex-1 h-8 border-primary/20 bg-transparent"
                                >
                                    <Text className="text-primary text-xs font-bold uppercase">Modifier mon pari</Text>
                                </Button>
                                <Button
                                    variant="outline"
                                    onPress={handleDeleteBet}
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
                        <View className="flex-row justify-between items-center mb-4">
                            <View>
                                <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Cote Standard</Text>
                                <Text className="text-xl font-black text-foreground italic">{isPodium ? 'x4.0' : 'x2.0'}</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider"> Gain Potentiel max</Text>
                                <Text className="text-xl font-black text-green-500 italic">+{parseInt(points) * (isPodium ? 4 : 2)} pts</Text>
                            </View>
                        </View>
                        <Button
                            onPress={() => !isLocked && setPickerVisible(true)}
                            disabled={isLocked}
                            className="w-full bg-foreground h-10"
                        >
                            <Text className="text-background font-bold uppercase tracking-widest text-xs">Parier {points} pts</Text>
                        </Button>
                    </View>
                )}
            </CardContent>

            {/* Picker Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={pickerVisible}
                onRequestClose={() => setPickerVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/60">
                    <View className="bg-card rounded-t-3xl p-6 h-[80%] border-t border-border/50">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-bold text-foreground">{hasBet ? "Modifier le Prono" : "Faire son Prono"}</Text>
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
                                <TouchableOpacity
                                    onPress={() => setSelectedOption('YES')}
                                    className={`flex-1 p-4 rounded-xl border items-center justify-center ${selectedOption === 'YES' ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20'}`}
                                >
                                    <Text className="text-lg font-black text-foreground">OUI</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setSelectedOption('NO')}
                                    className={`flex-1 p-4 rounded-xl border items-center justify-center ${selectedOption === 'NO' ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/20'}`}
                                >
                                    <Text className="text-lg font-black text-foreground">NON</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <Text className="text-sm font-bold text-muted-foreground uppercase mb-3">Choisir un pilote</Text>
                                <ScrollView className="flex-1 mb-6" showsVerticalScrollIndicator={false}>
                                    <View className="flex-row flex-wrap gap-2">
                                        {drivers.map((driver) => {
                                            const isSelected = isPodium
                                                ? podiumDrivers.some(d => d?.driver_number === driver.driver_number)
                                                : selectedDriver?.driver_number === driver.driver_number;

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

                        <View className="mb-6">
                            <Text className="text-sm font-bold text-muted-foreground uppercase mb-3">Mise (Points)</Text>
                            <View className="flex-row items-center gap-4">
                                {['10', '50', '100', '250', '500'].map((p) => (
                                    <TouchableOpacity
                                        key={p}
                                        onPress={() => setPoints(p)}
                                        className={`px-4 py-2 rounded-lg border ${points === p ? 'border-primary bg-primary/10' : 'border-border/50'
                                            }`}
                                    >
                                        <Text className={`font-bold ${points === p ? 'text-primary' : 'text-muted-foreground'}`}>{p}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <Button
                            onPress={handlePlaceBet}
                            disabled={(isPodium ? podiumDrivers.includes(null) : !selectedDriver) || loading}
                            className="w-full bg-primary h-14 rounded-2xl"
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-lg font-bold">Confirmer le Prono</Text>
                            )}
                        </Button>
                    </View>
                </View>
            </Modal>

            {/* Info Modal */}
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
