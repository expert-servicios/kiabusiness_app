#!/usr/bin/env python3
"""Build the #143 deployable Supabase baseline from the validated manifest.

This script performs no database access. It concatenates only the ordered portable
SQL files listed in supabase/baseline-candidate/MANIFEST.md and refuses any path
under environment-bound/.
"""

from __future__ import annotations

import argparse
import hashlib
import re
from pathlib import Path

EXPECTED_FILES = 36
DEFAULT_VERSION = "20260912000000"
DEFAULT_NAME = "current_schema_baseline"


def manifest_files(manifest: Path) -> list[str]:
    text = manifest.read_text(encoding="utf-8")
    files = re.findall(r"^\d+\. `([^`]+\.sql)`\s*$", text, flags=re.MULTILINE)
    if len(files) != EXPECTED_FILES:
        raise SystemExit(
            f"Refusing to build: expected {EXPECTED_FILES} ordered SQL files, found {len(files)}"
        )
    if len(files) != len(set(files)):
        raise SystemExit("Refusing to build: duplicate SQL path in MANIFEST.md")
    if any("environment-bound" in item for item in files):
        raise SystemExit("Refusing to build: environment-bound SQL cannot enter the portable baseline")
    return files


def build(repo_root: Path, output: Path) -> str:
    candidate = repo_root / "supabase" / "baseline-candidate"
    manifest = candidate / "MANIFEST.md"
    files = manifest_files(manifest)

    parts = [
        "-- #143 portable current-schema baseline\n",
        "-- GENERATED. Do not edit by hand.\n",
        "-- Source: supabase/baseline-candidate/MANIFEST.md\n",
        "-- Production-specific environment-bound objects are intentionally excluded.\n\n",
    ]

    for idx, relative in enumerate(files, start=1):
        source = candidate / relative
        if not source.is_file():
            raise SystemExit(f"Refusing to build: missing {source}")
        sql = source.read_text(encoding="utf-8").rstrip() + "\n"
        parts.append(f"\n-- BEGIN {idx:02d}/{EXPECTED_FILES}: {relative}\n")
        parts.append(sql)
        parts.append(f"-- END {idx:02d}/{EXPECTED_FILES}: {relative}\n")

    payload = "".join(parts)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(payload, encoding="utf-8", newline="\n")
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", default=DEFAULT_VERSION)
    parser.add_argument("--name", default=DEFAULT_NAME)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    output = args.output or (
        repo_root
        / "supabase"
        / "generated-baseline"
        / f"{args.version}_{args.name}.sql"
    )
    digest = build(repo_root, output)
    print(f"built: {output.relative_to(repo_root)}")
    print(f"sha256: {digest}")


if __name__ == "__main__":
    main()
