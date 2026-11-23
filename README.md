# The Ceilidh Incident — GitHub Pages edition

A shareable first-person Orcadian Strip the Willow game with custom music,
a four-beat count-in, end-of-line scoring and a shared GitHub Issues leaderboard.

**No external app is connected to ChatGPT. No GitHub token or password is included in the game.**
The game is plain static HTML/JavaScript; the publishing and leaderboard
build run inside GitHub Actions with GitHub's built-in repository permissions.

## Quick start (no Git installation)

1. **Create a GitHub repository.** Make a new public repository (for example,
   `the-ceilidh-incident`). Keep **Issues** enabled under **Settings → General → Features**.
   Your company may need to approve public repository hosting first.
2. **Upload the contents of this ZIP** to the repository *root*. Keep the
   `.github/workflows`, `scripts` and `site` directories. GitHub's web-based
   **Add file → Upload files** works; local Git or Blender isn't required.
3. **Edit `site/settings.js` on GitHub.** Fill in the three settings:

   ```js
   window.CEILIDH_CONFIG = {
     musicFile: 'assets/ceilidh-track.mp3',
     bpm: 124, // EXAMPLE: replace with your actual BPM
     publicRepo: 'YOUR_USERNAME_OR_ORG/the-ceilidh-incident',
   };
   ```

4. **Add your soundtrack.** Upload an audio file to
   `site/assets/ceilidh-track.mp3`, matching the `musicFile` setting.
   For a different filename or format (e.g. `.ogg`), edit `musicFile` accordingly.
   Use music you have permission to redistribute on a public website.
5. **Enable deployment.** Go to **Settings → Pages → Build and deployment →
   Source → GitHub Actions**. The workflow called **Publish game and shared
   leaderboard** will deploy the `site/` folder. You may need to enable GitHub
   Actions in repository or organisation settings. Run the workflow once from
   **Actions → Publish game and shared leaderboard → Run workflow** if needed.
6. **Share your Pages URL**, normally
   `https://YOUR_USERNAME.github.io/the-ceilidh-incident/`. Everyone sees the
   same game and the same music.

If the soundtrack isn't uploaded yet, the built-in generated jig plays instead.
For private trial runs, `site/index.html` can be opened as a local file; you
may see local-only leaderboard behaviour until the repo/hosting is configured.

## How shared score submissions work

- A player finishes the line, enters a **nickname**, then clicks **SUBMIT VIA GITHUB**.
- The game opens a pre-filled **new GitHub Issue**. The player signs into GitHub
  and clicks **Submit new issue** to confirm. Merely opening the page does not
  submit a score.
- The score becomes public as an Issue under your repository. The GitHub Actions
  workflow rebuilds `site/leaderboard.json` and republishes the game.
- Players press **Refresh leaderboard** in the game after the deployment completes.
- The leaderboard displays the **best score per GitHub account** (top 25).
  Closed score Issues still count; deleted Issues do not.
- It is a fun **honour-system leaderboard**. Scores can be altered in the Issue
  form, so this isn't cheat-proof. A server-verified leaderboard would need a
  real backend. Nicknames and GitHub account identities are public; never enter
  company secrets, email addresses, or personal information in a score.
- GitHub's Actions workflow is the normal publishing mechanism, and the Pages
  site reads the generated JSON. An unauthenticated GitHub API fallback supports
  local testing, but is subject to GitHub rate limits.

### Changing the music later

Replace `site/assets/ceilidh-track.mp3` and update `bpm` in `site/settings.js`.
Commit the changes: GitHub Actions redeploys the game. The soundtrack starts
on **GO** after the four-beat count-in and loops during play. To line the beats
up precisely, choose a track whose first strong downbeat is at the start of the
file; remove silence or a long intro from the recording before uploading.

### Limitations and security

- **Public website.** GitHub Pages sites are publicly accessible, even if the
  repository is private on plans permitting Pages from private repositories.
  Use company-approved hosting and music only.
- **No automatic anonymous submissions.** GitHub requires a player to sign in
  and confirm an Issue for a shared score. For one-click anonymous submissions,
  a separate backend is unavoidable.
- **No credentials in HTML.** Never paste access tokens, passwords or private
  GitHub keys into `settings.js`, `index.html` or repository files.
- **Third-party runtime dependency.** The game loads the Three.js library
  from jsDelivr. No extra connector access is involved.
- The GitHub Actions workflow uses GitHub's built-in `GITHUB_TOKEN` on GitHub's
  servers, and does not expose it to game visitors.

## Files

- `site/index.html` — the complete Three.js game
- `site/settings.js` — music, BPM and public score-repository configuration
- `site/assets/` — where to place the recording
- `site/leaderboard.json` — generated leaderboard, overwritten on deployment
- `.github/workflows/publish.yml` — deploys the game and refreshes the board
- `scripts/build_leaderboard.py` — strict parser for score Issues
