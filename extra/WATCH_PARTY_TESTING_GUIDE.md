# CineStream - Watch Party Testing Guide

A comprehensive guide for testing the Watch Party feature, including setup, test scenarios, known issues, and their solutions.

---

## 📋 Prerequisites

Before testing Watch Party, ensure the following:

1. **Two separate user accounts** — You need two logged-in users (Host and Guest) to test the party flow.
2. **Both users must be friends** — Send and accept a friend request between the two accounts via the Friends page (`/friends`).
3. **Use two browser windows/tabs** — Open the app in two separate browser windows (or use an incognito window for the second account).
4. **Stable internet connection** — Watch Party relies on real-time database sync; unstable connections will cause issues.

---

## 🧪 Test Scenarios

### 1. Starting a Watch Party (Host Flow)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to Friends page | See your accepted friends list |
| 2 | Click "Watch Party" on a friend | Content picker modal opens |
| 3 | Browse Movies/Series tabs | Grid of available content loads |
| 4 | Filter by genre chips | Content filters correctly |
| 5 | Select a movie or series episode | Party is created, waiting phase starts |

### 2. Receiving an Invitation (Guest Flow)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Wait for invite notification | Invitation overlay appears with 30-second countdown |
| 2 | See host name and content title | Correct information displayed |
| 3 | Click "Join" | Player opens in waiting phase |
| 4 | Click "Reject" | Overlay dismisses, party is declined |
| 5 | Let timer expire | Overlay auto-dismisses (treated as ignore) |

### 3. Ready Check & Countdown

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Both users in waiting phase | "Ready" button visible for both |
| 2 | Both click "Ready" | 3-2-1 countdown begins |
| 3 | Countdown finishes | Video starts playing simultaneously |

### 4. Synchronized Playback

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Host plays/pauses | Guest's player mirrors the action |
| 2 | Host seeks to new time | Guest's playback jumps to same position |
| 3 | Guest tries to control playback | Controls should be restricted (host-only) |

### 5. Series Episode Watch Party

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Host selects a series in content picker | Season/episode selector appears |
| 2 | Host picks specific episode | Party starts with that episode |
| 3 | Episode ends | Next episode auto-transitions for both users |
| 4 | Host manually changes episode | Both players switch to new episode |

### 6. In-Party Communication

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | During playing phase | Chat widget and video call widget appear |
| 2 | Send a chat message | Message appears for both users in real-time |
| 3 | Toggle video/audio call | Media stream starts/stops correctly |
| 4 | Minimize communication widget | Widget collapses to floating icon |

### 7. Ending a Watch Party

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Host clicks close/end | Party ends for both users |
| 2 | Guest clicks leave | Guest exits, host can continue solo |
| 3 | Check Watch Party History | Session appears in "YOU ENJOYED TOGETHER" on homepage |
| 4 | Click history card | Resumes solo playback from where party ended |

### 8. Invite Spam Protection

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send invite to a friend | Invite sent successfully |
| 2 | Immediately try sending another | 60-second cooldown blocks the attempt |
| 3 | Wait 60 seconds, try again | Invite sends successfully |

---

## ⚠️ Known Issues & Solutions

### Issue 1: Invite Not Appearing for Guest

**Symptoms:** Host sends invite but guest never sees the overlay.

**Possible Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Guest's browser tab is not focused/active | Ensure the guest has the app open and active in their browser |
| Realtime subscription not connected | Guest should refresh the page to re-establish the realtime connection |
| Users are not friends (status ≠ 'accepted') | Verify friendship status on the Friends page — both must have accepted |
| RLS policy blocking notifications | Check that the `watch_parties` RLS policies allow both host and friend to read rows |

---

### Issue 2: Playback Out of Sync

**Symptoms:** Host and guest are at different timestamps during playback.

**Possible Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Network latency | The system has a built-in sync tolerance; slight differences (1-2 seconds) are normal |
| Guest's video still buffering | Wait for both videos to buffer; the ready-check phase helps mitigate this |
| Sync broadcast throttled | Sync events are throttled to prevent flooding; host should pause and resume to force re-sync |

---

### Issue 3: Party Shows as Active After Both Users Left

**Symptoms:** Ghost party remains in the `watch_parties` table.

**Possible Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Browser crashed or tab closed without cleanup | The party row remains — it will be overwritten on next party creation |
| `endParty()` failed due to network | Manually delete the stale row from `watch_parties` via the backend |
| Both users closed simultaneously | Add a periodic cleanup check or use database triggers to auto-expire stale parties |

---

### Issue 4: Video/Audio Call Not Working

**Symptoms:** Camera or microphone doesn't activate during watch party.

**Possible Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Browser permission denied | Grant camera/microphone permissions in browser settings |
| HTTPS not enabled | Media streams require HTTPS — ensure you're not on plain HTTP |
| Device has no camera/mic | The call feature gracefully degrades but won't show video/audio |
| Another app using the camera | Close other apps using the camera (Zoom, Teams, etc.) |

---

### Issue 5: Episode Transition Fails in Series Watch Party

**Symptoms:** Host moves to next episode but guest stays on the old one.

**Possible Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Broadcast message lost | Host should trigger the episode change again |
| Guest's realtime channel disconnected | Guest should rejoin or refresh |
| Episode data not found in guest's cache | Ensure series/season/episode data is loaded on both sides |

---

### Issue 6: Invite Cooldown Blocking Legitimate Re-invites

**Symptoms:** Host can't re-invite a friend who rejected the first invite.

**Possible Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| 60-second cooldown still active | Wait for the full cooldown period to expire |
| Cooldown tracked per friend | This is by design — prevents invite spam |

---

### Issue 7: Watch Party History Not Showing

**Symptoms:** Completed party doesn't appear in "YOU ENJOYED TOGETHER" section.

**Possible Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| `endParty()` didn't save history | Ensure the party was ended properly (not just tab closed) |
| History row missing `movie_id` | Check that `watch_party_history` has valid `movie_id` references |
| RLS policy blocking read | Verify the user can read from `watch_party_history` where they are `host_id` or `friend_id` |

---

### Issue 8: Content Picker Not Loading Movies/Series

**Symptoms:** Watch Party content picker opens but shows empty or loading state.

**Possible Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Movies table empty | Seed the database with movie/series data first |
| Network timeout | Check network connectivity and retry |
| RLS blocking unauthenticated reads | Ensure the `movies` table allows authenticated users to SELECT |

---

## 🔧 Debugging Tips

1. **Check Browser Console** — Look for realtime subscription errors or failed API calls.
2. **Check Network Tab** — Verify WebSocket connections are established (look for `wss://` connections).
3. **Verify Database State** — Query `watch_parties` table to see current active parties.
4. **Test with Slow Network** — Use browser DevTools network throttling to simulate poor connections.
5. **Clear Local Storage** — Stale state can sometimes cause issues; clear `localStorage` and refresh.

---

## ✅ Test Completion Checklist

- [ ] Host can create a movie watch party
- [ ] Host can create a series watch party with specific episode
- [ ] Guest receives and can accept/reject/ignore invite
- [ ] Invite auto-expires after 30 seconds
- [ ] 60-second cooldown prevents invite spam
- [ ] Ready check works for both users
- [ ] 3-2-1 countdown syncs start
- [ ] Playback is synchronized (play/pause/seek)
- [ ] Host has exclusive playback control
- [ ] In-party chat works in real-time
- [ ] Video/audio call toggles work
- [ ] Episode transitions sync in series parties
- [ ] Ending party saves to history
- [ ] History cards allow solo resume
- [ ] Mobile touch interactions work correctly
- [ ] Tablet layout renders properly
