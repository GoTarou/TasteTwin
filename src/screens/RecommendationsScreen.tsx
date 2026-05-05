import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/MainStack';
import { useRecommendations } from '../hooks/useRecommendations';
import type { Recommendation } from '../hooks/useRecommendations';

const BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

const FeaturedCard = ({ rec, onPress }: { rec: Recommendation; onPress: () => void }) => (
  <TouchableOpacity className="w-full bg-surface-container rounded-xl overflow-hidden shadow-2xl relative border border-outline-variant/5" onPress={onPress}>
    <View className="h-[400px] w-full relative">
      <Image 
        source={rec.image_url}
        placeholder={BLURHASH}
        contentFit="cover"
        transition={300}
        style={{ width: '100%', height: '100%' }}
      />
      <View className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
      <View className="absolute bottom-6 left-6 right-6">
        <View className="flex-row items-center gap-3 mb-3">
          <View className="bg-primary/20 px-3 py-1 rounded-full border border-primary/20">
            <Text className="text-primary text-xs font-bold tracking-wider uppercase">{rec.match_percentage}% Match</Text>
          </View>
          <View className="bg-secondary/20 px-3 py-1 rounded-full border border-secondary/20">
            <Text className="text-secondary text-xs font-bold tracking-wider uppercase">{rec.cuisine_type}</Text>
          </View>
        </View>
        <Text className="font-headline text-3xl font-bold text-white mb-2 leading-tight">{rec.name}</Text>
        <Text className="text-on-surface-variant text-sm mb-2 leading-relaxed">{rec.description}</Text>
        <View className="flex-row items-center mb-6">
          <MaterialIcons name="auto-awesome" size={12} color="#e9c349" />
          <Text className="text-secondary/80 text-xs ml-1 italic">{rec.reason}</Text>
        </View>
        <View className="flex-row gap-6 border-t border-outline-variant/15 pt-4">
          <View>
            <Text className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Calories</Text>
            <Text className="text-primary font-bold">{rec.calories} kcal</Text>
          </View>
          <View>
            <Text className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Protein</Text>
            <Text className="text-white font-bold">{rec.protein}g</Text>
          </View>
          <View>
            <Text className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Fat</Text>
            <Text className="text-white font-bold">{rec.fat}g</Text>
          </View>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const SecondaryCard = ({ rec, onPress }: { rec: Recommendation; onPress: () => void }) => (
  <TouchableOpacity className="w-[48%] bg-surface-container rounded-xl overflow-hidden shadow-xl border border-outline-variant/5" onPress={onPress}>
    <View className="h-40 relative">
      <Image 
        source={rec.image_url}
        placeholder={BLURHASH}
        contentFit="cover"
        transition={200}
        style={{ width: '100%', height: '100%' }}
      />
      <View className="absolute top-2 right-2 bg-background/60 px-2 py-1 rounded-full">
        <Text className="text-white text-[8px] font-black uppercase">{rec.match_percentage}% Match</Text>
      </View>
    </View>
    <View className="p-4">
      <Text className="font-headline text-lg font-bold text-white mb-2 leading-tight" numberOfLines={2}>{rec.name}</Text>
      <Text className="text-on-surface-variant text-xs mb-2" numberOfLines={2}>{rec.description}</Text>
      <View className="flex-row items-center mb-4">
        <MaterialIcons name="auto-awesome" size={10} color="#e9c349" />
        <Text className="text-secondary/70 text-[10px] ml-1 italic flex-1" numberOfLines={1}>{rec.reason}</Text>
      </View>
      <View className="flex-row justify-between border-t border-outline-variant/10 pt-3">
        <View className="items-center"><Text className="text-[8px] text-on-surface-variant uppercase">P</Text><Text className="text-xs font-bold text-white">{rec.protein}g</Text></View>
        <View className="items-center"><Text className="text-[8px] text-on-surface-variant uppercase">C</Text><Text className="text-xs font-bold text-white">{rec.carbs}g</Text></View>
        <View className="items-center"><Text className="text-[8px] text-on-surface-variant uppercase">F</Text><Text className="text-xs font-bold text-white">{rec.fat}g</Text></View>
      </View>
    </View>
  </TouchableOpacity>
);

const CompactCard = ({ rec, onPress }: { rec: Recommendation; onPress: () => void }) => (
  <TouchableOpacity className="w-32 bg-surface-container-low p-3 rounded-xl border border-outline-variant/5 mr-4" onPress={onPress}>
    <Image 
      source={rec.image_url}
      placeholder={BLURHASH}
      contentFit="cover"
      transition={200}
      style={{ width: '100%', height: 80, borderRadius: 8, marginBottom: 12 }}
    />
    <Text className="text-xs font-bold text-white leading-tight mb-1" numberOfLines={1}>{rec.name}</Text>
    <Text className="text-[10px] text-primary">{rec.match_percentage}% ★</Text>
  </TouchableOpacity>
);

export const RecommendationsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { data: recommendations, isLoading, error, refetch } = useRecommendations();

  const openRecipe = (rec: Recommendation) => {
    navigation.navigate('RecipeDetail', { recipe: rec });
  };

  const featured = recommendations?.[0];
  const secondary = recommendations?.slice(1, 3) || [];
  const trending = recommendations?.slice(3) || [];

  return (
    <SafeAreaView className="flex-1 bg-background" >
      {/* TopAppBar */}
      <View className="flex-row justify-between items-center px-6 py-4 bg-[#131313]/80 z-50">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity 
            className="w-10 h-10 rounded-full items-center justify-center bg-surface-container-high"
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={20} color="#e5e2e1" />
          </TouchableOpacity>
          <Text className="font-headline font-black text-xl text-white tracking-tighter">TasteTwin</Text>
        </View>
        <TouchableOpacity onPress={() => refetch()}>
          <MaterialIcons name="refresh" size={24} color="#ff8c00" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 100 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={false} 
            onRefresh={() => refetch()} 
            tintColor="#e9c349" 
            colors={['#e9c349']} 
          />
        }
      >
        {/* Hero Section */}
        <View className="mb-12">
          <View className="flex-row items-center self-start px-4 py-2 rounded-full bg-surface-variant/30 mb-4">
            <MaterialIcons name="psychology" size={14} color="#e9c349" className="mr-2" />
            <Text className="font-label text-[10px] uppercase tracking-[0.15em] font-bold text-secondary ml-2">AI Curated Picks</Text>
          </View>
          <Text className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-4 leading-tight">
            Perfect Matches for <Text className="text-primary">Your Palate</Text>
          </Text>
          <Text className="text-on-surface-variant text-base leading-relaxed">
            Our digital sommelier has analyzed your taste profile to find the most intense flavor profiles for you.
          </Text>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View className="items-center py-20">
            <ActivityIndicator size="large" color="#ff8c00" />
            <Text className="text-on-surface-variant text-sm mt-4">Curating your perfect meals...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View className="bg-surface-container rounded-xl p-6 items-center mb-8 border border-outline-variant/10">
            <MaterialIcons name="error-outline" size={32} color="#ff8c00" />
            <Text className="text-on-surface-variant text-sm mt-3 text-center mb-4">
              {(error as Error)?.message || 'Could not generate recommendations. Please try again.'}
            </Text>
            <TouchableOpacity 
              className="bg-primary px-6 py-3 rounded-xl"
              onPress={() => refetch()}
            >
              <Text className="text-on-primary font-headline font-bold">Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recommendations Content */}
        {!isLoading && recommendations && recommendations.length > 0 && (
          <View className="space-y-8">
            {/* Featured Recommendation (Large) */}
            {featured && <FeaturedCard rec={featured} onPress={() => openRecipe(featured)} />}

            {/* Secondary Cards Grid */}
            {secondary.length > 0 && (
              <View className="flex-row flex-wrap justify-between gap-y-6 mt-8">
                {secondary.map((rec, i) => (
                  <SecondaryCard key={i} rec={rec} onPress={() => openRecipe(rec)} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Trending Section */}
        {!isLoading && trending.length > 0 && (
          <View className="mt-10">
            <View className="flex-row items-center gap-2 mb-6">
              <MaterialIcons name="local-fire-department" size={20} color="#ffb77d" />
              <Text className="font-headline text-lg font-bold text-white">More For You</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6 pb-4" contentContainerStyle={{ paddingRight: 24 }}>
              {trending.map((rec, i) => (
                <CompactCard key={i} rec={rec} onPress={() => openRecipe(rec)} />
              ))}
            </ScrollView>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};
