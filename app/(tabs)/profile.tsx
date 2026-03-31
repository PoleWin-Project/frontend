import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Icon } from '@/components/ui/icon';
import { LogOut, Trash2, Edit2, Check, X, Shield, Star, Trophy, ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLatestSessionTeams, getLatestSessionDrivers, type OpenF1Team, type OpenF1Driver } from '@/lib/api/openf1';
import { fetchUserStats, type UserStats } from '@/lib/api/users';

export default function ProfileScreen() {
  const { user, logout, deleteAccount, updateUserProfile, accessToken, isLoading: isAuthLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState(user?.profile?.bio || '');
  const [editTeam, setEditTeam] = useState(user?.profile?.favoriteTeamCode || '');
  const [editDriver, setEditDriver] = useState(user?.profile?.favoriteDriverCode || '');
  const [isSaving, setIsSaving] = useState(false);

  const [teams, setTeams] = useState<OpenF1Team[]>([]);
  const [drivers, setDrivers] = useState<OpenF1Driver[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (isEditing && teams.length === 0) {
      loadLists();
    }
  }, [isEditing]);

  useEffect(() => {
    if (accessToken) {
      loadStats();
    }
  }, [accessToken]);

  async function loadStats() {
    if (!accessToken) return;
    const res = await fetchUserStats(accessToken);
    if (res.ok) {
      setStats(res.stats);
    }
  }

  async function loadLists() {
    setLoadingLists(true);
    const [tRes, dRes] = await Promise.all([
      getLatestSessionTeams(),
      getLatestSessionDrivers()
    ]);
    if (tRes.ok) setTeams(tRes.teams);
    if (dRes.ok) setDrivers(dRes.drivers);
    setLoadingLists(false);
  }

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => logout() }
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront effacées.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive', 
          onPress: async () => {
            const res = await deleteAccount();
            if (!res.ok) Alert.alert('Erreur', res.error);
          } 
        }
      ]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await updateUserProfile({
      profile: {
        bio: editBio,
        favoriteTeamCode: editTeam,
        favoriteDriverCode: editDriver
      }
    });
    if (res.ok) {
      setIsEditing(false);
    } else {
      Alert.alert('Erreur', res.error);
    }
    setIsSaving(false);
  };

  if (!user) return null;

  const currentTeam = teams.find(t => t.team_name === (isEditing ? editTeam : user.profile?.favoriteTeamCode));
  const teamColor = currentTeam?.team_colour ? `#${currentTeam.team_colour}` : '#333';

  return (
    <View className="flex-1 bg-[#050507]">
      <ScreenHeader title="Profil" subtitle="Paramètres du compte" />
      
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View className="bg-[#0c0c0f] border border-white/10 rounded-3xl p-6 mb-6 shadow-2xl">
          <View className="flex-row items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center border-2 border-primary/40 mr-5">
               <Image 
                  source={require('@/assets/images/placeholder_driver.png')}
                  className="w-16 h-16 rounded-full"
                  resizeMode="cover"
               />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-black text-white uppercase italic">{user.username}</Text>
              <Text className="text-white/40 font-bold mb-2">{user.email}</Text>
              <View className="flex-row">
                <View className="bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                   <Text className="text-[10px] text-primary font-black uppercase">Vétéran</Text>
                </View>
              </View>
            </View>
            {!isEditing && (
              <Pressable 
                onPress={() => setIsEditing(true)}
                className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10"
              >
                <Icon as={Edit2} size={16} className="text-white" />
              </Pressable>
            )}
          </View>

          {isEditing ? (
            <View className="gap-4">
              <View>
                <Text className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-2 ml-1">Mini Bio</Text>
                <View className="bg-black/40 border border-white/10 rounded-2xl">
                   <Input 
                      multiline
                      numberOfLines={4}
                      value={editBio}
                      onChangeText={setEditBio}
                      className="text-white text-base min-h-[100px] px-4 py-3 border-0 bg-transparent"
                      textAlignVertical="top"
                      placeholder="Parlez-nous de votre passion F1..."
                      placeholderTextColor="rgba(255,255,255,0.3)"
                   />
                </View>
              </View>
              
              <View className="flex-row gap-4">
                 <View className="flex-1">
                    <Text className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-2 ml-1">Écurie</Text>
                    <ScrollView className="h-40 bg-black/40 border border-white/5 rounded-xl p-2">
                       {loadingLists ? <ActivityIndicator size="small" color="#ef1f14" className="mt-4" /> : 
                        teams.map(t => (
                          <Pressable key={t.team_name} onPress={() => setEditTeam(t.team_name)} className={`p-2 rounded-lg mb-1 ${editTeam === t.team_name ? 'bg-primary' : ''}`}>
                             <Text className={`text-xs font-bold ${editTeam === t.team_name ? 'text-white' : 'text-white/60'}`}>{t.team_name}</Text>
                          </Pressable>
                        ))
                       }
                    </ScrollView>
                 </View>
                 <View className="flex-1">
                    <Text className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-2 ml-1">Pilote</Text>
                    <ScrollView className="h-40 bg-black/40 border border-white/5 rounded-xl p-2">
                       {loadingLists ? <ActivityIndicator size="small" color="#ef1f14" className="mt-4" /> : 
                        drivers.map(d => (
                          <Pressable key={d.driver_number} onPress={() => setEditDriver(d.name_acronym)} className={`p-2 rounded-lg mb-1 ${editDriver === d.name_acronym ? 'bg-primary' : ''}`}>
                             <Text className={`text-xs font-bold ${editDriver === d.name_acronym ? 'text-white' : 'text-white/60'}`}>{d.full_name}</Text>
                          </Pressable>
                        ))
                       }
                    </ScrollView>
                 </View>
              </View>

              <View className="flex-row gap-3 mt-4">
                <Button 
                    className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10"
                    onPress={() => setIsEditing(false)}
                >
                  <Icon as={X} size={18} className="text-white/60 mr-2" />
                  <Text className="text-white/60 font-bold">Annuler</Text>
                </Button>
                <Button 
                    className="flex-1 h-12 rounded-xl bg-primary"
                    onPress={handleSave}
                    disabled={isSaving}
                >
                  {isSaving ? <ActivityIndicator size="small" color="white" /> : (
                    <>
                      <Icon as={Check} size={18} className="text-white mr-2" />
                      <Text className="text-white font-bold">Enregistrer</Text>
                    </>
                  )}
                </Button>
              </View>
            </View>
          ) : (
            <View>
              <View className="flex-row mb-6">
                <View className="flex-1 items-center border-r border-white/5">
                  <Text className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">Écurie</Text>
                  <View className="flex-row items-center">
                    <View style={{ backgroundColor: teamColor }} className="w-2 h-2 rounded-full mr-2" />
                    <Text className="text-white font-black uppercase italic">{user.profile?.favoriteTeamCode || 'None'}</Text>
                  </View>
                </View>
                <View className="flex-1 items-center border-r border-white/5">
                   <Text className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">Pilote</Text>
                   <Text className="text-white font-black uppercase italic">{user.profile?.favoriteDriverCode || 'None'}</Text>
                </View>
                <View className="flex-1 items-center">
                   <Text className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">Points</Text>
                   <Text className="text-primary font-black text-xl italic">{user.points?.toLocaleString() ?? '0'}</Text>
                </View>
              </View>

              <View className="bg-black/40 p-4 rounded-2xl border border-white/5">
                <Text className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-2">Ma Bio</Text>
                <Text className="text-white/70 text-sm leading-5 italic">
                  {user.profile?.bio || "Pas encore de bio. Cliquez sur éditer pour en ajouter une !"}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View className="flex-row gap-4 mb-6">
           <View className="flex-1 bg-[#0c0c0f] border border-white/10 rounded-2xl p-4">
              <Icon as={Trophy} size={20} className="text-amber-400 mb-2" />
              <Text className="text-white/40 text-[10px] font-black uppercase mb-1">Victoires</Text>
              <Text className="text-white font-black text-xl italic">{stats?.won ?? 0}</Text>
           </View>
           <View className="flex-1 bg-[#0c0c0f] border border-white/10 rounded-2xl p-4">
              <Icon as={Star} size={20} className="text-primary mb-2" />
              <Text className="text-white/40 text-[10px] font-black uppercase mb-1">Classement</Text>
              <Text className="text-white/40 font-bold text-xs uppercase italic tracking-widest mt-1">À venir</Text>
           </View>
        </View>

        {/* Security / Dangerous Area */}
        <Text className="text-[10px] text-white/40 font-black uppercase tracking-[4px] mb-4 px-2">Paramètres système</Text>
        
        <View className="bg-[#0c0c0f] border border-white/10 rounded-3xl overflow-hidden">
          <Pressable 
            onPress={handleLogout}
            className="flex-row items-center p-5 border-b border-white/5 active:bg-white/5"
          >
            <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mr-4">
              <Icon as={LogOut} size={18} className="text-white/80" />
            </View>
            <Text className="flex-1 text-white font-bold">Se déconnecter</Text>
            <Icon as={ArrowRight} size={16} className="text-white/20" />
          </Pressable>

          <Pressable 
            onPress={handleDeleteAccount}
            className="flex-row items-center p-5 active:bg-red-500/10"
          >
            <View className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center mr-4">
              <Icon as={Trash2} size={18} className="text-red-500" />
            </View>
            <Text className="flex-1 text-red-500 font-bold">Supprimer mon compte</Text>
            <Icon as={Shield} size={16} className="text-red-500/20" />
          </Pressable>
        </View>
        
        <Text className="text-center text-white/20 text-[10px] font-bold uppercase mt-12 tracking-widest">
          PoleWin v1.2.0 • Build b742
        </Text>
      </ScrollView>

      {isAuthLoading && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center">
          <ActivityIndicator size="large" color="#ef1f14" />
        </View>
      )}
    </View>
  );
}
