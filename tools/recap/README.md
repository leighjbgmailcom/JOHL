# Rinkside Report — the weekly recap

Every game night gets a recap on the site: a short piece of colour
commentary on all the games, as text and as an audio file, at
`recaps.html`. The voice is **Rusty Dunnigan**, a made-up old-time colour
man. He is an original character — he is not, and must never be written
or voiced as, an impression of a real broadcaster.

This is the whole job, start to finish.

## 1. Get the night's games

From Supabase (project `wjsxpywxwjordtzzjrue`), for the game date:

- `games` — the finals for that date, in `game_time` order (skip
  `no_games` rows and anything not `status = 'final'`), with `went_ot`
- `game_goals` — period, time, scorer and assists
- `game_penalties` — who, what for, how long
- `game_goalie_periods` — who was in net and when they came out
- `players` / `teams` — names

If a game from that night isn't `final` yet, stop and say so rather than
writing around it.

## 2. Write Rusty's script

Save it as `recaps/scripts/YYYY-MM-DD.txt`, plain text, a blank line
between paragraphs. About 450–550 words (three minutes).

- Open with "Rusty Dunnigan here with the Rinkside Report for …" and
  close with "This has been Rusty Dunnigan with the Rinkside Report."
- A paragraph or two a game: the score, who drove it, the turning point,
  a goalie note, the penalty box. Finish with the night as a whole.
- **Only what the score sheets say.** Every name, number and time has to
  come from the data. No invented plays, quotes, injuries or history.
- Good-natured. Tease a team, never a man: nothing about anyone's age,
  body, health, family or job, and a player with a penalty gets a wink,
  not a roasting. These are neighbours reading about themselves.
- Write it the way it is **said**: numbers as words ("ten to five",
  "forty seconds in"), full sentences, no symbols or web addresses.

## 3. Make the audio

    tools/recap/make_audio.sh recaps/scripts/YYYY-MM-DD.txt recaps/audio/YYYY-MM-DD.mp3

Listen for (or at least check the length of) the result — about three
minutes. If the voice trips on a name, respell it the way it sounds in
the script file only.

## 4. Put it on the site

Add an entry to the top of `recaps` in `recaps/recaps.json`:

    {
      "date": "YYYY-MM-DD",
      "title": "A one-line headline",
      "audio": "recaps/audio/YYYY-MM-DD.mp3",
      "text": ["first paragraph", "second paragraph", "…"]
    }

`text` is the script with names spelled properly (the page shows it under
"Read the recap"). Commit, merge to `main`, push, and wait a couple of
minutes for `https://jordanohl.ca/recaps.html?date=YYYY-MM-DD` to show it.
The email reads the recap from the live site, so it can't go out before
the page is up.

## 5. Email the link

The email is sent by the `send-recap-email` Edge Function, which only the
database can call (`supabase-migrations/005_recap_email.sql`). Run these
as SQL:

    select private.send_recap_email('info');                                   -- sends nothing; checks the setup
    select private.send_recap_email('test', 'YYYY-MM-DD', 'admin@example.com'); -- one admin's own address
    select private.send_recap_email('all',  'YYYY-MM-DD');                     -- every player on the active season

- Send the `test` first and have a league admin look at it.
- `all` is refused until `app_config.recap_email_all_enabled` is `'true'`,
  and refused a second time for the same date. **Don't send `all` without
  the league's say-so for that week** until they've said to stop asking.
- People who've asked off the list go in `recap_email_optouts`.
- The Resend key is the Edge Function secret `RESEND_API_KEY`. It never
  goes in this repo, in a chat, or in the database.
