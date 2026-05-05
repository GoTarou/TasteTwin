import { useQuery } from '@tanstack/react-query';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import type { TasteProfile, FlavorAffinities } from '../types/database';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_VISION_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export interface Recommendation {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  match_percentage: number;
  image_url: string;
  cuisine_type: string;
  reason: string;
  ingredients: string[];
  instructions: string[];
  prep_time: string;
  servings: number;
}

const isValidUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const buildFoodImagePromptUrl = (name: string, cuisineType: string, description: string) => {
  const prompt = `${name}, ${cuisineType} cuisine food photography, ${description}, plated meal, realistic, appetizing`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${encodeURIComponent(name.toLowerCase())}&nologo=true`;
};

export const useRecommendations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendations-v2', user?.id],
    queryFn: async (): Promise<Recommendation[]> => {
      if (!user) throw new Error('Not authenticated');

      // Fetch user's taste profile
      const { data: existingTasteProfile, error } = await supabase
        .from('taste_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        throw new Error(`Could not load your taste profile: ${error.message}`);
      }

      // Auto-heal users who don't yet have a taste_profiles row.
      let tasteProfile = existingTasteProfile;
      if (!tasteProfile) {
        const { data: createdTasteProfile, error: createError } = await supabase
          .from('taste_profiles')
          .insert({
            user_id: user.id,
            dietary_regimen: 'None',
            allergies: [],
            flavor_affinities: { spicy: 0, umami: 0, sweet: 0, sour: 0, bitter: 0 },
            favorite_cuisines: [],
          })
          .select('*')
          .single();

        if (createError || !createdTasteProfile) {
          throw new Error(`Could not initialize your taste profile: ${createError?.message || 'Unknown error'}`);
        }

        tasteProfile = createdTasteProfile;
      }

      // Fetch recent meal history for context
      const { data: recentMeals } = await supabase
        .from('meal_logs')
        .select('name, flavor_tags, ingredients, calories')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const tp = tasteProfile as TasteProfile;
      const affinitiesRaw = (tp.flavor_affinities || {}) as Partial<FlavorAffinities>;
      const affinities: FlavorAffinities = {
        spicy: Number(affinitiesRaw.spicy ?? 0),
        umami: Number(affinitiesRaw.umami ?? 0),
        sweet: Number(affinitiesRaw.sweet ?? 0),
        sour: Number(affinitiesRaw.sour ?? 0),
        bitter: Number(affinitiesRaw.bitter ?? 0),
      };

      // Build meal history summary
      const mealHistorySummary = recentMeals && recentMeals.length > 0
        ? `Recent meals enjoyed: ${recentMeals.map(m => `${m.name} (${(m.flavor_tags || []).join(', ')})`).join('; ')}`
        : 'No meal history yet — suggest popular and diverse dishes.';

      // Build a profile summary for the AI
      const profileSummary = `
Dietary regimen: ${tp.dietary_regimen || 'None'}
Allergies: ${tp.allergies?.length > 0 ? tp.allergies.join(', ') : 'None'}
Flavor preferences: Spicy (${affinities.spicy}/10), Umami (${affinities.umami}/10), Sweet (${affinities.sweet}/10), Sour (${affinities.sour}/10), Bitter (${affinities.bitter}/10)
Favorite cuisines: ${tp.favorite_cuisines?.length > 0 ? tp.favorite_cuisines.join(', ') : 'Open to all'}
${mealHistorySummary}
      `.trim();

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `
You are a world-class culinary sommelier. Based on this user's taste profile AND their meal history, recommend exactly 5 meals they would love. The recommendations should be diverse, creative, personalized, and different from what they've already eaten.

User Profile:
${profileSummary}

Return ONLY a raw JSON array (no markdown, no code blocks) with exactly 5 objects, each having:
{
  "name": "string (creative dish name)",
  "description": "string (1-2 sentence enticing description)",
  "calories": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "match_percentage": number (80-99, how well it fits their profile),
  "image_url": "string (optional direct URL to an image that visually matches this specific dish)",
  "cuisine_type": "string (e.g. Modern Japanese, Rustic Italian)",
  "reason": "string (1 short sentence explaining WHY this was recommended)",
  "ingredients": ["string", "string", ...] (list of 6-12 ingredients with quantities, e.g. '2 cups basmati rice'),
  "instructions": ["string", "string", ...] (4-8 clear step-by-step cooking instructions),
  "prep_time": "string (e.g. '25 mins', '1 hr 15 mins')",
  "servings": number (1-4)
}

Sort by match_percentage descending. Make the descriptions evocative and appetizing.
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      let parsed: any[];
      try {
        const cleaned = text.replace(/```json\s*/, '').replace(/\s*```/, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        console.error('Failed to parse Gemini recommendations:', text);
        throw new Error('Failed to parse AI recommendations. Please try again.');
      }

      // Map parsed results and attach dish-specific images.
      return parsed.map((item: any) => {
        const name = item.name || 'Recommended Dish';
        const description = item.description || 'A delicious meal curated for your palate.';
        const cuisineType = item.cuisine_type || 'Fusion';
        const imageUrl = isValidUrl(item.image_url)
          ? item.image_url
          : buildFoodImagePromptUrl(name, cuisineType, description);

        return {
          name,
          description,
          calories: item.calories || 0,
          protein: item.protein || 0,
          carbs: item.carbs || 0,
          fat: item.fat || 0,
          match_percentage: item.match_percentage || 85,
          image_url: imageUrl,
          cuisine_type: cuisineType,
          reason: item.reason || 'Curated for your unique flavor profile.',
          ingredients: item.ingredients || [],
          instructions: item.instructions || [],
          prep_time: item.prep_time || '30 mins',
          servings: item.servings || 2,
        };
      });
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes to avoid excessive API calls
    retry: 1,
  });
};

