export interface Episode {
  id: string;
  number: number;
  title: string;
  duration: string;
  description: string;
}

export interface Season {
  number: number;
  episodes: Episode[];
}

export interface SeriesData {
  movieId: string;
  seasons: Season[];
}

// Mock series data for movies that are "series"
export const seriesData: SeriesData[] = [
  {
    movieId: "f1",
    seasons: [
      {
        number: 1,
        episodes: [
          { id: "f1-s1e1", number: 1, title: "The Beginning", duration: "52m", description: "Agent Kane discovers the Inferno Protocol for the first time." },
          { id: "f1-s1e2", number: 2, title: "Undercover", duration: "48m", description: "Kane infiltrates the enemy organization under a new identity." },
          { id: "f1-s1e3", number: 3, title: "Betrayal", duration: "55m", description: "A trusted ally reveals their true allegiance." },
          { id: "f1-s1e4", number: 4, title: "Countdown", duration: "50m", description: "With hours remaining, the team races to defuse the threat." },
          { id: "f1-s1e5", number: 5, title: "Endgame", duration: "58m", description: "The final confrontation with the mastermind." },
        ],
      },
      {
        number: 2,
        episodes: [
          { id: "f1-s2e1", number: 1, title: "Aftermath", duration: "51m", description: "Kane deals with the consequences of the first mission." },
          { id: "f1-s2e2", number: 2, title: "New Threat", duration: "47m", description: "A deadlier version of the protocol surfaces." },
          { id: "f1-s2e3", number: 3, title: "Ghost Network", duration: "53m", description: "Kane uncovers a hidden network of operatives." },
        ],
      },
    ],
  },
  {
    movieId: "f2",
    seasons: [
      {
        number: 1,
        episodes: [
          { id: "f2-s1e1", number: 1, title: "Neon City", duration: "60m", description: "Introduction to the cyberpunk world and its inhabitants." },
          { id: "f2-s1e2", number: 2, title: "The Hack", duration: "55m", description: "Maya discovers the first clue to the conspiracy." },
          { id: "f2-s1e3", number: 3, title: "Digital Ghost", duration: "52m", description: "A mysterious figure contacts Maya from inside the network." },
          { id: "f2-s1e4", number: 4, title: "System Crash", duration: "58m", description: "The entire grid goes dark as Maya gets closer to the truth." },
          { id: "f2-s1e5", number: 5, title: "Reboot", duration: "62m", description: "Maya must rebuild everything from scratch." },
          { id: "f2-s1e6", number: 6, title: "Horizons", duration: "65m", description: "The shocking truth behind the conspiracy is revealed." },
        ],
      },
    ],
  },
  {
    movieId: "m1",
    seasons: [
      {
        number: 1,
        episodes: [
          { id: "m1-s1e1", number: 1, title: "First Contact", duration: "45m", description: "A security breach leads to a mysterious message." },
          { id: "m1-s1e2", number: 2, title: "Deep Web", duration: "48m", description: "The investigation goes deeper into the dark web." },
          { id: "m1-s1e3", number: 3, title: "Firewalls", duration: "46m", description: "Every defense is tested as the attack escalates." },
          { id: "m1-s1e4", number: 4, title: "Zero Day", duration: "50m", description: "The final battle for control of the network." },
        ],
      },
    ],
  },
];

export function getSeriesData(movieId: string): SeriesData | undefined {
  return seriesData.find((s) => s.movieId === movieId);
}
