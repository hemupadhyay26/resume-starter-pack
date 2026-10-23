# Editor walkthrough

Recorded from the real editor using Playwright. All edited content is fictional.
Network interception keeps changes in the recording context rather than saving
them to the repository's data files.

Regenerate with:

```sh
npm ci
npx playwright install chromium
npm run record:demo
```

The script starts its own loopback server on a free port, records at 1440 x 1000,
and creates an H.264 MP4, an animated GIF preview, and a PNG poster in this folder.
Raw recordings and intermediate screenshots remain in ignored output/.
The local ffmpeg-static package performs encoding; no video service is used.
