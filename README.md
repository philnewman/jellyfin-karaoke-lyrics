# Jellyfin Karaoke Lyrics

A Jellyfin Web enhancement that keeps timed lyrics in view, highlights the currently playing line, and provides per-track timing adjustment.

**Version:** 0.1.2  
**Jellyfin compatibility:** Jellyfin Server 12.x  
**Requires:** [JavaScript Injector](https://github.com/n00bcodr/jellyfin-plugin-javascript-injector)

## Features

- Highlights the lyric line that corresponds to the audio playback clock.
- Keeps the active line in view and centers it while playback advances.
- Tracks playback in both directions, including when seeking backward.
- Uses Jellyfin 12's lyric timestamps and does not depend on Jellyfin's potentially stale past/future lyric classes when a media clock is available.
- Saves a separate timing offset for each set of lyrics.
- Provides on-screen timing controls in 100 ms increments, from -3.0 to +3.0 seconds, plus reset.
- Briefly pauses automatic scrolling after manual navigation.
- Can run as a server-installed plugin through JavaScript Injector, or as a standalone browser userscript.

## Pairs with Jellyfin Karaoke

For a full karaoke setup, add [Jellyfin Karaoke](https://github.com/philnewman/jellyfin-karaoke).
It puts a karaoke switch and a vocal level slider in the web client's now-playing bar, so you can
turn the singer down while this plugin shows the words. The two can be installed side by side.

## Install the Jellyfin server plugin

The server plugin registers the included browser script with JavaScript Injector. You do not need to install Tampermonkey or another userscript manager when using this integration.

### Requirements

- Jellyfin Server 12.x.
- JavaScript Injector installed and enabled, with a release compatible with your Jellyfin version.
- The Karaoke Lyrics plugin release matching your Jellyfin major version.

### Install from the plugin catalog (recommended)

1. In Jellyfin, install **JavaScript Injector**. If it is not listed in your catalog, add the injector project's repository as documented by that project. Its unified manifest is:
   `https://raw.githubusercontent.com/n00bcodr/jellyfin-plugins/main/manifest.json`
2. Open **Dashboard → Plugins → Repositories** and add a repository:
   - Name: `Karaoke Lyrics`
   - URL: `https://raw.githubusercontent.com/philnewman/jellyfin-karaoke-lyrics/main/manifest.json`
3. Open **Catalog**, find **Jellyfin Karaoke Lyrics** under General, and install it.
4. Restart Jellyfin.
5. Check the Jellyfin server log for a successful JavaScript Injector registration message, then play a track with synchronized lyrics.

Installing from the catalog fills in the plugin's developer and repository details and lets Jellyfin offer updates. To switch a copy you installed by hand, delete its `Jellyfin.Plugin.KaraokeLyrics_<version>` folder, then install from the catalog and restart.

### Or install it by hand

1. Install JavaScript Injector as above and restart Jellyfin.
2. Download `jellyfin-karaoke-lyrics-plugin.zip` from the [latest GitHub release](https://github.com/philnewman/jellyfin-karaoke-lyrics/releases/latest).
3. Unzip it into a versioned folder under Jellyfin's `plugins` directory, for example:

   ```text
   plugins/
   └── Jellyfin.Plugin.KaraokeLyrics_0.1.2.0/
       ├── Jellyfin.Plugin.KaraokeLyrics.dll
       └── meta.json
   ```

4. Restart Jellyfin and confirm **Jellyfin Karaoke Lyrics** is listed under **Dashboard → Plugins**.

For Docker installations, the `plugins` directory is inside the host directory mounted to `/config`. For example, if your Jellyfin config is mounted at `/path/to/jellyfin/config:/config`, install under `/path/to/jellyfin/config/plugins/`.

### Updating or uninstalling

A catalog install updates from **Dashboard → Plugins** like any other plugin. For a hand install, stop Jellyfin, replace the files in the versioned plugin directory with the files from the new release, and start Jellyfin again.

To uninstall, uninstall it from **Dashboard → Plugins** (or remove its `Jellyfin.Plugin.KaraokeLyrics_<version>` directory) and restart Jellyfin. JavaScript Injector is a separate dependency and can remain installed.

## Standalone browser userscript

The standalone userscript is available at [web/jellyfin-karaoke-lyrics.user.js](web/jellyfin-karaoke-lyrics.user.js). Install it with a userscript manager such as Tampermonkey if you prefer not to install the server plugin.

When using the server plugin, disable any separate copy of the Karaoke Lyrics userscript to avoid running the same enhancement twice.

## Build from source

The plugin targets .NET 10 and Jellyfin 12. CI builds the plugin on pushes and pull requests.

To build locally:

```bash
dotnet publish Jellyfin.Plugin.KaraokeLyrics/Jellyfin.Plugin.KaraokeLyrics.csproj \
  --configuration Release \
  --output publish
```

A version tag matching `v*` (for example `v0.1.2`) triggers the release workflow. The workflow packages the plugin as `jellyfin-karaoke-lyrics-plugin.zip`, attaches it to the GitHub release, and adds the version to `manifest.json`, the plugin catalog file, using `scripts/update_manifest.py`.

## License

GPL-3.0, because the plugin builds on Jellyfin's GPL-3.0 libraries. See [LICENSE](LICENSE).
