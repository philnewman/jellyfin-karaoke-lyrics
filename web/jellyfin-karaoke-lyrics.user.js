// ==UserScript==
// @name         Jellyfin Karaoke Lyrics
// @namespace    https://github.com/philnewman/jellyfin-karaoke-lyrics
// @version      0.4.1
// @description  Playback-clock lyric highlighting, automatic scrolling, and per-lyrics timing adjustment for Jellyfin Web.
// @match        http://*/web/*
// @match        https://*/web/*
// @match        http://*/*/web/*
// @match        https://*/*/web/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
    "use strict";

    const ROOT = ".lyricPage";
    const LINES = ".lyricsLine.dynamicLyric";
    const STORAGE_KEY = "jkl.offsets.v1";
    const STEP_MS = 100;
    const MAX_OFFSET_MS = 3000;
    const MANUAL_PAUSE_MS = 4500;

    let observer;
    let raf = 0;
    let interval = 0;
    let lastActive = null;
    let pauseUntil = 0;
    let lyricsKey = null;
    let offsetMs = 0;

    function loadOffsets() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
        catch { return {}; }
    }

    function saveOffset() {
        const values = loadOffsets();
        if (offsetMs === 0) delete values[lyricsKey];
        else values[lyricsKey] = offsetMs;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    }

    function fingerprint(lines) {
        const source = lines.map(line => line.textContent.trim()).join("\n");
        let hash = 2166136261;
        for (let i = 0; i < source.length; i++) {
            hash ^= source.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return `lyrics-${(hash >>> 0).toString(16)}`;
    }

    function getPlaybackSeconds() {
        const media = [...document.querySelectorAll("audio, video")]
            .find(element => !element.paused && Number.isFinite(element.currentTime))
            || [...document.querySelectorAll("audio, video")]
                .find(element => Number.isFinite(element.currentTime));
        return media ? media.currentTime : null;
    }

    function getLyricStartSeconds(line) {
        const raw = line.getAttribute("data-lyrictime");
        if (raw == null || raw.trim() === "") return null;
        const value = Number(raw);
        if (!Number.isFinite(value)) return null;

        // Jellyfin 12 Web exposes LyricLine.Start as .NET TimeSpan ticks.
        // Confirmed in the user's browser: 173100000 => 17.31 seconds.
        // Retain compatibility with older builds that expose milliseconds
        // or seconds, but do not treat tick values as milliseconds.
        if (Math.abs(value) >= 1000000) return value / 10000000;
        if (Math.abs(value) >= 1000) return value / 1000;
        return value;
    }

    function formatOffset() {
        return `${offsetMs > 0 ? "+" : ""}${(offsetMs / 1000).toFixed(1)} s`;
    }

    function injectStyles() {
        if (document.getElementById("jkl-style")) return;
        const style = document.createElement("style");
        style.id = "jkl-style";
        style.textContent = `
            .lyricPage .lyricsLine.dynamicLyric.jkl-active {
                color: var(--theme-primary-color, #55b9e9) !important;
                opacity: 1 !important;
                font-weight: 650;
                text-shadow: 0 0 .35em color-mix(in srgb, currentColor 24%, transparent);
            }
            .jkl-controls {
                position: fixed; z-index: 1000; top: 70px; right: 24px;
                display: flex; align-items: center; gap: 7px;
                padding: 7px 10px; border-radius: 8px;
                background: rgba(25,25,25,.9); color: #eee;
                font: 13px sans-serif; box-shadow: 0 2px 12px #0006;
            }
            .jkl-controls button { border: 0; border-radius: 5px; padding: 5px 9px;
                background: #333; color: white; cursor: pointer; font: inherit; }
            .jkl-controls button:hover { background: #505050; }
            .jkl-controls output { min-width: 48px; text-align: center;
                font-variant-numeric: tabular-nums; }
            @media (prefers-reduced-motion: reduce) {
                .lyricPage .lyricsLine.dynamicLyric { transition: none !important; }
            }`;
        document.head.append(style);
    }

    function ensureControls(root) {
        let panel = root.querySelector(".jkl-controls");
        if (!panel) {
            panel = document.createElement("div");
            panel.className = "jkl-controls";
            panel.innerHTML = `<span>Lyric timing</span>
                <button type="button" data-action="advance" aria-label="Advance lyrics">−</button>
                <output aria-live="polite"></output>
                <button type="button" data-action="delay" aria-label="Delay lyrics">+</button>
                <button type="button" data-action="reset">Reset</button>`;
            panel.addEventListener("click", event => {
                const action = event.target.closest("button")?.dataset.action;
                if (!action || !lyricsKey) return;
                if (action === "advance") offsetMs = Math.max(-MAX_OFFSET_MS, offsetMs - STEP_MS);
                if (action === "delay") offsetMs = Math.min(MAX_OFFSET_MS, offsetMs + STEP_MS);
                if (action === "reset") offsetMs = 0;
                saveOffset();
                panel.querySelector("output").textContent = formatOffset();
                lastActive = null;
                console.info(`[Jellyfin Karaoke Lyrics] Timing offset ${formatOffset()} for ${lyricsKey}`);
                schedule();
            });
            root.append(panel);
        }
        panel.querySelector("output").textContent = formatOffset();
    }

    function findActiveLine(root, lines) {
        const playbackSeconds = getPlaybackSeconds();
        if (playbackSeconds !== null) {
            // Negative offset advances lyrics; positive offset delays them.
            // Compare against the audio clock directly, independent of Jellyfin's
            // pastLyric/futureLyric classes (which may be stale or incorrect).
            const adjustedSeconds = playbackSeconds - (offsetMs / 1000);
            let selected = null;
            for (const line of lines) {
                const start = getLyricStartSeconds(line);
                if (start === null) continue;

                // Jellyfin may append a timestamped but empty terminal line.
                // It must not become the highlighted/scroll target after the
                // final sung line. Empty interior lines are also non-vocal cues.
                if (!line.textContent.trim()) continue;
                if (start <= adjustedSeconds) selected = line;
                else break;
            }
            return selected;
        }

        // Fallback only when no browser media clock is available.
        return lines.find(line => !line.classList.contains("pastLyric")
            && !line.classList.contains("futureLyric")) || null;
    }

    function update() {
        const root = document.querySelector(ROOT);
        if (!root) { lastActive = null; lyricsKey = null; return; }
        const lines = [...root.querySelectorAll(LINES)];
        if (!lines.length) return;

        const nextKey = fingerprint(lines);
        if (nextKey !== lyricsKey) {
            lyricsKey = nextKey;
            offsetMs = Number(loadOffsets()[lyricsKey]) || 0;
            lastActive = null;
        }
        ensureControls(root);

        const active = findActiveLine(root, lines);
        if (getPlaybackSeconds() !== null) {
            lines.forEach(line => line.classList.toggle("jkl-active", line === active));
        }
        if (active && active !== lastActive) {
            lastActive = active;
            if (Date.now() >= pauseUntil) {
                active.scrollIntoView({
                    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                    block: "center", inline: "nearest"
                });
            }
        }
    }

    function schedule() {
        if (raf) return;
        raf = requestAnimationFrame(() => { raf = 0; update(); });
    }

    function pauseForManualNavigation(event) {
        if (event.type === "keydown" && !["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) return;
        pauseUntil = Date.now() + MANUAL_PAUSE_MS;
    }

    function start() {
        injectStyles();
        observer = new MutationObserver(schedule);
        observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
        document.addEventListener("timeupdate", schedule, true);
        document.addEventListener("wheel", pauseForManualNavigation, { passive: true });
        document.addEventListener("touchstart", pauseForManualNavigation, { passive: true });
        document.addEventListener("keydown", pauseForManualNavigation);
        interval = window.setInterval(schedule, 250);
        schedule();
        console.info("[Jellyfin Karaoke Lyrics] 0.4.1 loaded");
    }

    start();
})();