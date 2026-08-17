# Supabase Quest

A Game Boy-style browser game that teaches six Supabase concepts in about three
minutes, with auth and a public leaderboard built on Supabase itself.

**Play it:** _(deploy URL goes here)_

---

## What this is, and why

I'm applying for a Customer Solution Architect role at Supabase. A CV can tell
you I've read the docs. This is meant to show that I understand what the product
is actually for — where each piece fits, and where it doesn't.

You walk a small overworld and talk to six characters. Each explains one concept
and asks one question:

| Who | Concept |
| --- | --- |
| Professor Pöstgres | Postgres, and why portability is the point |
| Rowena the Gatekeeper | Row Level Security |
| The service_role key | Secret handling |
| Reggie Realtime | Realtime, and what it isn't for |
| Supavisor | Connection pooling for serverless |
| Multigres | Horizontal scaling, still being built |

There's a seventh character who isn't on the map and gives no points. He talks
about limits.

The game is the demo. The auth flow and the leaderboard behind it are the actual
Supabase application, and the RLS policies are the part I'd expect a reviewer to
open first — so they're in [`schema.sql`](./schema.sql), commented.

---

## Running it

No build step, no dependencies to install.

```bash
git clone <this repo>
cd supabase-game
python3 -m http.server 8000
# open http://localhost:8000
```

It runs playable straight away. To switch on auth and the leaderboard:

1. **Create a Supabase project.**
2. **SQL Editor → run [`schema.sql`](./schema.sql).**
3. **Project Settings → Data API** → copy the project URL.
   **Project Settings → API Keys** → copy the anon (or publishable) key.
   Put both in [`config.js`](./config.js).
4. **Authentication → Sign In / Providers** → switch on the methods you want,
   then match the flags in `config.js`. A method that's off there hides its
   button rather than failing when tapped.
5. **Authentication → URL Configuration** → add your local and deployed URLs to
   *Redirect URLs*, or magic links will bounce.

The anon key is committed on purpose. It ships in every Supabase browser app,
it's designed to be public, and RLS is what actually protects the data. The
`service_role` key is not here and must never be.

---

## Architecture

```
index.html      one page: landing, sign-in, game, results
config.js       your project URL + anon key
schema.sql      tables, indexes, RLS policies
src/
  painter.js    pixel-drawing surface + Game Boy monochrome remap
  palette.js    every colour in the game, in one place
  tiles.js      tile art, drawn in code
  sprites.js    character generator — one function, whole cast
  map.js        the overworld + a load-time reachability check
  render.js     canvas: camera, scaling, y-sorted entities
  input.js      keyboard + touch, normalised
  player.js     grid movement
  dialogue.js   typewriter box and quiz menu
  content.js    everything anyone says
  progress.js   badges, score, localStorage
  screens.js    title, quest log, results
  landing.js    public page, sign-in, nickname
  supabase.js   the client and every query
  audio.js      synthesised blips
  game.js       loop and glue
```

### Why vanilla JS and no engine

Three reasons, in order of how much they mattered.

**The thing being demonstrated is Supabase, not tooling.** A reviewer clicking
into this repo should reach `schema.sql` and `supabase.js` in two clicks. A
build config, a component framework and a state library are all noise between
them and the point.

**A game this small doesn't need an engine.** Phaser is ~1MB before my code and
gives me a scene graph, physics and an asset pipeline. I use none of it: the map
is a 30×20 array, movement is one tile per press, and there are no assets to
pipeline because all the art is drawn in code.

**No build step means no build rot.** This runs from a static file host now and
in three years. If someone at Supabase opens it in 2027, `npm install` won't be
what stops them.

The tradeoff is real: no hot reload, no type checking, no test runner. For ~2000
lines I took that trade. For 20,000 I wouldn't.

### Why all the art is drawn in code

No PNGs anywhere. Tiles and characters are drawn at runtime onto small canvases
and cached:

```js
tree(p) {
  p.rect(0, 0, 16, 16, C.grass);
  p.rect(6, 11, 4, 4, C.trunk);
  p.circle(8, 6, 6, C.leaf).circle(6, 5, 4, C.leafMid);
}
```

The whole cast comes from one parameterised function, so a new NPC costs five
colours rather than a new sprite sheet:

```js
postgres: () => makeHuman({
  skin: SKIN.light, hair: HAIR.grey, shirt: '#4a6fa5',
  coat: C.paper, glasses: C.ink, beard: HAIR.grey
})
```

This also made the Game Boy palette toggle nearly free — every colour goes
through one lookup on the way to the canvas.

### Rendering

The world is canvas; everything readable is DOM on top of it. That's deliberate:
it lets the pixel art scale in whole-number steps while type scales
independently, which is what keeps text legible on a phone.

The canvas fills the viewport. Rather than fixing a resolution and letterboxing
it, the renderer fixes how big a tile should *feel* under a thumb (~48 CSS px)
and derives the canvas resolution from that, clamped so you never see fewer than
about 9 tiles or more than 18. The first version of this project *did* render at
a true 160×144 and letterbox it, and on a tall phone it was a small green
rectangle in a large black void. Historically accurate, bad to play.

The map is baked into one offscreen canvas at load, so a frame costs one
`drawImage` rather than one per tile.

---

### Auth flow: implicit, on purpose

Sign-in follows the pattern in the [GitHub](https://supabase.com/docs/guides/auth/social-login/auth-github)
and [Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
guides — `signInWithOAuth({ provider, options: { redirectTo } })`, with
`detectSessionInUrl` completing the session when the browser comes back.

That leaves it on supabase-js's default **implicit** flow rather than PKCE. PKCE
is the more secure of the two — the token arrives as a `?code=` to be exchanged
instead of sitting in the URL fragment — and it works in a static site like this
one without a server, since the verifier lives in localStorage.

I stayed on implicit anyway, for one reason: PKCE ties a magic link to the
browser that requested it. Ask for a link on a laptop, open the email on a
phone, and the verifier isn't there — the sign-in fails. For a game whose whole
point is that someone opens it on their phone for three minutes, that's a
likely path, and magic link is the sign-in method I put first and largest.

The thing being protected is a display name and a score on a public
leaderboard. Given that, cross-device sign-in is worth more than keeping the
token out of a URL fragment. On an app holding anything that matters, I'd
switch — it's one line:

```js
createClient(URL, KEY, { auth: { flowType: 'pkce' } })
```

Google's `queryParams: { access_type: 'offline', prompt: 'consent' }` is
deliberately omitted too: that's for getting a refresh token to call Google's
own APIs on the user's behalf, which this app never does.

## The RLS policies

The whole point of the schema. Three tables, all with RLS on.

### profiles

```sql
create policy "profiles public read" on profiles
  for select using (true);
create policy "insert own profile" on profiles
  for insert with check ((select auth.uid()) = id);
create policy "update own profile" on profiles
  for update using ((select auth.uid()) = id);
```

Display names are public — they're on a leaderboard, that's the point. But you
can only insert a row whose primary key *is* your own user id, and only update
that same row. There's no way to create a profile for someone else, or rename
them.

### scores

```sql
create policy "scores public read" on scores
  for select using (true);
create policy "insert own scores" on scores
  for insert with check ((select auth.uid()) = user_id);
```

Anyone can read the board. You can only insert rows attributed to yourself.
Note what's *absent*: no update policy and no delete policy, so a score can't be
edited or removed after the fact — not by its author, not by anyone. With RLS
on, an operation with no policy is denied. **Absence is the deny.**

### recommendations

```sql
create policy "approved recs public" on recommendations
  for select using (approved = true);
create policy "read own recs" on recommendations
  for select using ((select auth.uid()) = user_id);
create policy "insert own recs" on recommendations
  for insert with check ((select auth.uid()) = user_id);
```

Multiple `SELECT` policies are OR'd together: a row is visible if it's approved,
**or** if it's yours. So you can see your own submission sitting unapproved,
which is what a person expects, while the public wall only shows approved ones.

Again, no update policy. `approved` can only be flipped from the dashboard,
using the service role. There is no code path from the browser that can
self-approve, because there's no policy that would let one exist.

### Why `(select auth.uid())` and not `auth.uid()`

Both work. Wrapped in a subquery, Postgres treats it as a stable InitPlan and
evaluates it once per statement. Bare, it's evaluated per row. On ten rows you'd
never notice; on a large table under a `for select` policy it's the difference
between a fast query and a slow one. It costs four characters, so it's the
default here.

### The leaderboard view

The board needs a display name next to each score, which is a join. Doing it
client-side costs two round trips and leaks the query shape into the app, so
there's a view — declared `security_invoker = true`, which means it runs with
the *caller's* RLS in force rather than the view owner's. Without that flag, a
view is a common way to accidentally tunnel straight through your own policies.

---

## What I learned

> **Note to self before sending: rewrite this section in your own words.** The
> observations below are real and were hit while building, but this is the part
> a reader will read as *you*, so it should sound like you.

**RLS reframes where authorization lives.** Coming from an API-server habit, the
instinct is to check permissions in a request handler. Moving that into the
database felt uncomfortable for about an hour, and then obvious: the rule
travels with the data, so a second client, a SQL console, or a future service
can't bypass it by forgetting to call the middleware. The uncomfortable hour is
worth naming, because it's the same hour a customer will spend.

**Absence of a policy is a decision.** The scores table has no update policy.
That's not an oversight I should document — it *is* the mechanism. Reading a
policy list means reading what isn't there as carefully as what is.

**Anon key vs service_role is the concept most worth over-explaining.** The
distinction is simple once it lands, and it's the one where the failure mode is
catastrophic and public. Hence a whole character devoted to it.

**Auth is where a project's URL configuration bites.** Magic links and OAuth both
round-trip through a redirect, so a URL missing from the allow-list fails at the
worst moment — after the user has already committed to signing in.

## One fair criticism of the developer experience

The gap between "it works locally" and "auth works on the deployed URL" is
wider than it should be, and the dashboard doesn't help you close it.

Redirect URLs live under Authentication → URL Configuration, but nothing
prompts you to set them when you enable a provider — which is exactly when
you'd want to be asked. Get it wrong and the failure surfaces as a redirect
back to your app with an error fragment, after the round trip through the
provider, which reads as "the login is broken" rather than "a URL isn't on a
list". I lost time to it, and I don't think I'd be the first.

The neighbouring rough edge: the anon key genuinely *is* safe to ship, and the
docs say so, but "commit this key to a public repo" runs against every instinct
a developer has been trained to have. That confidence has to be rebuilt every
time. More prominent framing of *why* it's safe — RLS is the boundary, the key
is only an identifier — would do more work than another warning label.

Both are onboarding problems rather than product problems, which is roughly the
job I'm applying for.

---

## Known limitations

**Scores are client-submitted and therefore forgeable.** Anyone can open the
console and insert a 600. The `check (score >= 0 and score <= 600)` constraint
caps the damage, and RLS ensures a forged score is at least attributed to the
forger's own account. Making it authoritative means an Edge Function validating
a replay log — real work for a leaderboard with no stakes. Being explicit about
the tradeoff reads better than being caught by it.

**No server-side rate limiting** on recommendations beyond Supabase's own auth
limits. Fine at this scale; not fine at any real one.

**Recommendations are moderated by hand** in the dashboard. There's no admin UI,
deliberately — an admin UI is another attack surface for a wall that will hold
maybe a dozen entries.

**One map, no interiors.** Doors are scenery.

**Accessibility is partial.** The game needs a d-pad or arrow keys and can't be
played with a screen reader. The landing page and sign-in flow are ordinary
accessible HTML; the game itself isn't. I'd rather state that than imply
otherwise.

**Tested on Chrome and mobile Safari.** Not tested on Firefox Android.

---

## What I'd do next

1. **Move scoring server-side** — an Edge Function that takes the answer log,
   recomputes the score, and writes it. Removes the forgery caveat above.
2. **Realtime on the leaderboard** — it's a demo of Supabase that currently
   fetches the board once, when the product has a feature that would make it
   live. That's a gap worth closing precisely because the game teaches Realtime.
3. **Presence** — show how many people are on the map right now. Cheap, and it
   demonstrates the part of Realtime that isn't just database changes.
4. **Storage** — let players pick an avatar, so the sixth product surface gets
   represented instead of only being mentioned.
5. **A proper test suite.** There's a load-time reachability check on the map
   that catches walled-off NPCs, but browser tests are currently a script I run
   by hand.

---

Auth and leaderboard powered by Supabase. Built with Claude Code.
