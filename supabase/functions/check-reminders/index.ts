import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find all reminders where the movie's upcoming_date has passed and not yet notified
    const { data: reminders, error: remErr } = await supabase
      .from("movie_reminders")
      .select("id, user_id, movie_id")
      .eq("notified", false);

    if (remErr) throw remErr;
    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ message: "No pending reminders" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get unique movie IDs
    const movieIds = [...new Set(reminders.map((r) => r.movie_id))];
    const { data: movies, error: movErr } = await supabase
      .from("movies")
      .select("id, title, upcoming_date")
      .in("id", movieIds);

    if (movErr) throw movErr;

    // Filter movies that are now available (upcoming_date <= now)
    const now = new Date();
    const availableMovies = (movies || []).filter(
      (m) => m.upcoming_date && new Date(m.upcoming_date) <= now
    );

    if (availableMovies.length === 0) {
      return new Response(JSON.stringify({ message: "No movies available yet" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const availableMovieIds = new Set(availableMovies.map((m) => m.id));
    const movieTitleMap = Object.fromEntries(availableMovies.map((m) => [m.id, m.title]));

    // Send notifications and mark as notified
    const toNotify = reminders.filter((r) => availableMovieIds.has(r.movie_id));
    let notifiedCount = 0;

    for (const reminder of toNotify) {
      const title = movieTitleMap[reminder.movie_id] || "A movie";

      // Insert notification
      await supabase.from("notifications").insert({
        user_id: reminder.user_id,
        type: "reminder",
        title: "🎬 Now Available!",
        message: `"${title}" is now available to watch!`,
        data: { movie_id: reminder.movie_id },
      });

      // Mark reminder as notified
      await supabase
        .from("movie_reminders")
        .update({ notified: true })
        .eq("id", reminder.id);

      notifiedCount++;
    }

    return new Response(
      JSON.stringify({ message: `Sent ${notifiedCount} reminder notifications` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
