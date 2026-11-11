# Jellyfin Karaoke Lyrics

A small Jellyfin Web enhancement that keeps timed lyrics in view, highlights the current line, and provides per-track timing adjustment.

## Current status

This repository is an initial source and CI setup. The browser userscript currently included is **0.3.0**. Its scrolling/highlighting behavior was tested in Jellyfin Web by the maintainer; the plugin wrapper and automated build still need verification against a real Jellyfin 12 installation.

**Do not remove an existing userscript installation until the server-plugin path has been built and tested.**

## How it works

The browser script runs inside Jellyfin Web. The planned server-plugin wrapper registers the script with the third-party [JavaScript Injector](https://github.com/n00bcodr/jellyfin-plugin-javascript-injector) plugin. It does not patch Jellyfin's installed Web files.

## Prerequisites for the server-plugin integration

- Jellyfin Server 12.x
- JavaScript Injector plugin, using a release compatible with Jellyfin 12
- .NET 10 SDK to build locally

Add the JavaScript Injector repository using its unified manifest:

`https://raw.githubusercontent.com/n00bcodr/jellyfin-plugins/main/manifest.json`

Install JavaScript Injector from Jellyfin's catalog, restart Jellyfin, then install this plugin once a verified release is available.

## Development

The project targets .NET 10 and Jellyfin 12. CI builds the plugin on pushes and pull requests. Tagged versions are packaged as GitHub release assets after the build succeeds.

## Browser userscript

For now, the standalone script is in [web/jellyfin-karaoke-lyrics.user.js](web/jellyfin-karaoke-lyrics.user.js). It can be used with a userscript manager such as Tampermonkey.

## License

MIT
