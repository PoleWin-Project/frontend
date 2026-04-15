import React from 'react';
import { View, Pressable, ImageBackground } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useRouter } from 'expo-router';
import { Fuel, ChevronRight, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function PitStopWidget() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/garage')}
      className="mb-8"
      style={{
        shadowColor: '#E10600',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
      }}
    >
      <View className="overflow-hidden rounded-3xl border border-primary/30">
        <LinearGradient
          colors={['#1a1a1e', '#0B0B0D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-5"
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} className="p-3">
            <View
              className="w-12 h-12 rounded-2xl bg-primary items-center justify-center mr-4"
              style={{ shadowColor: '#E10600', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}
            >
              <Icon as={Fuel} size={24} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <View className="flex-row items-center mb-1">
                <Text style={{ color: '#E10600', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Refuel Center</Text>

              </View>
              <Text className="text-white font-black text-lg italic uppercase">Entrer aux stands</Text>
              <Text className="text-white/40 text-[10px] font-bold">Gagnez des points via les mini-jeux</Text>
            </View>
          </View>

          <View className="bg-white/5 p-2 rounded-full border border-white/10 mr-3">
            <Icon as={ChevronRight} size={20} className="text-white/40" />
          </View>
        </LinearGradient>

      </View>
    </Pressable>
  );
}
