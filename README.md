# Jellyfin Karaoke Lyrics

A Jellyfin Web enhancement that keeps timed lyrics in view, highlights the currently playing line, and provides per-track timing adjustment.

**Version:** 0.1.0  
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

## Install the Jellyfin server plugin

The server plugin registers the included browser script with JavaScript Injector. You do not need to install Tampermonkey or another userscript manager when using this integration.

### Requirements

- Jellyfin Server 12.x.
- JavaScript Injector installed and enabled, with a release compatible with your Jellyfin version.
- The Karaoke Lyrics plugin release matching your Jellyfin major version.

### Installation

1. In Jellyfin, install **JavaScript Injector**. If it is not listed in your catalog, add the injector project's repository as documented by that project. Its unified manifest is:
   `https://raw.githubusercontent.com/n00bcodr/jellyfin-plugins/main/manifest.json`
2. Restart Jellyfin after installing JavaScript Injector.
3. Download `jellyfin-karaoke-lyrics-plugin.zip` from the [latest GitHub release](https://github.com/philnewman/jellyfin-karaoke-lyrics/releases/latest).
4. Extract the ZIP. It contains a `Jellyfin.Plugin.KaraokeLyrics` directory with the plugin DLL and `meta.json`.
5. Copy the contents of that directory into a versioned folder under Jellyfin's data `plugins` directory. For version 0.1.0, the folder name is:
   `Jellyfin.Plugin.KaraokeLyrics_0.1.0.0`

   The resulting layout should look like this:

   ```text
   plugins/
   └── Jellyfin.Plugin.KaraokeLyrics_0.1.0.0/
       ├── Jellyfin.Plugin.KaraokeLyrics.dll
       └── meta.json
   ```

6. Restart Jellyfin.
7. In **Dashboard → Plugins → My Plugins**, confirm **Karaoke Lyrics** is listed.
8. Check the Jellyfin server log for a successful JavaScript Injector registration message, then play a track with synchronized lyrics.

For Docker installations, the `plugins` directory is inside the host directory mounted to `/config`. For example, if your Jellyfin config is mounted at `/path/to/jellyfin/config:/config`, install under `/path/to/jellyfin/config/plugins/`.

### Updating or uninstalling

To update, stop Jellyfin, replace the files in the versioned plugin directory with the files from the new release, and start Jellyfin again. Follow any version-specific instructions in the release notes.

To uninstall, stop Jellyfin, remove only the `Jellyfin.Plugin.KaraokeLyrics_<version>` directory, and start Jellyfin. JavaScript Injector is a separate dependency and can remain installed.

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

A version tag matching `v*` triggers the release workflow. The workflow packages the plugin as `jellyfin-karaoke-lyrics-plugin.zip` and attaches it to the GitHub release.

## License

MIT
