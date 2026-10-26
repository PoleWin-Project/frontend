import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Check, ChevronRight, Database, Gauge, Radio, Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/text';
import { PilotAvatar } from './PilotAvatar';
import type { Appearance, PaddockItem } from '@/lib/api/paddock';

export const KIND_LABELS = { helmet: 'Casque', suit: 'Tenue', background: 'Fond', frame: 'Cadre', title: 'Titre' };

export function PaddockShopItem({ item, appearance, balance, enabled, busy, width, onAction }: {
  item: PaddockItem; appearance: Appearance; balance: number; enabled: boolean;
  busy: string | null; width: number; onAction: (item: PaddockItem) => void;
}) {
  const affordable = balance >= item.price;
  const disabled = busy !== null || (!item.owned && (!enabled || !affordable));
  const preview: Appearance = { ...appearance, [item.kind]: { code: item.code, name: item.name, color: item.color } };
  const TitleIcon = item.code === 'title-strategist' ? Radio : item.code === 'title-late-braker' ? Gauge : Trophy;
  const action = item.owned ? item.equipped ? 'Retirer' : 'Équiper' : `${item.price} jetons`;
  const compact = width < 175;
  return (
    <LinearGradient colors={['#1c2226', '#0c1013']} style={[styles.card, { width }, item.equipped && styles.equipped]}>
      <View style={[styles.product, compact && styles.productCompact]}>
        <View style={styles.preview}>
          {item.kind === 'title' ? <TitleIcon size={44} strokeWidth={1.7} color="#f5c75d" />
            : <PilotAvatar appearance={preview} size={compact ? 88 : 76} label={item.name} presentation="square" />}
        </View>
        <View style={styles.description}>
          <Text style={styles.kind}>{KIND_LABELS[item.kind].toUpperCase()}</Text>
          <Text style={styles.name}>{item.name}</Text>
        </View>
      </View>
      {item.equipped && <View style={styles.equippedLabel}><Check size={12} color="#d3ebd7" /><Text style={styles.equippedText}>Équipé</Text></View>}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.owned ? action : `Acheter pour ${item.price} jetons`} : ${item.name}`}
        accessibilityHint={!item.owned && !affordable ? `Il te manque ${item.price - balance} jetons.` : undefined}
        accessibilityState={{ disabled, busy: busy === item.code }} disabled={disabled} onPress={() => onAction(item)}
        style={[styles.action, disabled && styles.disabled]}>
        {busy === item.code ? <ActivityIndicator color="#ff2536" /> : <>
          {!item.owned && <Database color={affordable && enabled ? '#ff2536' : '#9c5c62'} size={20} />}
          <Text style={[styles.price, disabled && styles.disabledText]}>{action}</Text>
          <ChevronRight size={16} color={disabled ? '#80858c' : '#f4f4f5'} />
        </>}
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: '#444b50', borderRadius: 10, padding: 10, minHeight: 150 },
  equipped: { borderColor: '#819b88' },
  product: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  productCompact: { flexDirection: 'column', alignItems: 'flex-start' },
  preview: { alignItems: 'center', justifyContent: 'center', minWidth: 76, minHeight: 76, borderRadius: 10, backgroundColor: '#090c0e' },
  description: { flex: 1 },
  kind: { color: '#b2b8bc', fontSize: 9, letterSpacing: 1, marginBottom: 4 },
  name: { color: '#fff', fontFamily: 'Inter_Bold', fontSize: 14, lineHeight: 19 },
  equippedLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  equippedText: { color: '#d3ebd7', fontSize: 10 },
  action: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, borderTopWidth: 1, borderTopColor: '#ffffff10' },
  price: { flex: 1, color: '#fff', fontFamily: 'Inter_SemiBold', fontSize: 13 },
  disabled: { opacity: 0.85 },
  disabledText: { color: '#aeb4ba' },
});
