import { useMutation } from '@tanstack/react-query';
import { uploadMealImage } from '../lib/storage';
import type { MealLog } from '../types/database';

// Using your exact laptop Wi-Fi IP address!
const API_URL = "http://192.168.18.21:5000/predict";

export type AnalyzeResult = Omit<MealLog, 'id' | 'user_id' | 'created_at'>;

export const useAnalyze = () => {
  return useMutation({
    mutationFn: async ({ imageUri, userId }: { imageUri: string; userId: string }): Promise<AnalyzeResult> => {
      // 1. Upload the image to Supabase to save the url
      const uploadedUrl = await uploadMealImage(userId, imageUri);

      const mimeType = imageUri.toLowerCase().endsWith('png') ? 'image/png' : 'image/jpeg';
      const filename = imageUri.split('/').pop() || 'image.jpg';

      // 2. Prepare FormData to send to local Flask Server
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: mimeType,
        name: filename,
      } as any);

      // 3. Call local AI server
      console.log("Sending image to local AI at:", API_URL);
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`AI Server Error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.prediction) {
        throw new Error("Failed to parse AI response. Please try again.");
      }

      const prediction = result.prediction;
      const nutrition = result.nutrition || {};

      // 4. Map the response to our App Schema
      // We generate sensible defaults for the complex AI fields that our local ResNet doesn't generate
      return {
        image_url: uploadedUrl,
        name: prediction.name || "Unknown Dish",
        restaurant: null,
        location: null,
        calories: nutrition.calories || 0,
        protein: nutrition.protein || 0,
        carbs: nutrition.carbs || 0,
        fat: nutrition.fat || 0,
        fiber: 0,
        sodium: 0,
        sugar: 0,
        flavor_tags: ["Savory", "Fresh"],
        ingredients: ["Identified Ingredients"],
        ai_insight: `Recognized as ${prediction.name} by TasteTwin's Local Deep Learning Model.`,
        pairing_suggestion: "Pairs well with your favorite beverage.",
        match_score: 95, // Hardcoded high match score for demo purposes
      };
    }
  });
};
