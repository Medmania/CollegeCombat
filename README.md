# Kursi Kombat

A side-view office-politics fighting game, played in landscape. Pick a
colleague-caricature, then punch, kick, sweep, jump and air-kick your way to a
knockout. Fighters are drawn as articulated skeletons, so the limbs actually
move — no sprite swapping.

- **Play solo** against 1–3 bots.
- **Host a game** and up to three friends join from their own phones — 1v1 or a
  four-way free-for-all.
- **Real depth:** a perspective camera beside the lane, a colonnade, a crowd and
  a painted stage. Drawn with the 2D canvas API, so there is no 3D library to
  download and the page still opens by double-click.
- **Height matters:** a punch sails over a crouching opponent, a sweep goes under
  a jumping one, and an air kick only connects while you are off the ground.
- **No backend.** No Firestore, no Supabase, no accounts, no keys, no database.
  Gameplay packets travel phone-to-phone.
- **One file per character.** Adding a colleague is a copy, an edit and one line.
- **Bots with personality.** Each fighter's bot inherits its temperament from its
  passive and its stats, so The Intern swarms you while The Deadline waits and
  counters. Three difficulty levels.

---

## Try it

**Double-click `index.html`.** That is all — no server, no install, no build step.

If you prefer a local URL (handy for testing multiplayer on one machine):

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

---

## The files

| File | What it is | Do you edit it? |
| --- | --- | --- |
| `index.html` | The whole game: styles, 3D rendering, controls, sound, bots, networking, screens | Only for look-and-feel or core changes |
| `js/fighters/*.js` | **One file per character** — six are included | **Yes — this is where you work** |
| `js/characters.js` | Collects the fighter files; holds the headlines and ticker lines | Sometimes |
| `js/engine.js` | The rules: movement, hits, damage, knockback, knockout | Rarely |

`README.md`, `package.json`, `tools/` and `.github/` are support files — you never
need them on your phone.

---

## Add a character

Each fighter is its own file. To add someone:

1. Copy `js/fighters/intern.js` to `js/fighters/<their-id>.js`.
2. Change the values inside — `id` must be unique, lowercase, no spaces.
3. Open `index.html` and add one line beside the other fighters:

   ```html
   <script src="js/fighters/<their-id>.js"></script>
   ```

That is the whole process. Order in `index.html` is roster order.

A finished file looks like this:

```js
(globalThis.KK_FIGHTERS = globalThis.KK_FIGHTERS || []).push({
  id: 'rahul',
  name: 'Rahul',
  tagline: 'Let us take this offline',
  colors: { body: '#7c3aed', accent: '#f0abfc', skin: '#e3b489', hair: '#241d33' },
  stats: { speed: 1.1, power: 0.95, weight: 0.9, hp: 92 },
  moves: {
    punch: { damage: 7, range: 70, arc: 1.25, dur: 0.22, hitAt: 0.08, knock: 150, cd: 0.26 },
    kick:  { damage: 13, range: 100, arc: 0.9, dur: 0.42, hitAt: 0.18, knock: 300, cd: 0.55 },
    dash:  { speed: 700, dur: 0.15, cd: 2.0 },
    super: { damage: 26, range: 180, knock: 600 }
  },
  taunts: ['This could have been an email.'],
  passive: { id: 'quick', text: 'Quick: moves 14% faster.' }
});
```

**The numbers**

| Field | Meaning |
| --- | --- |
| `stats.speed` | 1.0 normal, 1.15 quick, 0.9 slow |
| `stats.power` | multiplies every hit you land |
| `stats.weight` | higher = you get knocked back less |
| `stats.hp` | 100 normal, 130 tank, 80 fragile |
| `range` | pixels from your centre (a body is about 52 wide) |
| `arc` | the cone you hit in, in radians (1.2 ≈ 70°) |
| `dur` / `hitAt` | how long the move takes, and when inside it the hit lands |
| `knock` | knockback strength |
| `cd` | cooldown, seconds |

**Passives** (`passive.id`): `none`, `tank` (+30% health), `quick` (+14% speed),
`heavy` (+18% damage, −8% speed), `shover` (+35% knockback), `charged` (+50% meter
gain), `slippery` (dash recharges almost twice as fast). Unknown ids fall back to
`none`.

`taunts` are the speech bubbles that pop up mid-fight — one or two lines each is
plenty.

Aim for caricature, not likeness, and get a yes from anyone you put in the game.

---

## How multiplayer works with no server

WebRTC needs one thing from outside the two phones: a way to swap connection
descriptions. There is no signalling server here, so **you swap them by hand**,
once per friend:

1. Host taps **Generate invite code** for a slot and sends that code on Slack or
   WhatsApp.
2. The friend opens the game, taps **Join a game**, pastes the code, and gets a
   **reply code**.
3. They send the reply code back. The host pastes it into the slot and taps
   **Connect**.
4. Repeat for each extra player. Then **Start fight**.

After that handshake, every gameplay packet goes directly between the phones.
Nothing is stored anywhere, and the codes are single-use for that session.

### Why both phones must be on the same Wi-Fi

The trade for "strictly zero third-party" is that no STUN or TURN server is
contacted, so the phones can only find each other on the same local network.
That is fine for an office. A phone hotspot works too — both phones join it.

If you later want players on different networks, open the `net` section of
`index.html` and set:

```js
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];
```

A STUN server only reports a device's public address — no game data passes
through it. Even then, roughly one connection in five still needs a TURN relay.

---

## Put it on GitHub Pages

1. Push these files to the `main` branch.

   ```bash
   git init
   git add .
   git commit -m "kursi kombat"
   git branch -M main
   git remote add origin https://github.com/<you>/kursi-kombat.git
   git push -u origin main
   ```

2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
   The included workflow publishes the site on every push to `main`.

3. Your game is at `https://<you>.github.io/kursi-kombat/`.

No secrets, no environment variables, no build step.

> Prefer not to use Actions? Delete `.github/` and set
> **Settings → Pages → Deploy from a branch → main / (root)** instead.

---

## Controls

The fight is played in **landscape**. Held in portrait, the game pauses behind a
"rotate your phone" prompt.

There are only **two buttons**. Everything else is on the stick.

**The stick (left thumb)**

| Gesture | Does |
| --- | --- |
| Slide left / right | walk |
| Slide **up** | jump straight up |
| Slide **up + forward** | jump obliquely — forward and up together |
| Slide **down** | crouch (hold) |
| Double-tap toward | dash forward |
| Double-tap **away** | backflip — leaves the ground, flies backwards, briefly invincible |

**The buttons (right thumb)**

PUNCH and KICK. They combine with whatever the stick is doing, and the engine
picks the move:

| Stick | PUNCH | KICK |
| --- | --- | --- |
| neutral | **jab** — fast, chest height | **roundhouse** — slower, longer |
| pushing **forward** | **stepping straight** — longer reach, more damage | **spin kick** — turns the whole body through the kick |
| holding **away** | jab | **back kick** — turning kick, huge knockback |
| down (crouch) | **uppercut** — drives up from low | **sweep** — hits crouchers, knocks down |
| up (in the air) | **overhead** — hammer from above | **flying kick** — leg thrown forward |

Leaning into or away from your opponent with the stick changes what a button
does, so ten moves come out of two buttons and one stick.

SUPER appears at full meter: a radial blast.

**Desktop:** `A`/`D` or arrows walk, `W`/`Up` jump, `S`/`Down` crouch, `J` punch,
`K` kick, `L` dash, `Space` super.

A match is **best of three**: two rounds, and a third only if the wins are level
after two. Each round opens on a card showing who is fighting and which round it
is, then "FIGHT!". Rounds run to 120 seconds or until one fighter is left
standing; most HP wins on time. The HUD pips next to each name show rounds won.

The crowd behind the barrier is made of little people — they bob, raise their
arms and cheer harder after a big hit or a knockout.

The pace is deliberately slow. `HP_SCALE`, `PACE` and the walk speed in
`js/engine.js` are the three dials; raise `HP_SCALE` to make fights longer. At
the current settings a round lasts around 45 seconds.

Sound is synthesised in the browser, no audio files: hits, whiffs, the round
fanfare, the crowd murmur and cheers that swell on knockouts.

### How the heights interact

- A **jab** sweeps chest-to-head height, so it misses a crouching opponent.
- A **roundhouse** covers waist-to-chest and hits crouchers.
- A **sweep** stays at ankle height: it hits crouchers and knocks them down, but
  a jumping opponent clears it.
- An **overhead** or **flying kick** travels with you, so you can jump in and
  strike from above.
- An **uppercut** starts low and rises, so it catches someone standing right in
  front of you.
- A knockdown leaves you on the floor for about a second. Free hits.

## The roster

Seventeen fighters, one file each in `js/fighters/`. Every one has its own
super, built from five archetypes in `js/engine.js`:

| Kind | What it does | Who has one |
| --- | --- | --- |
| `blast` | instant hit in a radius around you | Saurav, Ankit, Adnan |
| `shot` | a projectile that flies and hits once | Priyank, Nikhil, Ajay, Mukesh, 31, 33 |
| `beam` | sustained damage in a line in front | Jeetu, Mohit |
| `flurry` | sustained multi-hit at close range | Apoorv, Aditya, 32 |
| `aura` | sustained pulse that can slow, weaken or lock | Ansh, Anmol, Ashish |

Super parameters live in each fighter's `moves.super`:

```js
super: { kind: 'shot', name: 'Gym Ka Hisaab', damage: 24, speed: 560,
         r: 26, bounces: 1, knock: 520, look: 'dumbbell' }
```

- `beam` / `flurry` / `aura` also take `dur`, `interval`, and optionally `slow`,
  `weak` and `lock` (seconds of debuff).
- `shot` takes `speed`, `r`, `bounces`, `arc` (lob it) and `count` (a herd).
- `blast` takes `range`, `knock` and `knockdown`.

`look` picks the shape the renderer draws: `dumbbell`, `ball`, `cloud`,
`tripod`, `scooty`, `herd`, `haze`, `heart`, `beam`, `laser`, `ghost`, `mood`,
`bubble`, `dark`, `panda`, `thigh`.

## Bots

Bots are built from three layers, all in `js/ai.js`:

**Profile** — temperament, blended from the fighter's passive and its id:

| Fighter | How it fights |
| --- | --- |
| Mohit, 32, Apoorv, Ashish | fast and relentless, in your face |
| Priyank, Adnan, Mukesh | patient, hold range, punish mistakes |
| Ankit, Saurav, 33, Nikhil | walk you down and trade |
| Jeetu, Aditya, 31, Anmol, Ajay, Ansh | balanced, mix pokes with pressure |

Each profile sets `aggression`, `patience`, `spacing`, `mobility` and which
button it reaches for first. Tweak the numbers in `PROFILES` to change a
character's temperament.

**Level** — Easy / Normal / Hard, chosen on the solo setup screen. It scales
reaction time, how often the bot swings, how well it keeps distance, how often
it defends against your attacks, how often it chains a combo, and how well it
times a super.

**State** — what it is doing right now: `approach`, `poke`, `pressure`,
`retreat`, `antiair`, `punish` or `wait`. Bots crouch under your jabs, jump over
your sweeps, back off when they are hurt, punish a whiffed attack, and only spend
a full meter when you are close or already stunned.

Bots only ever run on the host or in solo, so their randomness can never desync a
networked match.

## Checks

```bash
npm test
```

59 checks run against the same files the browser loads: hits connect at the right
range, stick-up jumps and stick-down crouches, up+forward jumps obliquely, one
swipe gives exactly one jump, a jab sails over a crouch, a sweep lands on a
croucher and passes under a jump, crouch+punch becomes an uppercut that connects,
air punch and air kick register only in the air, holding away turns a kick into a
back kick, pushing forward produces a spin kick and a stepping straight,
double-tapping away starts a backflip, sweeps knock down, super needs a full meter, all five super
archetypes do what they claim (blast, shot, beam, aura, flurry), projectiles
travel, hit and clean up, a four-player round finishes, nobody leaves the lane or
falls through the floor, snapshots carry position, height and projectiles, and
every fighter file is complete.

Debug helper in the browser console: `__kursi()` prints the live match state,
which is handy while you tune numbers.

Settings (the link under the main menu) holds the sound-effects volume, saved on
the phone. Nothing leaves the device.

---

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| "This network is blocking direct phone-to-phone connections" | The phones cannot see each other. Same Wi-Fi, VPN off, or use a phone hotspot. |
| Invite code pasted and nothing happens | The friend must send back the **reply** code and you must paste it and tap **Connect**. |
| Works on one phone, not the other | Some corporate Wi-Fi isolates clients (AP isolation). Use a hotspot. |
| Blank page | The page must sit next to its `js/` folder. Copy the whole folder, not just `index.html`. |
| "Rotate your phone" will not go away | The fight only runs in landscape. Turn the phone sideways. |
| New fighter does not appear | Check the `<script>` line is in `index.html` **above** `js/characters.js`, and the `id` is unique. |
| Two phones connect but the fight never starts | Only the host can press **Start fight**. |
| iOS: no sound | Audio starts on your first tap; tap a button once. |

---

## Limits, honestly

- No client-side prediction: on a slow link you may feel your own move land a
  moment late. On the same Wi-Fi this is not noticeable.
- The host's phone does the work. Four players on a very old phone will run hot.
- The fighters are stylised skeletons built from limbs and a head, not sculpted
  models. Real character art would need a proper 3D asset pipeline.
- No blocking or throws yet. Crouching and jumping are the defensive options.
- No ranked matchmaking, no accounts, no persistent leaderboard — all of which
  would need the server you asked not to have.
- No installable-app manifest: dropped to keep the file count down. Add a
  `manifest.webmanifest` and an icon if you want "Add to Home Screen".
