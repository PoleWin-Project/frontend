import React, { useEffect, useState } from 'react';
import { View, Modal, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from '@/components/ui/text';
import { Award, Flag, Trophy, Wrench } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const SEEN_KEY = '@polewin/seasonLaunchNoticeSeen';

/**
 * Annonce affichée UNE seule fois aux joueurs présents pendant la Saison Bêta,
 * après le passage au championnat sans mise :
 *  - leur résultat de la Saison Bêta (archivé) et le badge Pionnier du Paddock ;
 *  - les jetons Paddock reçus (cosmétiques) ;
 *  - les nouvelles règles : un bon pronostic rapporte des points, une erreur ne coûte rien.
 *
 * À monter une seule fois, à côté de PronoResultsNotifier.
 */
export function SeasonLaunchNotice() {
    const { user } = useAuth();
    const [visible, setVisible] = useState(false);

    const concerned = !!user && (user.isPioneer || !!user.betaSeason);

    useEffect(() => {
        if (!concerned) return;
        AsyncStorage.getItem(SEEN_KEY)
            .then((seen) => { if (!seen) setVisible(true); })
            .catch(() => undefined);
    }, [concerned]);

    const close = () => {
        setVisible(false);
        AsyncStorage.setItem(SEEN_KEY, '1').catch(() => undefined);
    };

    if (!visible || !user) return null;

    const season = user.championshipSeason?.name ?? 'la nouvelle saison';

    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={close}>
            <Pressable style={s.overlay} onPress={close}>
                <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
                    <View style={s.iconCircle}>
                        <Flag size={30} color="#E10600" />
                    </View>
                    <Text style={s.title}>Le championnat est lancé !</Text>
                    <Text style={s.subtitle}>La Saison Bêta est terminée — merci d’avoir été là.</Text>

                    {user.betaSeason && (
                        <Row
                            icon={<Trophy size={18} color="#FFD700" />}
                            text={`Saison Bêta : ${user.betaSeason.rank}ᵉ sur ${user.betaSeason.participants}. Ton résultat reste visible sur ton profil.`}
                        />
                    )}
                    {user.isPioneer && (
                        <Row
                            icon={<Award size={18} color="#FFD700" />}
                            text="Tu reçois le badge Pionnier du Paddock."
                        />
                    )}
                    {(user.garageCredits ?? 0) > 0 && (
                        <Row
                            icon={<Wrench size={18} color="#00B4D8" />}
                            text={`${user.garageCredits} jetons Paddock offerts, pour personnaliser ton profil.`}
                        />
                    )}
                    <Row
                        icon={<Flag size={18} color="#E10600" />}
                        text={`${season} : tout le monde repart à 0. Chaque bon pronostic rapporte des points de championnat, une erreur ne coûte rien.`}
                    />

                    <TouchableOpacity style={s.btn} onPress={close}>
                        <Text style={s.btnText}>C’est parti !</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <View style={s.row}>
            <View style={s.rowIcon}>{icon}</View>
            <Text style={s.rowText}>{text}</Text>
        </View>
    );
}

const s = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.82)',
        alignItems: 'center', justifyContent: 'center', padding: 28,
    },
    sheet: {
        width: '100%', maxWidth: 420, backgroundColor: '#111114',
        borderRadius: 28, padding: 24, alignItems: 'center', gap: 10,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    iconCircle: {
        width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: 'rgba(225,6,0,0.4)',
        alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)',
    },
    title: {
        color: '#fff', fontWeight: '900', fontSize: 21, fontStyle: 'italic',
        textTransform: 'uppercase', textAlign: 'center',
    },
    subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', marginBottom: 4 },
    row: {
        width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    rowIcon: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center', justifyContent: 'center',
    },
    rowText: { flex: 1, color: '#fff', fontSize: 13, lineHeight: 18 },
    btn: {
        width: '100%', backgroundColor: '#fff', borderRadius: 14,
        paddingVertical: 13, alignItems: 'center', marginTop: 6,
    },
    btnText: { color: '#000', fontWeight: '800', fontSize: 14 },
});
