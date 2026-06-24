#!/usr/bin/env python3
"""
pexels_broll.py — 從 Pexels 搜尋並下載直式 B-roll 素材

用法：
  export PEXELS_API_KEY="你的 API 金鑰"
  python scripts/pexels_broll.py "科技 辦公室" --count 3 --outdir broll/

需求：
  pip install requests
  Pexels API 申請：https://www.pexels.com/api/
"""

import os
import sys
import argparse
import requests
from pathlib import Path


def search_portrait_videos(query: str, count: int, api_key: str) -> list[dict]:
    """搜尋直式（9:16）影片"""
    resp = requests.get(
        "https://api.pexels.com/videos/search",
        headers={"Authorization": api_key},
        params={
            "query": query,
            "per_page": count,
            "orientation": "portrait",
        },
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()

    results = []
    for video in data.get("videos", []):
        # 找最高品質的直式檔案
        best = None
        for f in video["video_files"]:
            if f.get("width", 0) <= f.get("height", 0):  # 確保直式
                if best is None or f.get("width", 0) > best.get("width", 0):
                    best = f
        if best:
            results.append({
                "id": video["id"],
                "url": best["link"],
                "width": best.get("width"),
                "height": best.get("height"),
                "duration": video.get("duration"),
                "photographer": video.get("user", {}).get("name", ""),
            })
    return results


def download_video(url: str, outdir: Path, filename: str) -> Path:
    """下載影片，顯示進度"""
    dest = outdir / filename
    print(f"  下載中：{filename}", end="", flush=True)

    resp = requests.get(url, stream=True, timeout=60)
    resp.raise_for_status()
    total = int(resp.headers.get("content-length", 0))
    downloaded = 0

    with open(dest, "wb") as f:
        for chunk in resp.iter_content(chunk_size=65536):
            f.write(chunk)
            downloaded += len(chunk)
            if total:
                pct = int(downloaded / total * 100)
                print(f"\r  下載中：{filename} [{pct}%]", end="", flush=True)

    print(f"\r  ✓ {filename} ({downloaded // 1024}KB)")
    return dest


def main():
    parser = argparse.ArgumentParser(description="Pexels B-roll 下載器")
    parser.add_argument("query", help="搜尋關鍵字（支援中文）")
    parser.add_argument("--count", type=int, default=3, help="下載數量（預設 3）")
    parser.add_argument("--outdir", default="broll", help="輸出目錄（預設 ./broll）")
    args = parser.parse_args()

    api_key = os.environ.get("PEXELS_API_KEY", "")
    if not api_key:
        print("錯誤：請設定 PEXELS_API_KEY 環境變數", file=sys.stderr)
        print("申請網址：https://www.pexels.com/api/", file=sys.stderr)
        sys.exit(1)

    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    print(f"搜尋「{args.query}」直式 B-roll…")
    videos = search_portrait_videos(args.query, args.count, api_key)

    if not videos:
        print("找不到符合的影片")
        sys.exit(0)

    print(f"找到 {len(videos)} 支影片，開始下載：\n")
    paths = []
    for i, v in enumerate(videos, 1):
        fname = f"broll_{i:02d}_pexels_{v['id']}.mp4"
        path = download_video(v["url"], outdir, fname)
        paths.append(path)
        print(f"     {v['width']}×{v['height']} | {v['duration']}s | © {v['photographer']}")

    print(f"\n完成！共下載 {len(paths)} 支 B-roll 到 {outdir}/")
    for p in paths:
        print(f"  {p}")


if __name__ == "__main__":
    main()
