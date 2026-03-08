interface ProfileStatsProps {
  friendsCount: number;
  watchlistCount: number;
  ratingsCount: number;
}

export default function ProfileStats({ friendsCount, watchlistCount, ratingsCount }: ProfileStatsProps) {
  const stats = [
    { label: "Friends", value: friendsCount },
    { label: "Watchlist", value: watchlistCount },
    { label: "Ratings", value: ratingsCount },
  ];

  return (
    <div className="flex justify-center gap-8 md:gap-12 mt-4 px-4">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <p className="text-xl md:text-2xl font-display text-foreground">{stat.value}</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
