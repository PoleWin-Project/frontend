import React, { useState } from 'react';
import { View, ScrollView, Pressable, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getLatestSessionTeams, getLatestSessionDrivers, type OpenF1Team, type OpenF1Driver } from '@/lib/api/openf1';
import { ActivityIndicator } from 'react-native';

export default function OnboardingScreen() {
  const router = useRouter();
  const { updateUserProfile, user } = useAuth();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [favoriteTeam, setFavoriteTeam] = useState<string | null>(null);
  const [favoriteDriver, setFavoriteDriver] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [teams, setTeams] = useState<OpenF1Team[]>([]);
  const [drivers, setDrivers] = useState<OpenF1Driver[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  React.useEffect(() => {
    async function loadData() {
      setIsLoadingData(true);
      const [teamsRes, driversRes] = await Promise.all([
        getLatestSessionTeams(),
        getLatestSessionDrivers(),
      ]);
      
      if (teamsRes.ok) {
        setTeams(teamsRes.teams.sort((a, b) => a.team_name.localeCompare(b.team_name)));
      }
      if (driversRes.ok) {
        setDrivers(driversRes.drivers);
      }
      
      setIsLoadingData(false);
    }
    void loadData();
  }, []);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    await updateUserProfile({
      profile: {
        favoriteTeamCode: favoriteTeam,
        favoriteDriverCode: favoriteDriver,
        bio: bio.trim() || null,
      }
    });
    setIsSubmitting(false);
    // Explicitly navigate to tabs after completion
    router.replace('/(tabs)');
  };



  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#050507]"
    >
      <View 
        style={{ paddingTop: Math.max(insets.top, 16) }} 
        className="px-6 pb-2 flex-row items-center justify-between border-b border-white/5"
      >
        {step > 1 ? (
          <Pressable onPress={handleBack} className="h-10 w-10 items-center justify-center rounded-full bg-white/5">
            <Icon as={ChevronLeft} size={20} className="text-white" />
          </Pressable>
        ) : <View className="h-10 w-10" />}
        
        <View className="flex-row gap-2">
          {[1, 2, 3].map(i => (
            <View 
              key={i} 
              className={`h-2 w-8 rounded-full ${step >= i ? 'bg-[#ef1f14]' : 'bg-white/10'}`} 
            />
          ))}
        </View>
        
        <Pressable onPress={() => router.replace('/(tabs)')} className="h-10 justify-center">
          <Text className="text-white/50 text-sm font-medium">Passer</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-6 py-8">
        {step === 1 && (
          <Animated.View className="flex-1">
            <Text className="text-3xl font-bold text-white mb-2">Ton écurie ?</Text>
            <Text className="text-white/60 text-base mb-8">
              Choisis l'écurie que tu soutiens cette saison.
            </Text>

            {isLoadingData ? (
              <View className="flex-1 items-center justify-center py-20">
                <ActivityIndicator size="large" color="#ef1f14" />
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {teams.map((team) => {
                  const isSelected = favoriteTeam === team.team_name;
                  const colorHex = team.team_colour ? `#${team.team_colour}` : '#333';
                  return (
                    <Pressable
                      key={team.team_name}
                      onPress={() => setFavoriteTeam(team.team_name)}
                      className={`w-[48%] p-4 mb-4 rounded-2xl border ${isSelected ? 'border-white/80 bg-white/10' : 'border-white/10 bg-[#0c0c0f]'}`}
                    >
                      <View className="h-3 w-3 rounded-full mb-3" style={{ backgroundColor: colorHex }} />
                      <Text className={`font-semibold ${isSelected ? 'text-white' : 'text-white/70'}`}>
                        {team.team_name}
                      </Text>
                      {isSelected && (
                        <View className="absolute top-4 right-4 h-5 w-5 rounded-full bg-white items-center justify-center">
                          <Icon as={Check} size={12} className="text-black" />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View className="flex-1">
            <Text className="text-3xl font-bold text-white mb-2">Ton pilote ?</Text>
            <Text className="text-white/60 text-base mb-8">
              Qui est ton pilote favori sur la grille ?
            </Text>

            {isLoadingData ? (
              <View className="flex-1 items-center justify-center py-20">
                <ActivityIndicator size="large" color="#ef1f14" />
              </View>
            ) : (
              <View className="gap-3">
                {drivers.map((driver) => {
                  const isSelected = favoriteDriver === driver.name_acronym;
                  const colorHex = driver.team_colour ? `#${driver.team_colour}` : '#333';
                  
                  return (
                    <Pressable
                      key={driver.driver_number}
                      onPress={() => setFavoriteDriver(driver.name_acronym)}
                      className={`flex-row items-center p-4 rounded-xl border ${isSelected ? 'border-white/80 bg-white/10' : 'border-white/10 bg-[#0c0c0f]'}`}
                    >
                      <View className="h-full w-1 rounded-full mr-4" style={{ backgroundColor: colorHex }} />
                      <View className="flex-1">
                        <Text className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-white/80'}`}>{driver.full_name}</Text>
                        <Text className="text-white/40 text-sm">{driver.team_name}</Text>
                      </View>
                      {isSelected && (
                        <View className="h-6 w-6 rounded-full bg-white items-center justify-center">
                          <Icon as={Check} size={14} className="text-black" />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View className="flex-1">
            <Text className="text-3xl font-bold text-white mb-2">Ta bio</Text>
            <Text className="text-white/60 text-base mb-8">
              Ajoute une petite description à ton profil pour les autres joueurs. (Optionnel)
            </Text>

            <View className="bg-[#0c0c0f] border border-white/10 rounded-2xl overflow-hidden">
              <Input
                multiline
                numberOfLines={4}
                placeholder="Je suis un fan inconditionnel de F1 depuis 10 ans..."
                value={bio}
                onChangeText={setBio}
                className="text-white text-base h-auto min-h-[120px] border-0 bg-transparent px-4 py-4"
                textAlignVertical="top" 
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <View 
        style={{ paddingBottom: Math.max(insets.bottom, 24) }} 
        className="px-6 pt-4 border-t border-white/5 bg-[#050507]"
      >
        {step < 3 ? (
          <Button 
            className="w-full h-14 rounded-xl bg-[#ef1f14] flex-row items-center justify-center"
            onPress={handleNext}
            disabled={step === 1 ? !favoriteTeam : !favoriteDriver}
          >
            <Text className="text-white font-bold text-lg mr-2">Continuer</Text>
            <Icon as={ChevronRight} size={20} className="text-white" />
          </Button>
        ) : (
          <Button 
            className="w-full h-14 rounded-xl bg-[#ef1f14] flex-row items-center justify-center"
            onPress={handleFinish}
            disabled={isSubmitting}
          >
            <Text className="text-white font-bold text-lg mr-2">
              {isSubmitting ? 'Enregistrement...' : 'Terminer mon profil'}
            </Text>
            {!isSubmitting && <Icon as={Check} size={20} className="text-white" />}
          </Button>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
