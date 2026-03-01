import poster1 from "@/assets/poster-1.jpg";
import poster2 from "@/assets/poster-2.jpg";
import poster3 from "@/assets/poster-3.jpg";
import poster4 from "@/assets/poster-4.jpg";
import poster5 from "@/assets/poster-5.jpg";
import poster6 from "@/assets/poster-6.jpg";
import poster7 from "@/assets/poster-7.jpg";
import poster8 from "@/assets/poster-8.jpg";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

export interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  userRating?: number;
  genre: string[];
  category: string[];
  language: string;
  description: string;
  poster: string;
  heroImage?: string;
  url?: string;
  newly_added?: string;
  duration: string;
  isTrending?: boolean;
  isEditorChoice?: boolean;
  isSeries?: boolean;
}

export const featuredMovies: Movie[] = [
  {
    id: "f1",
    title: "Inferno Protocol",
    year: 2024,
    rating: 8.7,
    genre: ["Action", "Thriller"],
    category: ["Hollywood Blockbusters", "Trending Now"],
    language: "English",
    description: "A rogue agent must stop a global catastrophe before time runs out. Explosive action meets heart-pounding suspense.",
    poster: poster1,
    heroImage: hero1,
    duration: "2h 18m",
    isTrending: true,
    isSeries: true,
  },
  {
    id: "f2",
    title: "Neon Horizons",
    year: 2025,
    rating: 9.1,
    genre: ["Sci-Fi", "Drama"],
    category: ["Hollywood Blockbusters", "Editor's Choice"],
    language: "English",
    description: "In a cyberpunk metropolis, a hacker uncovers a conspiracy that could reshape humanity's future forever.",
    poster: poster6,
    heroImage: hero2,
    duration: "2h 34m",
    isTrending: true,
    isEditorChoice: true,
    isSeries: true,
  },
  {
    id: "f3",
    title: "The Deep Relic",
    year: 2024,
    rating: 8.4,
    genre: ["Adventure", "Mystery"],
    category: ["Hollywood Blockbusters", "Trending Now"],
    language: "English",
    description: "An underwater archaeologist discovers an ancient temple that holds the key to a lost civilization.",
    poster: poster2,
    heroImage: hero3,
    duration: "2h 08m",
    isTrending: true,
  },
];

export const allMovies: Movie[] = [
  ...featuredMovies,
  {
    id: "m1",
    title: "Shadow Network",
    year: 2024,
    rating: 8.2,
    genre: ["Action", "Thriller"],
    category: ["Hollywood Blockbusters", "Trending Now"],
    language: "English",
    description: "A cyber-security expert is dragged into a web of international espionage.",
    poster: poster1,
    duration: "2h 05m",
    isTrending: true,
    isSeries: true,
  },
  {
    id: "m2",
    title: "Dragon's Reign",
    year: 2023,
    rating: 8.9,
    genre: ["Fantasy", "Action"],
    category: ["Hollywood Blockbusters", "Editor's Choice"],
    language: "English",
    description: "Warriors unite against ancient dragons threatening to destroy the realm.",
    poster: poster2,
    duration: "2h 42m",
    isEditorChoice: true,
  },
  {
    id: "m3",
    title: "Eternal Tides",
    year: 2024,
    rating: 7.8,
    genre: ["Romance", "Drama"],
    category: ["Hollywood Blockbusters"],
    language: "English",
    description: "Two souls find each other against impossible odds on a sun-drenched coast.",
    poster: poster3,
    duration: "1h 56m",
  },
  {
    id: "m4",
    title: "The Whispering House",
    year: 2023,
    rating: 7.5,
    genre: ["Horror", "Thriller"],
    category: ["Hollywood Blockbusters", "Trending Now"],
    language: "English",
    description: "A family moves into a Victorian mansion with a terrifying secret.",
    poster: poster4,
    duration: "1h 48m",
    isTrending: true,
  },
  {
    id: "m5",
    title: "Rang De Basanti 2",
    year: 2024,
    rating: 8.6,
    genre: ["Drama", "Action"],
    category: ["Bollywood Hits", "Trending Now"],
    language: "Hindi",
    description: "A new generation of students fights for justice and awakening in modern India.",
    poster: poster5,
    duration: "2h 30m",
    isTrending: true,
    isSeries: true,
  },
  {
    id: "m6",
    title: "Cosmic Drift",
    year: 2025,
    rating: 9.0,
    genre: ["Sci-Fi", "Adventure"],
    category: ["Hollywood Blockbusters", "Editor's Choice"],
    language: "English",
    description: "An astronaut drifts through space after a catastrophic mission failure.",
    poster: poster6,
    duration: "2h 15m",
    isEditorChoice: true,
  },
  {
    id: "m7",
    title: "Veera: The Warrior",
    year: 2024,
    rating: 8.3,
    genre: ["Action", "Historical"],
    category: ["South Cinema", "Trending Now"],
    language: "Tamil",
    description: "An ancient warrior rises to protect his kingdom from invaders.",
    poster: poster7,
    duration: "2h 45m",
    isTrending: true,
    isSeries: true,
  },
  {
    id: "m8",
    title: "Road Trippers",
    year: 2023,
    rating: 7.2,
    genre: ["Comedy", "Adventure"],
    category: ["Hollywood Blockbusters"],
    language: "English",
    description: "Four friends embark on a chaotic cross-country adventure.",
    poster: poster8,
    duration: "1h 52m",
  },
  {
    id: "m9",
    title: "Dil Ka Safar",
    year: 2024,
    rating: 7.9,
    genre: ["Romance", "Musical"],
    category: ["Bollywood Hits"],
    language: "Hindi",
    description: "A musician and a dancer discover love through the rhythm of life.",
    poster: poster5,
    duration: "2h 20m",
  },
  {
    id: "m10",
    title: "Kaalratri",
    year: 2023,
    rating: 8.1,
    genre: ["Horror", "Thriller"],
    category: ["Bollywood Hits", "Trending Now"],
    language: "Hindi",
    description: "A dark night in a remote village unleashes ancient terrors.",
    poster: poster4,
    duration: "2h 00m",
    isTrending: true,
    isSeries: true,
  },
  {
    id: "m11",
    title: "Mahabali",
    year: 2024,
    rating: 8.8,
    genre: ["Action", "Fantasy"],
    category: ["South Cinema", "Editor's Choice"],
    language: "Telugu",
    description: "A mythical hero must confront demons to save the world.",
    poster: poster7,
    duration: "2h 50m",
    isEditorChoice: true,
    isSeries: true,
  },
  {
    id: "m12",
    title: "Galactic Nomad",
    year: 2025,
    rating: 8.5,
    genre: ["Sci-Fi", "Drama"],
    category: ["Hollywood Blockbusters", "Editor's Choice"],
    language: "English",
    description: "A lone traveler searches for humanity's new home among the stars.",
    poster: poster6,
    duration: "2h 22m",
    isEditorChoice: true,
  },
  {
    id: "m13",
    title: "Anbe Sivam",
    year: 2024,
    rating: 7.6,
    genre: ["Romance", "Drama"],
    category: ["South Cinema"],
    language: "Tamil",
    description: "Two strangers embark on a journey that transforms their lives.",
    poster: poster3,
    duration: "2h 10m",
  },
  {
    id: "m14",
    title: "Midnight Express",
    year: 2023,
    rating: 7.4,
    genre: ["Thriller", "Crime"],
    category: ["Hollywood Blockbusters", "Trending Now"],
    language: "English",
    description: "A detective races against time on a train full of suspects.",
    poster: poster1,
    duration: "1h 58m",
    isTrending: true,
  },
];

export const categories = [
  "Trending Now",
  "Hollywood Blockbusters",
  "Bollywood Hits",
  "South Cinema",
  "Editor's Choice",
];

export const genres = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy",
  "Horror", "Romance", "Sci-Fi", "Thriller", "Crime",
  "Historical", "Musical",
];

export const languages = ["English", "Hindi", "Tamil", "Telugu"];

export function getMoviesByCategory(category: string): Movie[] {
  return allMovies.filter((m) => m.category.includes(category));
}

export function getMoviesByGenre(genre: string): Movie[] {
  return allMovies.filter((m) => m.genre.includes(genre));
}

export function getMoviesByLanguage(language: string): Movie[] {
  return allMovies.filter((m) => m.language === language);
}
