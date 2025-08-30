export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type CalorieMode = 'low-cal' | 'nutritional' | 'treat-day';

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  recipeName: string;
  description: string;
  calories: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  mealType: MealType;
  userImage?: string; // base64 string
}
