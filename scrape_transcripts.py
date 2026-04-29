#!/usr/bin/env python3
"""
Scrape Rick and Morty transcripts from the fandom wiki via MediaWiki API.
Outputs one .txt file per episode into ./transcripts/
"""

import requests
import json
import re
import time
from pathlib import Path

BASE = "https://rickandmorty.fandom.com/api.php"
OUT  = Path(__file__).parent / "transcripts"
OUT.mkdir(exist_ok=True)

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "CouncilOfRicks-Scraper/1.0 (educational)"})


def get_transcript_pages():
    pages, cont = [], None
    while True:
        params = {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": "Category:Transcripts",
            "cmlimit": "500",
            "format": "json",
        }
        if cont:
            params["cmcontinue"] = cont
        r = SESSION.get(BASE, params=params)
        r.raise_for_status()
        data = r.json()
        pages += [m["title"] for m in data["query"]["categorymembers"]]
        cont = data.get("continue", {}).get("cmcontinue")
        if not cont:
            break
    return pages


def get_wikitext(title):
    r = SESSION.get(BASE, params={
        "action": "query",
        "titles": title,
        "prop": "revisions",
        "rvprop": "content",
        "format": "json",
    })
    r.raise_for_status()
    pages = r.json()["query"]["pages"]
    page = next(iter(pages.values()))
    if "revisions" not in page:
        return ""
    return page["revisions"][0]["*"]


def clean(wikitext):
    t = wikitext
    t = re.sub(r"<ref[^>]*>.*?</ref>", "", t, flags=re.DOTALL)   # footnotes
    t = re.sub(r"<!--.*?-->", "", t, flags=re.DOTALL)              # html comments
    t = re.sub(r"\{\{[^{}]*\}\}", "", t)                           # templates (single-nested)
    t = re.sub(r"\{\{[^{}]*\}\}", "", t)                           # templates (double pass)
    t = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]*)\]\]", r"\1", t)       # wikilinks → display text
    t = re.sub(r"\[https?://\S+ ([^\]]+)\]", r"\1", t)            # external links
    t = re.sub(r"https?://\S+", "", t)                             # bare urls
    t = re.sub(r"'{2,}", "", t)                                    # bold / italic markers
    t = re.sub(r"==+\s*([^=]+?)\s*==+", r"\n--- \1 ---\n", t)    # section headers
    t = re.sub(r"^\s*[*#:;]+\s*", "", t, flags=re.MULTILINE)      # list markers
    t = re.sub(r"<[^>]+>", "", t)                                  # any remaining html tags
    t = re.sub(r"\n{3,}", "\n\n", t)                               # collapse blank lines
    return t.strip()


def safe_filename(title):
    name = title.replace("/Transcript", "").replace("/", "_").replace(" ", "_")
    return re.sub(r"[^\w\-_.]", "", name) + ".txt"


def main():
    print("Fetching transcript page list...")
    titles = get_transcript_pages()
    print(f"Found {len(titles)} transcript pages\n")

    for i, title in enumerate(titles, 1):
        fname = safe_filename(title)
        outpath = OUT / fname
        if outpath.exists():
            print(f"[{i}/{len(titles)}] SKIP (exists): {fname}")
            continue

        print(f"[{i}/{len(titles)}] Fetching: {title}")
        try:
            raw = get_wikitext(title)
            if not raw:
                print(f"  -> Empty, skipping")
                continue
            text = clean(raw)
            outpath.write_text(text, encoding="utf-8")
            print(f"  -> {len(text):,} chars -> {fname}")
        except Exception as e:
            print(f"  -> ERROR: {e}")

        time.sleep(0.5)

    print(f"\nDone. Transcripts in: {OUT}")


if __name__ == "__main__":
    main()
