import React, { useState } from 'react';
import {
    View, Image, TouchableOpacity, Modal, StyleSheet,
    FlatList, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/text';
import { Shield, Lock, CheckCircle, X } from 'lucide-react-native';
import type { Badge, UserBadge, BadgeRarity } from '@/lib/api/badges';
import { API_ROOT as BASE_URL } from '@/lib/config';

// ─── Rarity config ────────────────────────────────────────────────────────────
const RARITY: Record<BadgeRarity, { label: string; color: string; glow: string }> = {
    common:    { label: 'Commun',      color: '#9E9E9E', glow: '#9E9E9E22' },
    uncommon:  { label: 'Peu Commun',  color: '#57C785', glow: '#57C78522' },
    rare:      { label: 'Rare',        color: '#4A9EFF', glow: '#4A9EFF22' },
    epic:      { label: 'Épique',      color: '#B76FFF', glow: '#B76FFF22' },
    legendary: { label: 'Légendaire',  color: '#FFD700', glow: '#FFD70022' },
};
const RARITY_ORDER: BadgeRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

function rarityConfig(rarity: BadgeRarity | null | undefined) {
    return rarity ? (RARITY[rarity] ?? RARITY.common) : RARITY.common;
}

function badgeImageUri(imageUrl: string | null) {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${BASE_URL}${imageUrl}`;
}

function awardedDateStr(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
    });
}

// ─── Detail modal ─────────────────────────────────────────────────────────────
function BadgeModal({
    badge,
    userBadge,
    visible,
    onClose,
}: {
    badge: Badge;
    userBadge: UserBadge | null;
    visible: boolean;
    onClose: () => void;
}) {
    const rc = rarityConfig(badge.rarity);
    const uri = badgeImageUri(badge.imageUrl);
    const earned = !!userBadge;

    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
            <Pressable style={m.overlay} onPress={onClose}>
                <Pressable style={m.sheet} onPress={e => e.stopPropagation()}>
                    <LinearGradient
                        colors={[earned ? rc.glow : '#ffffff0a', 'transparent']}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                    />

                    <TouchableOpacity style={m.closeBtn} onPress={onClose}>
                        <X size={18} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>

                    {/* Image */}
                    <View style={[
                        m.imgWrap,
                        { borderColor: earned ? rc.color + '55' : 'rgba(255,255,255,0.08)', shadowColor: rc.color },
                        !earned && m.imgWrapLocked,
                    ]}>
                        {uri ? (
                            <Image
                                source={{ uri }}
                                style={[m.imgLarge, !earned && m.imgLocked]}
                                resizeMode="contain"
                            />
                        ) : (
                            <Shield size={56} color={earned ? rc.color : 'rgba(255,255,255,0.15)'} />
                        )}
                        {!earned && (
                            <View style={m.lockOverlay}>
                                <Lock size={22} color="rgba(255,255,255,0.7)" />
                            </View>
                        )}
                    </View>

                    {/* Rarity */}
                    <View style={[m.rarityPill, { backgroundColor: rc.color + '20', borderColor: rc.color + '50' }]}>
                        <View style={[m.rarityDot, { backgroundColor: rc.color }]} />
                        <Text style={[m.rarityLabel, { color: rc.color }]}>{rc.label.toUpperCase()}</Text>
                    </View>

                    <Text style={[m.badgeName, !earned && m.textMuted]}>{badge.name}</Text>

                    {/* Status */}
                    {earned ? (
                        <View style={m.earnedRow}>
                            <CheckCircle size={14} color="#57C785" />
                            <Text style={m.earnedText}>Obtenu le {awardedDateStr(userBadge!.awardedAt)}</Text>
                        </View>
                    ) : (
                        <View style={m.lockedRow}>
                            <Lock size={13} color="rgba(255,255,255,0.3)" />
                            <Text style={m.lockedText}>Badge non débloqué</Text>
                        </View>
                    )}

                    {/* Description / prérequis */}
                    {badge.description && (
                        <View style={m.prereqBox}>
                            <Text style={m.prereqTitle}>
                                {earned ? 'CONDITION' : 'COMMENT L\'OBTENIR'}
                            </Text>
                            <Text style={m.prereqText}>{badge.description}</Text>
                        </View>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// ─── Hero tile (large preview) ────────────────────────────────────────────────
export function BadgeTileHero({
    badge,
    userBadge,
}: {
    badge: Badge;
    userBadge: UserBadge | null;
}) {
    const [open, setOpen] = useState(false);
    const rc = rarityConfig(badge.rarity);
    const uri = badgeImageUri(badge.imageUrl);
    const earned = !!userBadge;

    return (
        <>
            <TouchableOpacity
                style={[h.tile, { borderColor: earned ? rc.color + '55' : 'rgba(255,255,255,0.12)' }]}
                onPress={() => setOpen(true)}
                activeOpacity={0.8}
            >
                {/* Full image */}
                {uri ? (
                    <Image
                        source={{ uri }}
                        style={[h.img, !earned && h.imgLocked]}
                        resizeMode="contain"
                    />
                ) : (
                    <View style={h.iconCenter}>
                        <Shield size={64} color={earned ? rc.color : 'rgba(255,255,255,0.15)'} />
                    </View>
                )}

                {/* Rarity glow at top */}
                {earned && (
                    <LinearGradient
                        colors={[rc.glow, 'transparent']}
                        style={[StyleSheet.absoluteFillObject, { height: '50%' }]}
                        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                        pointerEvents="none"
                    />
                )}

                {/* Lock icon centered */}
                {!earned && (
                    <View style={h.lockCenter}>
                        <View style={h.lockCircle}>
                            <Lock size={20} color="rgba(255,255,255,0.8)" />
                        </View>
                    </View>
                )}

                {/* Bottom info overlay */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.92)']}
                    style={h.bottomOverlay}
                    start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                    pointerEvents="none"
                >
                    <View style={h.rarityRow}>
                        <View style={[h.rarityDot, { backgroundColor: rc.color }]} />
                        <Text style={[h.rarityLabel, { color: rc.color }]}>{rc.label.toUpperCase()}</Text>
                    </View>
                    <Text style={[h.name, !earned && h.nameLocked]} numberOfLines={2}>
                        {badge.name}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>

            <BadgeModal
                badge={badge}
                userBadge={userBadge}
                visible={open}
                onClose={() => setOpen(false)}
            />
        </>
    );
}

// ─── Single tile ──────────────────────────────────────────────────────────────
export function BadgeTile({
    badge,
    userBadge,
}: {
    badge: Badge;
    userBadge: UserBadge | null;
}) {
    const [open, setOpen] = useState(false);
    const rc = rarityConfig(badge.rarity);
    const uri = badgeImageUri(badge.imageUrl);
    const earned = !!userBadge;

    return (
        <>
            <TouchableOpacity
                style={[t.tile, { borderColor: earned ? rc.color + '55' : 'rgba(255,255,255,0.07)' }]}
                onPress={() => setOpen(true)}
                activeOpacity={0.75}
            >
                {earned && (
                    <LinearGradient
                        colors={[rc.glow, 'transparent']}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                    />
                )}

                {/* Image */}
                <View style={[
                    t.imgWrap,
                    { borderColor: earned ? rc.color + '33' : 'rgba(255,255,255,0.06)' },
                    !earned && t.imgWrapLocked,
                ]}>
                    {uri ? (
                        <Image
                            source={{ uri }}
                            style={[t.img, !earned && t.imgLocked]}
                            resizeMode="contain"
                        />
                    ) : (
                        <Shield size={26} color={earned ? rc.color : 'rgba(255,255,255,0.12)'} />
                    )}
                    {!earned && (
                        <View style={t.lockOverlay}>
                            <Lock size={12} color="rgba(255,255,255,0.5)" />
                        </View>
                    )}
                </View>

                <Text style={[t.name, !earned && t.nameLocked]} numberOfLines={2}>
                    {badge.name}
                </Text>

                {/* Rarity dot */}
                <View style={[t.dot, { backgroundColor: earned ? rc.color : 'rgba(255,255,255,0.15)' }]} />
            </TouchableOpacity>

            <BadgeModal
                badge={badge}
                userBadge={userBadge}
                visible={open}
                onClose={() => setOpen(false)}
            />
        </>
    );
}

// ─── Exported catalog ─────────────────────────────────────────────────────────

/**
 * Affiche le catalogue complet de badges.
 * - allBadges : tous les badges du système
 * - userBadges : les badges obtenus par l'utilisateur affiché
 */
export function BadgeCatalog({
    allBadges,
    userBadges,
}: {
    allBadges: Badge[];
    userBadges: UserBadge[];
}) {
    const earnedMap = new Map(userBadges.map(ub => [ub.badgeId, ub]));

    // Earned first, then locked; within each group, order by rarity desc
    const sorted = [...allBadges].sort((a, b) => {
        const aEarned = earnedMap.has(a.id) ? 0 : 1;
        const bEarned = earnedMap.has(b.id) ? 0 : 1;
        if (aEarned !== bEarned) return aEarned - bEarned;
        const aRank = RARITY_ORDER.indexOf(a.rarity as BadgeRarity);
        const bRank = RARITY_ORDER.indexOf(b.rarity as BadgeRarity);
        return aRank - bRank;
    });

    const earnedCount = userBadges.length;

    if (allBadges.length === 0) {
        return (
            <View style={g.empty}>
                <Shield size={28} color="rgba(255,255,255,0.12)" />
                <Text style={g.emptyText}>Aucun badge disponible</Text>
            </View>
        );
    }

    return (
        <View style={g.wrap}>
            <Text style={g.counter}>
                <Text style={g.counterVal}>{earnedCount}</Text>
                <Text style={g.counterOf}> / {allBadges.length} obtenus</Text>
            </Text>

            <FlatList
                data={sorted}
                keyExtractor={item => String(item.id)}
                numColumns={3}
                scrollEnabled={false}
                columnWrapperStyle={g.row}
                contentContainerStyle={g.list}
                renderItem={({ item }) => (
                    <BadgeTile
                        badge={item}
                        userBadge={earnedMap.get(item.id) ?? null}
                    />
                )}
            />
        </View>
    );
}

/** Ancien composant conservé pour compatibilité (profil sans catalogue complet) */
export function BadgeGrid({ userBadges }: { userBadges: UserBadge[] }) {
    if (userBadges.length === 0) {
        return (
            <View style={g.empty}>
                <Shield size={28} color="rgba(255,255,255,0.12)" />
                <Text style={g.emptyText}>Aucun badge pour l'instant</Text>
            </View>
        );
    }
    const allBadges = userBadges.map(ub => ub.badge);
    return (
        <BadgeCatalog allBadges={allBadges} userBadges={userBadges} />
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const TILE_SIZE = 104;

const t = StyleSheet.create({
    tile: {
        width: TILE_SIZE, alignItems: 'center', gap: 6,
        backgroundColor: '#0c0c0f',
        borderWidth: 1, borderRadius: 16,
        paddingVertical: 14, paddingHorizontal: 6,
        overflow: 'hidden',
    },
    imgWrap: {
        width: 54, height: 54, borderRadius: 27,
        borderWidth: 1.5,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        position: 'relative',
    },
    img:          { width: 42, height: 42 },
    imgLocked:    { opacity: 0.55 },
    imgWrapLocked: { backgroundColor: 'rgba(0,0,0,0.3)' },
    lockOverlay: {
        position: 'absolute', bottom: -2, right: -2,
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: '#1a1a1e',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center', justifyContent: 'center',
    },
    name:       { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700', textAlign: 'center', lineHeight: 13 },
    nameLocked: { color: 'rgba(255,255,255,0.25)' },
    dot:        { width: 5, height: 5, borderRadius: 3 },
});

const g = StyleSheet.create({
    wrap:       { gap: 10 },
    counter:    { textAlign: 'center' },
    counterVal: { color: '#fff', fontWeight: '900', fontSize: 15, fontStyle: 'italic' },
    counterOf:  { color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' },
    list:       { gap: 8 },
    row:        { gap: 8, justifyContent: 'flex-start' },
    empty:      { alignItems: 'center', gap: 8, paddingVertical: 16 },
    emptyText:  { color: 'rgba(255,255,255,0.2)', fontSize: 13, fontStyle: 'italic' },
});

const m = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.82)',
        alignItems: 'center', justifyContent: 'center', padding: 32,
    },
    sheet: {
        width: '100%', backgroundColor: '#111114',
        borderRadius: 28, padding: 28, alignItems: 'center', gap: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    closeBtn: {
        position: 'absolute', top: 16, right: 16,
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center', justifyContent: 'center',
    },
    imgWrap: {
        width: 110, height: 110, borderRadius: 55,
        borderWidth: 2,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20,
        marginTop: 8, position: 'relative',
    },
    imgWrapLocked: { shadowOpacity: 0 },
    imgLarge:  { width: 90, height: 90 },
    imgLocked: { opacity: 0.5 },
    lockOverlay: {
        position: 'absolute', bottom: 0, right: 0,
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#1a1a1e',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center', justifyContent: 'center',
    },
    rarityPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: 20, borderWidth: 1,
    },
    rarityDot:   { width: 6, height: 6, borderRadius: 3 },
    rarityLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
    badgeName: {
        color: '#fff', fontWeight: '900', fontSize: 20,
        fontStyle: 'italic', textAlign: 'center',
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    textMuted: { color: 'rgba(255,255,255,0.3)' },
    earnedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    earnedText: { color: '#57C785', fontSize: 12, fontWeight: '700' },
    lockedRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
    lockedText: { color: 'rgba(255,255,255,0.25)', fontSize: 12, fontWeight: '600', fontStyle: 'italic' },
    prereqBox: {
        width: '100%', backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14, padding: 14, gap: 6,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        marginTop: 4,
    },
    prereqTitle: {
        color: 'rgba(255,255,255,0.25)', fontSize: 9,
        fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase',
    },
    prereqText: {
        color: 'rgba(255,255,255,0.65)', fontSize: 13,
        lineHeight: 19, fontStyle: 'italic',
    },
    awardedAt: { color: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: '600', marginTop: 4 },
});

const HERO_SIZE = 160;

const h = StyleSheet.create({
    tile: {
        width: HERO_SIZE, height: HERO_SIZE,
        backgroundColor: '#0c0c0f',
        borderWidth: 1, borderRadius: 20,
        overflow: 'hidden',
    },
    img:       { position: 'absolute', top: 0, left: 0, width: HERO_SIZE, height: HERO_SIZE },
    imgLocked: { opacity: 0.55 },
    iconCenter: {
        position: 'absolute', top: 0, left: 0, width: HERO_SIZE, height: HERO_SIZE,
        alignItems: 'center', justifyContent: 'center',
    },
    lockCenter: {
        position: 'absolute', top: 0, left: 0, width: HERO_SIZE, height: HERO_SIZE,
        alignItems: 'center', justifyContent: 'center',
    },
    lockCircle: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    bottomOverlay: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 11, paddingBottom: 11, paddingTop: 36,
        gap: 3,
    },
    rarityRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    rarityDot:   { width: 6, height: 6, borderRadius: 3 },
    rarityLabel: {
        fontSize: 9, fontWeight: '800', letterSpacing: 2,
        textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
    },
    name: {
        color: '#fff', fontSize: 13, fontWeight: '900',
        fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 0.4, lineHeight: 16,
        textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
    },
    nameLocked: { color: 'rgba(255,255,255,0.5)' },
});