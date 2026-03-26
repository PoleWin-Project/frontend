import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, CheckCircle2, Lock, User, Coins } from 'lucide-react-native';
import { Prediction, Pronostic, Driver, placePronostic, updatePronostic } from '@/lib/api/meetings';
import { useAuth } from '@/context/AuthContext';

interface PredictionCardProps {
    prediction: Prediction;
    initialPronostic: Pronostic | null;
    drivers: Driver[];
    onRefresh: () => void;
}

export function PredictionCard({ prediction, initialPronostic, drivers, onRefresh }: PredictionCardProps) {
    const { refreshProfile } = useAuth();
    const [pickerVisible, setPickerVisible] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(
        initialPronostic ? drivers.find(d => d.name_acronym === initialPronostic.detail?.value) || null : null
    );
    const [points, setPoints] = useState(initialPronostic?.pointsStaked.toString() || '10');
    const [loading, setLoading] = useState(false);

    // Sync state when props change (important for refresh after placing a prono)
    React.useEffect(() => {
        if (initialPronostic) {
            const driver = drivers.find(d => d.name_acronym === initialPronostic.detail?.value);
            if (driver) setSelectedDriver(driver);
            setPoints(initialPronostic.pointsStaked.toString());
        } else {
            setSelectedDriver(null);
            setPoints('10');
        }
    }, [initialPronostic, drivers]);

    const isLocked = new Date(prediction.closesAt).getTime() < Date.now();
    const hasBet = !!initialPronostic;

    const handlePlaceBet = async () => {
        if (!selectedDriver) return;
        setLoading(true);
        try {
            if (hasBet) {
                await updatePronostic(prediction.id, parseInt(points), selectedDriver.name_acronym);
            } else {
                await placePronostic(prediction.id, parseInt(points), selectedDriver.name_acronym);
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

    const formatType = (type: string) => {
        return type.replace(/_/g, ' ');
    };

    return (
        <Card className="mb-4 border-border/40 shadow-sm bg-card/80 overflow-hidden">
            <View className={`h-1 w-full ${isLocked ? 'bg-muted' : 'bg-primary'}`} />
            <CardHeader className="flex-row items-center justify-between pb-2">
                <View className="flex-1">
                    <CardTitle className="text-lg font-bold uppercase tracking-tight text-foreground">
                        {formatType(prediction.type)}
                    </CardTitle>
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
                            <View className="flex-row items-center">
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
                            </View>
                            <View className="items-end">
                                <View className="flex-row items-center bg-primary/20 px-2 py-1 rounded-md mb-1">
                                    <Coins size={14} color="#ef4444" />
                                    <Text className="text-sm font-bold text-primary ml-1">{initialPronostic?.pointsStaked}</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <Text className="text-[10px] text-green-500 font-bold uppercase">Gain : +{Math.floor((initialPronostic?.pointsStaked || 0) * (initialPronostic?.detail?.multiplier || 2))}</Text>
                                    <Text className="text-[10px] text-muted-foreground font-bold ml-1 uppercase">pts (x{(initialPronostic?.detail?.multiplier || 2).toFixed(1)})</Text>
                                </View>
                            </View>
                        </View>
                        {!isLocked && (
                            <Button 
                                variant="outline" 
                                onPress={() => setPickerVisible(true)}
                                className="w-full mt-3 h-8 border-primary/20 bg-transparent"
                            >
                                <Text className="text-primary text-xs font-bold uppercase">Modifier mon pari</Text>
                            </Button>
                        )}
                    </View>
                ) : (
                    <View className="bg-muted/30 border border-border/50 rounded-xl p-4">
                        <View className="flex-row justify-between items-center mb-4">
                            <View>
                                <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Cote Standard</Text>
                                <Text className="text-xl font-black text-foreground italic">x2.0</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Gain Potentiel</Text>
                                <Text className="text-xl font-black text-green-500 italic">+{parseInt(points) * 2} pts</Text>
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

                        <Text className="text-sm font-bold text-muted-foreground uppercase mb-3">Choisir un pilote</Text>
                        <ScrollView className="flex-1 mb-6" showsVerticalScrollIndicator={false}>
                            <View className="flex-row flex-wrap gap-2">
                                {drivers.map((driver) => (
                                    <TouchableOpacity
                                        key={driver.driver_number}
                                        onPress={() => setSelectedDriver(driver)}
                                        className={`w-[48%] p-3 rounded-xl border flex-row items-center ${
                                            selectedDriver?.driver_number === driver.driver_number
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
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <View className="mb-6">
                            <Text className="text-sm font-bold text-muted-foreground uppercase mb-3">Mise (Points)</Text>
                            <View className="flex-row items-center gap-4">
                                {['10', '50', '100', '250', '500'].map((p) => (
                                    <TouchableOpacity
                                        key={p}
                                        onPress={() => setPoints(p)}
                                        className={`px-4 py-2 rounded-lg border ${
                                            points === p ? 'border-primary bg-primary/10' : 'border-border/50'
                                        }`}
                                    >
                                        <Text className={`font-bold ${points === p ? 'text-primary' : 'text-muted-foreground'}`}>{p}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <Button 
                            onPress={handlePlaceBet} 
                            disabled={!selectedDriver || loading}
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
        </Card>
    );
}
