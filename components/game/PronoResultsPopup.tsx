import React from 'react';
import {
    View, Modal, StyleSheet, ScrollView, TouchableOpacity, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/text';
import { CheckCircle2, XCircle, Ban, Trophy, Coins, X } from 'lucide-react-native';
import type { Pronostic } from '@/lib/api/meetings';

function formatType(type?: string) {
    if (!type) return 'Prono';
    switch (type) {
        case 'POLE_POSITION': return 'Pole · Qualifs';
        case 'RACE_WINNER':   return 'Vainqueur Course';
        case 'SPRINT_WINNER': return 'Vainqueur Sprint';
        default:              return type.replace(/_/g, ' ');
    }
}

function ResultRow({ prono }: { prono: Pronostic }) {
    const isWon = prono.status === 'won';
    const isLost = prono.status === 'lost';
    const isVoid = prono.status === 'void';
    const prediction = prono.prediction as any;

    const icon = isWon
        ? <CheckCircle2 size={22} color="#22c55e" />
        : isLost
            ? <XCircle size={22} color="#ef4444" />
            : <Ban size={22} color="#9ca3af" />;

    return (
        <View style={s.row}>
            <View style={s.rowIcon}>{icon}</View>
            <View style={s.rowMain}>
                <Text style={s.rowName} numberOfLines={1}>
                    {prono.detail?.value || 'Pilote inconnu'}
                </Text>
                <Text style={s.rowType} numberOfLines={1}>
                    {formatType(prediction?.type)}
                </Text>
            </View>
            <View style={s.rowRight}>
                {isWon && <Text style={[s.rowPts, { color: '#22c55e' }]}>+{prono.pointsEarned}</Text>}
                {isLost && <Text style={[s.rowPts, { color: '#ef4444' }]}>-{prono.pointsStaked}</Text>}
                {isVoid && <Text style={[s.rowPts, { color: '#9ca3af' }]}>+{prono.pointsStaked}</Text>}
                <Text style={s.rowPtsLabel}>
                    {isWon ? 'GAGNÉ' : isLost ? 'PERDU' : 'REMB.'}
                </Text>
            </View>
        </View>
    );
}

export function PronoResultsPopup({
    results,
    visible,
    onClose,
    onSeeAll,
}: {
    results: Pronostic[];
    visible: boolean;
    onClose: () => void;
    onSeeAll?: () => void;
}) {
    const wonCount = results.filter((p) => p.status === 'won').length;
    const net = results.reduce((acc, p) => {
        if (p.status === 'won') return acc + (p.pointsEarned || 0);
        if (p.status === 'lost') return acc - (p.pointsStaked || 0);
        return acc; // void = remboursé, net nul
    }, 0);

    const headerColor = wonCount > 0 ? '#22c55e' : '#ef4444';
    const title = wonCount > 0
        ? (wonCount === results.length ? 'Tout est tombé !' : 'Tes pronos sont tombés !')
        : 'Résultats de tes pronos';
    const subtitle = wonCount > 0
        ? `${wonCount} prono${wonCount > 1 ? 's' : ''} gagné${wonCount > 1 ? 's' : ''} sur ${results.length}`
        : `${results.length} prono${results.length > 1 ? 's' : ''} résolu${results.length > 1 ? 's' : ''}`;

    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
            <Pressable style={s.overlay} onPress={onClose}>
                <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
                    <LinearGradient
                        colors={[headerColor + '22', 'transparent']}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                    />

                    <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                        <X size={18} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={[s.iconCircle, { borderColor: headerColor + '55', shadowColor: headerColor }]}>
                        <Trophy size={32} color={headerColor} />
                    </View>
                    <Text style={s.title}>{title}</Text>
                    <Text style={[s.subtitle, { color: headerColor }]}>{subtitle}</Text>

                    {/* Liste cumulative */}
                    <ScrollView
                        style={s.list}
                        contentContainerStyle={{ gap: 8 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {results.map((p) => <ResultRow key={p.id} prono={p} />)}
                    </ScrollView>

                    {/* Total net */}
                    <View style={s.totalRow}>
                        <View style={s.totalLeft}>
                            <Coins size={16} color="rgba(255,255,255,0.6)" />
                            <Text style={s.totalLabel}>Bilan</Text>
                        </View>
                        <Text style={[s.totalVal, { color: net > 0 ? '#22c55e' : net < 0 ? '#ef4444' : 'rgba(255,255,255,0.8)' }]}>
                            {net > 0 ? '+' : ''}{net} pts
                        </Text>
                    </View>

                    {/* Actions */}
                    <View style={s.actions}>
                        {onSeeAll && (
                            <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={onSeeAll}>
                                <Text style={s.btnGhostText}>Voir mes pronos</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={onClose}>
                            <Text style={s.btnPrimaryText}>Super !</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
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
        overflow: 'hidden',
    },
    closeBtn: {
        position: 'absolute', top: 14, right: 14, zIndex: 2,
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center', justifyContent: 'center',
    },
    iconCircle: {
        width: 72, height: 72, borderRadius: 36, borderWidth: 2,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)', marginTop: 6,
        shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 18,
    },
    title: {
        color: '#fff', fontWeight: '900', fontSize: 21,
        fontStyle: 'italic', textTransform: 'uppercase',
        textAlign: 'center', letterSpacing: 0.5, marginTop: 4,
    },
    subtitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    list: { width: '100%', maxHeight: 260, marginTop: 8 },
    row: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14, padding: 12, gap: 12,
    },
    rowIcon: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center', justifyContent: 'center',
    },
    rowMain: { flex: 1, gap: 2 },
    rowName: { color: '#fff', fontWeight: '700', fontSize: 15 },
    rowType: {
        color: 'rgba(255,255,255,0.4)', fontSize: 10,
        fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5,
    },
    rowRight: { alignItems: 'flex-end' },
    rowPts: { fontWeight: '900', fontSize: 16, fontStyle: 'italic' },
    rowPtsLabel: {
        color: 'rgba(255,255,255,0.3)', fontSize: 9,
        fontWeight: '800', letterSpacing: 1,
    },
    totalRow: {
        width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14,
        paddingVertical: 12, paddingHorizontal: 16, marginTop: 4,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    totalLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    totalLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    totalVal: { fontWeight: '900', fontSize: 18, fontStyle: 'italic' },
    actions: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 6 },
    btn: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
    btnGhost: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    btnGhostText: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 14 },
    btnPrimary: { backgroundColor: '#fff' },
    btnPrimaryText: { color: '#000', fontWeight: '800', fontSize: 14 },
});
