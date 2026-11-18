"""Adds (or replaces) a version entry in manifest.json, the Jellyfin plugin repository file.

Usage: python3 scripts/update_manifest.py VERSION ZIP_PATH SOURCE_URL [CHANGELOG]
VERSION is like 1.1.0 or 1.1.0.0.
"""
import datetime
import hashlib
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "manifest.json"
TARGET_ABI = "12.0.0.0"


def main() -> None:
    version, zip_path, source_url = sys.argv[1:4]
    changelog = sys.argv[4] if len(sys.argv) > 4 else ""
    version = version.lstrip("v")
    if version.count(".") == 2:
        version += ".0"

    checksum = hashlib.md5(pathlib.Path(zip_path).read_bytes()).hexdigest()
    repo = json.loads(MANIFEST.read_text())
    plugin = repo[0]
    plugin["versions"] = [v for v in plugin["versions"] if v["version"] != version]
    plugin["versions"].insert(0, {
        "version": version,
        "changelog": changelog,
        "targetAbi": TARGET_ABI,
        "sourceUrl": source_url,
        "checksum": checksum,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    })
    plugin["versions"].sort(key=lambda v: [int(p) for p in v["version"].split(".")], reverse=True)
    MANIFEST.write_text(json.dumps(repo, indent=2) + "\n")
    print(f"manifest.json: {version} md5 {checksum}")


if __name__ == "__main__":
    main()
