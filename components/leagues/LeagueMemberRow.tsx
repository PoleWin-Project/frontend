import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Crown, UserMinus } from 'lucide-react-native';
import { PilotAvatar } from '@/components/paddock/PilotAvatar';
import { Text } from '@/components/ui/text';
import type { LeagueMember } from '@/lib/api/leagues';

const PODIUM: Record<number, { color: string; label: string }> = {
  1: { color: '#FFD166', label: 'P1' },
  2: { color: '#B6BABD', label: 'P2' },
  3: { color: '#CD7F32', label: 'P3' },
};

export function LeagueMemberRow({
  member,
  index,
  isMe,
  canManage,
  onOpen,
  onRemove,
}: {
  member: LeagueMember;
  index: number;
  isMe: boolean;
  canManage: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const podium = PODIUM[member.rank];
  return (
    <Animated.View entering={FadeInRight.delay(Math.min(index * 55, 440)).springify().damping(16)} style={[styles.row, isMe && styles.meRow]}>
      <View style={[styles.rank, podium && { backgroundColor: `${podium.color}18`, borderColor: `${podium.color}55` }]}>
        <Text style={[styles.rankText, podium && { color: podium.color }]}>{podium?.label ?? member.rank}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Voir le profil de ${member.username}`} onPress={onOpen} style={styles.identity}>
        <PilotAvatar appearance={member.cosmetics} size={44} label={member.username} zoomable={false} />
        <View style={styles.nameWrap}>
          <View style={styles.nameLine}>
            <Text numberOfLines={1} style={styles.name}>{member.username}</Text>
            {member.isOwner ? <Crown size={13} color="#FFD166" fill="#FFD16633" /> : null}
            {isMe ? <Text style={styles.you}>TOI</Text> : null}
          </View>
          <Text style={styles.role}>{member.isOwner ? 'Directeur d’Écurie' : 'Pilote titulaire'}</Text>
        </View>
      </Pressable>
      <View style={styles.score}>
        <Text style={styles.points}>{member.points.toLocaleString()}</Text>
        <Text style={styles.pointsLabel}>PTS</Text>
      </View>
      {canManage && !member.isOwner ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Retirer ${member.username}`} onPress={onRemove} style={styles.remove}>
          <UserMinus size={16} color="#ff6961" />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 78, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d0d10', borderRadius: 19, padding: 12, marginHorizontal: 20, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  meRow: { borderColor: 'rgba(225,6,0,0.5)', backgroundColor: 'rgba(225,6,0,0.07)' },
  rank: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  rankText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: 'Montserrat_Bold_Italic' },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  nameWrap: { flex: 1, marginLeft: 10, minWidth: 0 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { color: '#fff', fontSize: 14, fontWeight: '800', flexShrink: 1 },
  you: { color: '#E10600', fontSize: 8, fontWeight: '900', backgroundColor: 'rgba(225,6,0,0.13)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 },
  role: { color: 'rgba(255,255,255,0.38)', fontSize: 10, fontWeight: '600', marginTop: 3 },
  score: { alignItems: 'flex-end', marginLeft: 8 },
  points: { color: '#fff', fontSize: 15, fontWeight: '900' },
  pointsLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  remove: { width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,80,80,0.09)', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});
