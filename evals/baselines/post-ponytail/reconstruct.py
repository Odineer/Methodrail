import hashlib
import json
from pathlib import Path
import subprocess
import sys

record = Path(__file__).resolve().parent
repo = record.parents[2]
manifest = json.loads((record / "manifest.json").read_text())
destination = Path(sys.argv[1]).resolve()
destination.mkdir(parents=True, exist_ok=False)
archive = subprocess.check_output(
    ["git", "archive", manifest["base_commit"]], cwd=repo
)
subprocess.run(["tar", "-x", "-C", str(destination)], input=archive, check=True)
subprocess.run(
    ["git", "apply", "--check", str(record / manifest["patch"])],
    cwd=destination, check=True,
)
subprocess.run(
    ["git", "apply", str(record / manifest["patch"])],
    cwd=destination, check=True,
)
for path, expected in (manifest["files"] | manifest["historical_hashes"]).items():
    actual = hashlib.sha256((destination / path).read_bytes()).hexdigest()
    if actual != expected:
        raise SystemExit(f"Hash mismatch: {path}: {actual}")
print(f"Verified {len(manifest['files'])} skill/reference files and all historical hashes: {destination}")
