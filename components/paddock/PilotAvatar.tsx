import React, { useState } from 'react';
import { Image, View, Pressable, Modal, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { Text } from '@/components/ui/text';
import { X } from 'lucide-react-native';
import Svg, { Path, Ellipse, Circle } from 'react-native-svg';
import type { Appearance } from '@/lib/api/paddock';

const assets: Record<string, ImageSourcePropType> = {
  'helmet-antonelli': require('../../assets/avatars/Casques/ANTONELLI.png'),
  'helmet-bortoleto': require('../../assets/avatars/Casques/BORTOLETO.png'),
  'helmet-hamilton': require('../../assets/avatars/Casques/HAMILTON.png'),
  'helmet-hulkenberg': require('../../assets/avatars/Casques/HULKENBERG.png'),
  'helmet-leclerc': require('../../assets/avatars/Casques/LECLERC.png'),
  'helmet-norris': require('../../assets/avatars/Casques/NORRIS.png'),
  'helmet-piastri': require('../../assets/avatars/Casques/PIASTRI.png'),
  'helmet-russell': require('../../assets/avatars/Casques/RUSSELL.png'),
  'suit-alpine': require('../../assets/avatars/Tenues/ALPINE.png'),
  'suit-aston': require('../../assets/avatars/Tenues/ASTON.png'),
  'suit-audi': require('../../assets/avatars/Tenues/AUDI.png'),
  'suit-cadillac': require('../../assets/avatars/Tenues/CADILLAC.png'),
  'suit-ferrari': require('../../assets/avatars/Tenues/FERRARI.png'),
  'suit-haas': require('../../assets/avatars/Tenues/HAAS.png'),
  'suit-mcl': require('../../assets/avatars/Tenues/MCL.png'),
  'suit-merc': require('../../assets/avatars/Tenues/MERC.png'),
  'suit-rb': require('../../assets/avatars/Tenues/RB.png'),
  'suit-redbull': require('../../assets/avatars/Tenues/REDBULL.png'),
  'suit-williams': require('../../assets/avatars/Tenues/WILLIAMS.png'),
  'background-audi': require('../../assets/avatars/Fonds/AUDI.png'),
  'background-ferrari': require('../../assets/avatars/Fonds/FERRARI.png'),
  'background-mcl': require('../../assets/avatars/Fonds/MCL.png'),
  'background-merc': require('../../assets/avatars/Fonds/MERC.png'),
};

/** Les illustrations partagent le même canevas : fond, tenue puis casque. */
type AvatarPresentation = 'round' | 'square' | 'driver';

function AvatarArtwork({ appearance, size = 72, presentation = 'round' }: { appearance?: Appearance | null; size?: number; presentation?: AvatarPresentation }) {
  const helmet = assets[appearance?.helmet?.code ?? ''];
  const suit = assets[appearance?.suit?.code ?? ''];
  const background = assets[appearance?.background?.code ?? ''];
  const layer = { position: 'absolute' as const, width: size, height: size, top: 0, left: 0 };
  return (
    <View accessible accessibilityLabel="Avatar de pilote" style={{ width: size, height: size, borderRadius: presentation === 'round' ? size / 2 : 10, overflow: 'hidden', backgroundColor: presentation === 'driver' ? 'transparent' : '#111820' }}>
      {presentation !== 'driver' && (background ? <Image source={background} style={layer} resizeMode="contain" /> : (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={layer}>
          <Circle cx="50" cy="50" r="46" fill="#202e3b" />
          <Path d="M0 85L85 0H100L15 100H0Z" fill="#293b49" />
        </Svg>
      ))}
      {/* Un seul rendu par emplacement. Les clés démontent aussi l'ancien
          composant natif lors d'un changement d'équipement. */}
      <View key={`suit:${appearance?.suit?.code ?? 'base'}`} style={layer}>
      {suit ? <Image source={suit} style={layer} resizeMode="contain" /> : (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={layer}>
          <Path d="M10 100L13 77Q17 69 37 63L40 55H60L63 63Q83 69 87 77L90 100Z" fill="#3d4a56" stroke="#080d12" strokeWidth="2" />
          {/* Col textile bas : l'ancien plastron gris ressemblait à une
              seconde mentonnière sous les casques importés. */}
          <Path d="M40 55H60L62 61Q50 66 38 61Z" fill="#17212b" stroke="#080d12" strokeWidth="1.5" />
          <Path d="M23 73L20 97M77 73L80 97" stroke="#00B4D8" strokeWidth="3" />
          <Path d="M50 65V100" stroke="#17212b" strokeWidth="2" />
        </Svg>
      )}
      </View>
      <View key={`helmet:${appearance?.helmet?.code ?? 'base'}`} style={layer}>
      {helmet ? <Image source={helmet} style={layer} resizeMode="contain" /> : (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={layer}>
          <Path d="M29 31Q29 12 50 12Q71 12 71 31L70 47L64 56Q50 60 36 56L30 47Z" fill="#d8e1e7" stroke="#080d12" strokeWidth="2" />
          <Path d="M29 30Q50 25 71 30L68 41Q50 46 32 41Z" fill="#13202b" stroke="#080d12" strokeWidth="2" />
          <Path d="M34 32Q50 29 66 32" fill="none" stroke="#537f94" strokeWidth="2" />
          <Path d="M47 13H53V26H47Z" fill="#00B4D8" />
          <Ellipse cx="50" cy="52" rx="8" ry="2" fill="#243443" />
        </Svg>
      )}
      </View>
      {presentation !== 'driver' && appearance?.frame?.color && <View pointerEvents="none" style={{ ...layer, borderWidth: Math.max(2, size * 0.035), borderColor: appearance.frame.color, borderRadius: presentation === 'round' ? size / 2 : 10 }} />}
    </View>
  );
}


export function PilotAvatar({ appearance, size = 72, label = 'Avatar de pilote', zoomable = true, presentation = 'round' }: {
  appearance?: Appearance | null; size?: number; label?: string; zoomable?: boolean; presentation?: AvatarPresentation;
}) {
  const [open, setOpen] = useState(false);
  const { width, height } = useWindowDimensions();
  const expandedSize = Math.max(100, Math.min(width - 80, height - 220, 360));
  if (!zoomable) return <AvatarArtwork appearance={appearance} size={size} presentation={presentation} />;
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`Agrandir : ${label}`} accessibilityHint="Ouvre l’avatar en grand"
        onPress={event => { event.stopPropagation(); setOpen(true); }}
        style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
        <AvatarArtwork appearance={appearance} size={size} presentation={presentation} />
      </Pressable>
      {open && <Modal visible transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable accessible={false} onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: '#000000e8', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View accessibilityViewIsModal style={{ alignItems: 'center', gap: 20 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Fermer l’avatar" onPress={() => setOpen(false)}
              style={{ alignSelf: 'flex-end', width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff15', alignItems: 'center', justifyContent: 'center' }}>
              <X color="white" size={22} />
            </Pressable>
            <AvatarArtwork appearance={appearance} size={expandedSize} />
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '700', textAlign: 'center' }}>{label}</Text>
            {appearance?.title && <Text style={{ color: '#83ced0', textAlign: 'center' }}>{appearance.title.name}</Text>}
          </View>
        </Pressable>
      </Modal>}
    </>
  );
}
