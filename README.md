# Ink Calendar

A month calendar with the dates already printed, for writing with a tablet pen.
It installs on Android as an app, needs no account, and works with no internet.
Your writing is stored on the device (IndexedDB).

## Put it on your tablet

The app has to be opened **once** from an `https://` address. After that, Chrome
keeps a copy and it works fully offline. The simplest free host is GitHub Pages:

1. Create a new public repository on github.com, for example `ink-calendar`.
2. Upload every file in this folder to it (drag the files onto the repo page and click "Commit changes"),
   or push it with git.
3. In the repo: **Settings → Pages → Branch: `main`, folder `/ (root)` → Save**.
   After a minute it is live at `https://<your-username>.github.io/ink-calendar/`.
4. On the tablet, open that address in **Chrome**, then tap **⋮ → Add to Home screen → Install**.
5. Open it once from the home screen. From now on it works in airplane mode.

## Want a real APK file instead?

Once it is online (step 3), go to <https://www.pwabuilder.com>, paste the address,
choose **Package for stores → Android**, and download the APK. Install it on the
tablet (allow "install unknown apps" for your file manager). No Android Studio needed.

## Backups

Writing lives only on that device. Use **Export → Save a backup file** now and then,
and before clearing Chrome's data, uninstalling, or switching tablets.
**Restore from a backup** brings it back on any device.

## Changing the app

- Test on this computer: `node scripts/serve.mjs`, then open <http://localhost:5178>.
- After changing any file, bump `VERSION` in `sw.js` so installed copies update.
  The tablet picks up the new version the next time it opens the app with internet.
- Icons are drawn by `node scripts/make-icons.mjs`.
