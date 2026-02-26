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
      {
        number: 2,
        episodes: [
          { id: "f2-s2e1", number: 1, title: "New Dawn", duration: "58m", description: "Maya returns to a changed world after the revelations." },
          { id: "f2-s2e2", number: 2, title: "Underground", duration: "52m", description: "The resistance movement grows in the shadows." },
          { id: "f2-s2e3", number: 3, title: "Firewall", duration: "55m", description: "A massive digital barrier threatens to divide the city." },
          { id: "f2-s2e4", number: 4, title: "Convergence", duration: "60m", description: "All paths lead to the final showdown." },
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
  {
    movieId: "m5",
    seasons: [
      {
        number: 1,
        episodes: [
          { id: "m5-s1e1", number: 1, title: "Jagriti", duration: "55m", description: "A group of university students discover a corruption scandal." },
          { id: "m5-s1e2", number: 2, title: "Aandolan", duration: "50m", description: "The movement begins as students take to the streets." },
          { id: "m5-s1e3", number: 3, title: "Sangharsh", duration: "52m", description: "The struggle intensifies with opposition from powerful forces." },
          { id: "m5-s1e4", number: 4, title: "Balidan", duration: "58m", description: "Sacrifices are made as the truth comes to light." },
          { id: "m5-s1e5", number: 5, title: "Vijay", duration: "60m", description: "Victory comes at a heavy price." },
        ],
      },
      {
        number: 2,
        episodes: [
          { id: "m5-s2e1", number: 1, title: "Naya Savera", duration: "48m", description: "A new dawn brings fresh challenges for the next generation." },
          { id: "m5-s2e2", number: 2, title: "Digital Kranti", duration: "52m", description: "The revolution goes digital in the age of social media." },
          { id: "m5-s2e3", number: 3, title: "Sach Ka Samna", duration: "50m", description: "Facing the truth becomes the hardest battle." },
        ],
      },
    ],
  },
  {
    movieId: "m7",
    seasons: [
      {
        number: 1,
        episodes: [
          { id: "m7-s1e1", number: 1, title: "The Prophecy", duration: "58m", description: "An ancient prophecy foretells the rise of a great warrior." },
          { id: "m7-s1e2", number: 2, title: "Training Grounds", duration: "52m", description: "Veera trains under the legendary master of combat." },
          { id: "m7-s1e3", number: 3, title: "First Battle", duration: "55m", description: "The invaders attack and Veera must prove his worth." },
          { id: "m7-s1e4", number: 4, title: "The Betrayer", duration: "50m", description: "A close ally turns traitor, threatening the kingdom." },
          { id: "m7-s1e5", number: 5, title: "Rise of Veera", duration: "62m", description: "The ultimate battle to save the kingdom begins." },
        ],
      },
      {
        number: 2,
        episodes: [
          { id: "m7-s2e1", number: 1, title: "New Enemies", duration: "55m", description: "A larger threat emerges from across the seas." },
          { id: "m7-s2e2", number: 2, title: "Alliance", duration: "48m", description: "Veera must forge alliances with former enemies." },
          { id: "m7-s2e3", number: 3, title: "The Siege", duration: "58m", description: "The kingdom faces its darkest hour under siege." },
          { id: "m7-s2e4", number: 4, title: "Legacy", duration: "65m", description: "Veera's legacy is cemented in an epic finale." },
        ],
      },
    ],
  },
  {
    movieId: "m10",
    seasons: [
      {
        number: 1,
        episodes: [
          { id: "m10-s1e1", number: 1, title: "The Village", duration: "45m", description: "A journalist arrives in a remote village to investigate disappearances." },
          { id: "m10-s1e2", number: 2, title: "Whispers", duration: "48m", description: "Strange whispers in the night lead to chilling discoveries." },
          { id: "m10-s1e3", number: 3, title: "The Ritual", duration: "52m", description: "An ancient ritual holds the key to the village's dark secret." },
          { id: "m10-s1e4", number: 4, title: "Unleashed", duration: "55m", description: "The terror is unleashed on the darkest night of the year." },
        ],
      },
    ],
  },
  {
    movieId: "m11",
    seasons: [
      {
        number: 1,
        episodes: [
          { id: "m11-s1e1", number: 1, title: "Awakening", duration: "60m", description: "The mythical hero awakens from centuries of slumber." },
          { id: "m11-s1e2", number: 2, title: "The Demon King", duration: "55m", description: "The Demon King's army marches across the land." },
          { id: "m11-s1e3", number: 3, title: "Sacred Weapons", duration: "52m", description: "Mahabali seeks the divine weapons hidden in temples." },
          { id: "m11-s1e4", number: 4, title: "Army of Light", duration: "58m", description: "An army of warriors is assembled for the final battle." },
          { id: "m11-s1e5", number: 5, title: "The War", duration: "65m", description: "The epic war between good and evil reaches its climax." },
          { id: "m11-s1e6", number: 6, title: "Restoration", duration: "62m", description: "Peace is restored but at a great cost." },
        ],
      },
      {
        number: 2,
        episodes: [
          { id: "m11-s2e1", number: 1, title: "Return", duration: "58m", description: "A new threat forces Mahabali to return from exile." },
          { id: "m11-s2e2", number: 2, title: "Dark Prophecy", duration: "52m", description: "An ancient prophecy speaks of a greater evil." },
          { id: "m11-s2e3", number: 3, title: "The Underworld", duration: "55m", description: "Mahabali descends into the underworld to find answers." },
          { id: "m11-s2e4", number: 4, title: "Final Stand", duration: "68m", description: "The ultimate battle for the fate of all worlds." },
        ],
      },
      {
        number: 3,
        episodes: [
          { id: "m11-s3e1", number: 1, title: "Echoes", duration: "55m", description: "Echoes of the past reveal hidden truths about Mahabali's origin." },
          { id: "m11-s3e2", number: 2, title: "The Celestials", duration: "60m", description: "The gods themselves intervene in the mortal world." },
          { id: "m11-s3e3", number: 3, title: "Eternal", duration: "70m", description: "Mahabali faces his ultimate destiny." },
        ],
      },
    ],
  },
];

export function getSeriesData(movieId: string): SeriesData | undefined {
  return seriesData.find((s) => s.movieId === movieId);
}
