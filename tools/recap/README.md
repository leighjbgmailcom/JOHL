# Rinkside Report — the weekly recap

Every game night gets a recap on the site: a short piece of colour
commentary on all the games, as text and as an audio file, at
`recaps.html`. The voice is **Arnie Jordan**, a made-up local who watches
every game from row three at Jordan Arena with a coffee and a notebook
and reports on it for his podcast's two (sometimes three) loyal
listeners. He is an original character — he is not, and must never be
written or voiced as, an impression of a real broadcaster.

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

## 2. Write Arnie's script

Save it as `recaps/scripts/YYYY-MM-DD.txt`, plain text, a blank line
between paragraphs. About 600–750 words (three to four minutes).

- Open with "Arnie Jordan here, coming to you from row three at Jordan
  Arena, with the Rinkside Report …" and close with "This has been Arnie
  Jordan with the Rinkside Report."
- He was **there**: he tells it as a fella in the stands taking notes,
  not as someone reading a score sheet. Give him a running bit or two a
  week — the coffee, the pencil and notebook, the stairs to row three,
  his tiny audience — and don't repeat last week's jokes word for word.
- A paragraph or two a game: the score, who drove it, the turning point,
  a goalie note, the penalty box. Finish with the night as a whole.
- **The hockey is real.** Every name, score, goal, assist, penalty and
  time has to come from the data, and nothing a named player is said to
  have done can be invented.
- **The bloopers are made up, and nobody owns them.** Two or three a
  week for colour: a pass that missed everybody, a shot that went so wide
  it hit the glass in front of him, his own spilled coffee. They never
  get a player's name or number ("I didn't catch who threw it, and I'm
  not asking"), and a goalie "making it look easy" is only said about a
  goalie whose numbers that night back it up. No invented quotes,
  injuries, fights or history.
- End with his standing excuse: if he got a name or a goal wrong, take it
  up with the refs, the timekeeper, and how fast they all move out there.
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

## 4. Put it on the site as a draft

Add an entry to the top of `recaps` in `recaps/recaps.json`:

    {
      "date": "YYYY-MM-DD",
      "draft": true,
      "title": "A one-line headline",
      "audio": "recaps/audio/YYYY-MM-DD.mp3",
      "text": ["first paragraph", "second paragraph", "…"]
    }

`text` is the script with names spelled properly (the page shows it under
"Read the recap"). `"draft": true` keeps it off the Recaps page and the
home page: only the preview link shows it,

    https://jordanohl.ca/recaps.html?date=YYYY-MM-DD&preview

Commit, merge to `main`, push, and wait a couple of minutes for that link
to show it. The emails read the recap from the live site, so nothing can
go out before the page is up. (If the audio is ever re-recorded after
it's been heard, add `?v=2` to the `audio` path so nobody gets the old
one from their browser's cache.)

## 5. Send the league admin a preview

The email is sent by the `send-recap-email` Edge Function, which only the
database can call (`supabase-migrations/005_recap_email.sql` and
`007_recap_league_send.sql`). Run these as SQL:

    select private.send_recap_email('info');                                    -- sends nothing; checks the setup
    select private.send_recap_email('test', 'YYYY-MM-DD', 'admin@example.com'); -- one admin's own address

The test email is the real email with `[TEST]` on the subject, and for a
draft its button opens the preview link. **Stop here** and wait for a
league admin to say the recap is good. If they want something changed,
change the script, make the audio again, push, and send another test.

## 6. After the league says go: publish, then email everybody

1. Take the `"draft": true` line off the entry in `recaps/recaps.json`,
   commit, merge to `main`, push, and wait until
   `https://jordanohl.ca/recaps.html?date=YYYY-MM-DD` shows it (the home
   page picks it up too).
2. Send it, naming whoever approved it:

       select private.send_recap_to_league('YYYY-MM-DD', 'Their Name');

Things to know about that send:

- **Never run it without that week's go-ahead from a league admin.** It
  refuses a recap that's still a draft, and it refuses if
  `app_config.recap_email_all_enabled` isn't `'true'`.
- It goes to every player on the active season with an email on file,
  one email each, except anyone in `recap_email_optouts`.
- It writes down everyone it reached. If it stops part way — the reply
  has `"remaining"` above zero, usually because the email service's
  allowance for the day ran out — run the same line again later and it
  only sends to the ones who were missed. Run again when everyone's had
  it and it says so and sends nothing.
- When somebody replies asking to be taken off the list:

       insert into public.recap_email_optouts (email) values ('someone@example.com');

- The Resend key is the Edge Function secret `RESEND_API_KEY`. It never
  goes in this repo, in a chat, or in the database.
