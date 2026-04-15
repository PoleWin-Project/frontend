import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, Image, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Zap, Trophy, Timer, Settings2, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { fetchPlaysToday, type PlaysToday } from '@/lib/api/games';

export default function GarageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();
  const [reactionPlays, setReactionPlays] = useState<PlaysToday | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    fetchPlaysToday(accessToken, 'reaction').then(setReactionPlays);
  }, [accessToken]);

  const games = [
    {
      id: 'reaction',
      title: 'Reaction Test',
      subtitle: 'Réveillez le pilote en vous',
      reward: 'Jusqu\'à 10 pts',
      icon: Timer,
      color: '#E10600',
      status: 'Disponible'
    },
    {
      id: 'tyre',
      title: 'Pit Stop Pro',
      subtitle: 'Changement de pneus express',
      reward: 'Jusqu\'à 30 pts',
      icon: Settings2,
      color: '#00D1FF',
      status: 'Bientôt'
    },
    {
      id: 'quiz',
      title: 'Quizz F1',
      subtitle: 'Testez vos connaissances',
      reward: 'Points doublés',
      icon: Trophy,
      color: '#FFD700',
      status: 'Bientôt'
    }
  ];

  const reactionPlaysLeft = reactionPlays
    ? reactionPlays.limit === null ? null : Math.max(0, reactionPlays.limit - reactionPlays.played)
    : undefined; // undefined = chargement

  function handleGamePress(id: string, status: string) {
    if (status !== 'Disponible') return;
    if (id === 'reaction') {
      if (reactionPlaysLeft === 0) return; // bloqué
      router.push('/games/reaction-test');
    }
  }

  return (
    <View className="flex-1 bg-[#050505]">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Immersive Background */}
      <View className="absolute inset-0 opacity-40">
        <Image
          source={require('@/assets/images/hero-bg.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(5, 5, 5, 0.4)', 'rgba(5, 5, 5, 0.9)', '#050505']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </View>

      {/* Content */}
      <View style={{ paddingTop: insets.top }} className="flex-1">
        <View className="px-6 py-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center"
          >
            <Icon as={ChevronLeft} size={20} className="text-white" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-primary font-black text-[10px] uppercase tracking-[3px]">Le Garage</Text>
            <Text className="text-white font-black text-xs uppercase italic">PoleWin Workshop</Text>
          </View>
          <View className="w-10 h-10" />
        </View>

        <ScrollView
          className="flex-1 px-6 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* Welcome Card */}
          <View className="mb-10">
            <Text className="text-white text-4xl font-black italic uppercase leading-none mb-2">
              Besoin de <Text className="text-primary">Boost ?</Text>
            </Text>
            <Text className="text-white/40 text-[11px] font-bold uppercase tracking-wider mb-8">
              Transformez votre réactivité en points de prono.
            </Text>

            <BlurView intensity={30} tint="dark" className="p-6 rounded-[32px] border border-white/10 overflow-hidden">
              <View className="flex-row items-center justify-between mb-4">
                <View className="bg-primary/20 p-2 rounded-xl">
                  <Icon as={ShieldCheck} size={20} className="text-primary" />
                </View>
                <Text className="text-white/30 text-[10px] font-black uppercase">Points Disponibles</Text>
              </View>
              <Text className="text-white text-3xl font-black mb-1">Illimités</Text>
              <Text className="text-white/40 text-[10px]">Jouez pour regonfler votre solde instantanément.</Text>
            </BlurView>
          </View>

          {/* Game Selection */}
          <Text className="text-white/60 text-[11px] font-black uppercase tracking-[2px] mb-4">Unités de Production</Text>

          {games.map((game) => (
            <Pressable
              key={game.id}
              className="mb-6"
              onPress={() => handleGamePress(game.id, game.status)}
              style={{
                shadowColor: game.color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              <View className="overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c0f]">
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.05)', 'rgba(0, 0, 0, 0.4)']}
                  className="p-6"
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }} className='p-3'>
                    <View
                      style={{ backgroundColor: `${game.color}20`, borderColor: `${game.color}40`, width: 56, height: 56 }}
                      className="rounded-2xl items-center justify-center mr-5 border"
                    >
                      <Icon as={game.icon} size={28} color={game.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View className="flex-row items-center mb-1">
                        <Text className="text-white font-black text-lg italic uppercase">{game.title}</Text>
                        {game.status === 'Bientôt' && (
                          <View className="ml-2 px-1.5 py-0.5 bg-white/5 rounded-md border border-white/10">
                            <Text className="text-white/40 text-[8px] font-black uppercase">Soon</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-white/30 text-[10px] font-bold uppercase">{game.subtitle}</Text>
                    </View>
                  </View>

                  <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                    {game.status === 'Disponible' ? (
                      <View className="bg-primary aspect-square w-full rounded-full items-center justify-center shadow-xl shadow-primary/40 mr-3">
                        <Icon as={ArrowRight} size={18} color="white" />
                      </View>
                    ) : (
                      <View className="opacity-20">
                        <Icon as={Zap} size={16} color="white" />
                      </View>
                    )}
                  </View>
                </LinearGradient>

                {/* Bottom Info Bar */}
                <View className="bg-white/[0.03] px-6 py-2.5 border-t border-white/5 flex-row items-center justify-between">
                  <Text style={{ color: game.color }} className="text-[9px] font-black uppercase tracking-wider">{game.reward}</Text>
                  {game.id === 'reaction' && game.status === 'Disponible' ? (
                    reactionPlaysLeft === 0 ? (
                      <Text className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Reviens demain</Text>
                    ) : reactionPlaysLeft != null ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {[...Array(reactionPlays!.limit!)].map((_, i) => (
                          <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i < reactionPlaysLeft ? game.color : 'rgba(255,255,255,0.15)' }} />
                        ))}
                        <Text className="text-white/30 text-[9px] font-bold uppercase" style={{ marginLeft: 4 }}>
                          {reactionPlaysLeft}/3
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-white/20 text-[9px] font-bold uppercase tracking-widest">Temps estimé: 1 min</Text>
                    )
                  ) : (
                    <Text className="text-white/20 text-[9px] font-bold uppercase tracking-widest">Temps estimé: 1 min</Text>
                  )}
                </View>
              </View>
            </Pressable>
          ))}

        </ScrollView>
      </View>
    </View>
  );
}
