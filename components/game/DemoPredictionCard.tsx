import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react-native';
import { fetchDrivers, Driver } from '@/lib/api/meetings';
import { useDemo, DEMO_SESSION_KEY, DEMO_REWARD_POINTS } from '@/context/DemoContext';

/**
 * Carte de pronostic du mode démo (replay Monaco 2024). Même modèle que le vrai
 * championnat : aucun montant engagé, une récompense fixe si le pronostic est correct.
 * Les points de la démo sont fictifs et ne sont jamais crédités.
 */
export function DemoPredictionCard() {
    const demo = useDemo();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [selected, setSelected] = useState<Driver | null>(null);

    useEffect(() => {
        if (!demo.active) return;
        fetchDrivers(DEMO_SESSION_KEY).then(setDrivers).catch(() => setDrivers([]));
    }, [demo.active]);

    useEffect(() => {
        if (demo.pick && drivers.length) {
            const d = drivers.find(dr => dr.name_acronym === demo.pick);
            if (d) setSelected(d);
        }
    }, [demo.pick, drivers]);

    if (!demo.active) return null;

    const confirm = () => {
        if (!selected) return;
        demo.placeDemoPick(selected.name_acronym);
        setPickerOpen(false);
    };

    return (
        <Card className="mb-4 border-amber-400/40 bg-card/80 overflow-hidden">
            <View className="h-1 w-full bg-amber-400" />
            <CardHeader className="flex-row items-center justify-between pb-2">
                <View className="flex-1">
                    <CardTitle className="text-lg font-bold uppercase tracking-tight text-foreground">
                        Qui gagnera la course ?
                    </CardTitle>
                    <Text className="text-[10px] text-amber-300 font-bold uppercase mt-1">
                        Démo · Monaco GP 2024
                    </Text>
                </View>
                <Trophy size={20} color="#fbbf24" />
            </CardHeader>

            <CardContent className="pt-2">
                {demo.pick && selected ? (
                    <View className="bg-amber-400/5 border border-amber-400/30 rounded-xl p-3">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <View
                                    style={{ backgroundColor: `#${selected.team_colour}` }}
                                    className="w-1 h-8 rounded-full mr-3"
                                />
                                <View>
                                    <Text className="text-xs text-muted-foreground font-medium">Ton pronostic</Text>
                                    <Text className="text-base font-bold text-foreground">{selected.full_name}</Text>
                                </View>
                            </View>
                            <View className="flex-row items-center bg-amber-400/20 px-2 py-1 rounded-md">
                                <Trophy size={12} color="#fbbf24" />
                                <Text className="text-xs font-bold text-amber-300 ml-1">{DEMO_REWARD_POINTS} pts si correct</Text>
                            </View>
                        </View>
                        <Button
                            variant="outline"
                            onPress={() => setPickerOpen(true)}
                            className="w-full mt-3 h-8 border-amber-400/30 bg-transparent"
                        >
                            <Text className="text-amber-300 text-xs font-bold uppercase">Modifier mon pronostic</Text>
                        </Button>
                    </View>
                ) : (
                    <View className="bg-muted/30 border border-border/50 rounded-xl p-4">
                        <View className="mb-4">
                            <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Points possibles</Text>
                            <Text className="text-base font-black text-foreground">{DEMO_REWARD_POINTS} points si correct (démo)</Text>
                        </View>
                        <Button onPress={() => setPickerOpen(true)} className="w-full bg-foreground h-10">
                            <Text className="text-background font-bold uppercase tracking-widest text-xs">
                                Faire mon prono
                            </Text>
                        </Button>
                    </View>
                )}
            </CardContent>

            <Modal
                animationType="slide"
                transparent
                visible={pickerOpen}
                onRequestClose={() => setPickerOpen(false)}
            >
                <View className="flex-1 justify-end bg-black/60">
                    <View className="bg-card rounded-t-3xl p-6 h-[80%] border-t border-border/50">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-bold text-foreground">Faire son Prono (Démo)</Text>
                            <TouchableOpacity onPress={() => setPickerOpen(false)}>
                                <Text className="text-amber-300 font-bold">Annuler</Text>
                            </TouchableOpacity>
                        </View>
                        <Text className="text-sm font-bold text-muted-foreground uppercase mb-3">Choisir un pilote</Text>
                        <ScrollView className="flex-1 mb-6" showsVerticalScrollIndicator={false}>
                            <View className="flex-row flex-wrap gap-2">
                                {drivers.map(d => (
                                    <TouchableOpacity
                                        key={d.driver_number}
                                        onPress={() => setSelected(d)}
                                        className={`w-[48%] p-3 rounded-xl border flex-row items-center ${
                                            selected?.driver_number === d.driver_number
                                                ? 'border-amber-400 bg-amber-400/10'
                                                : 'border-border/50 bg-muted/20'
                                        }`}
                                    >
                                        <View
                                            style={{ backgroundColor: `#${d.team_colour}` }}
                                            className="w-1.5 h-6 rounded-full mr-2"
                                        />
                                        <View className="flex-1">
                                            <Text className="text-xs text-muted-foreground font-mono">{d.name_acronym}</Text>
                                            <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                                                {d.full_name.split(' ').pop()}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <Button onPress={confirm} disabled={!selected} className="w-full bg-amber-400 h-14 rounded-2xl">
                            <Text className="text-black text-lg font-bold">Faire mon prono</Text>
                        </Button>
                    </View>
                </View>
            </Modal>
        </Card>
    );
}
