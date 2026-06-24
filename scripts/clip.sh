#!/usr/bin/env bash
# clip.sh — 9:16 短影音自動剪輯流水線
#
# 工具需求：
#   whisper        (pip install openai-whisper)
#   auto-editor    (pip install auto-editor)
#   ffmpeg         (brew install ffmpeg 或 apt install ffmpeg)
#   ImageMagick    (brew install imagemagick 或 apt install imagemagick)
#
# 用法：
#   ./scripts/clip.sh <輸入影片> [標題文字] [背景音樂]
#
# 範例：
#   ./scripts/clip.sh raw.mp4 "Claude Code 真的太猛" bg_music.mp3

set -euo pipefail

# ─── 顏色 ─────────────────────────────────────────────────────────────────────
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${BLUE}[clip]${NC}  $1"; }
ok()   { echo -e "${GREEN}[✓]${NC}    $1"; }
warn() { echo -e "${YELLOW}[!]${NC}    $1"; }
die()  { echo -e "${RED}[✗]${NC}    $1" >&2; exit 1; }

# ─── 參數 ─────────────────────────────────────────────────────────────────────
INPUT="${1:-}"
TITLE="${2:-}"
MUSIC="${3:-}"

[ -z "$INPUT" ] && die "用法：$0 <輸入影片> [標題文字] [背景音樂]"
[ -f "$INPUT" ] || die "找不到影片：$INPUT"

BASENAME=$(basename "$INPUT" | sed 's/\.[^.]*$//')
OUTDIR="output/${BASENAME}"
mkdir -p "$OUTDIR"

log "輸入影片：$INPUT"
log "輸出目錄：$OUTDIR"
echo ""

# ─── 步驟 1：Whisper 轉錄 → SRT ───────────────────────────────────────────────
log "步驟 1/6：Whisper 語音轉文字…"
if command -v whisper &>/dev/null; then
  whisper "$INPUT" \
    --model small \
    --language zh \
    --output_format srt \
    --output_dir "$OUTDIR"
  SRT="$OUTDIR/${BASENAME}.srt"
  ok "SRT 字幕：$SRT"
else
  warn "whisper 未安裝，跳過字幕步驟（pip install openai-whisper）"
  SRT=""
fi
echo ""

# ─── 步驟 2：Auto-Editor 自動快剪（去掉靜音） ─────────────────────────────────
log "步驟 2/6：Auto-Editor 智慧剪輯…"
if command -v auto-editor &>/dev/null; then
  auto-editor "$INPUT" \
    --silent-threshold 0.04 \
    --margin 0.2sec \
    --output "$OUTDIR/${BASENAME}_autocut.mp4"
  AUTOCUT="$OUTDIR/${BASENAME}_autocut.mp4"
  ok "自動剪輯完成：$AUTOCUT"
else
  warn "auto-editor 未安裝，跳過（pip install auto-editor）"
  AUTOCUT="$INPUT"
fi
echo ""

# ─── 步驟 3：ffmpeg 裁切為 9:16 (1080×1920) ──────────────────────────────────
log "步驟 3/6：裁切為 9:16 直式…"
VIDEO916="$OUTDIR/${BASENAME}_916.mp4"
ffmpeg -i "$AUTOCUT" \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
  -c:v libx264 -preset fast -crf 23 \
  -c:a aac -b:a 192k \
  "$VIDEO916" -y -hide_banner -loglevel error
ok "9:16 裁切完成：$VIDEO916"
echo ""

# ─── 步驟 4：ffmpeg 燒錄字幕 ──────────────────────────────────────────────────
log "步驟 4/6：燒錄字幕…"
if [ -n "$SRT" ] && [ -f "$SRT" ]; then
  SUBBED="$OUTDIR/${BASENAME}_subbed.mp4"
  # 將 SRT 路徑的特殊字元跳脫，供 filtergraph 使用
  SRT_ESC=$(echo "$SRT" | sed "s/'/\\\\'/g; s/:/\\\\:/g")
  ffmpeg -i "$VIDEO916" \
    -vf "subtitles='${SRT_ESC}':force_style='Fontname=Noto Sans TC,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Bold=1,Alignment=2,MarginV=60'" \
    -c:v libx264 -preset fast -crf 23 \
    -c:a copy \
    "$SUBBED" -y -hide_banner -loglevel error
  ok "字幕燒錄完成：$SUBBED"
  CURRENT="$SUBBED"
else
  warn "無 SRT 檔，跳過字幕燒錄"
  CURRENT="$VIDEO916"
fi
echo ""

# ─── 步驟 5：ImageMagick + ffmpeg 加標題字卡 ──────────────────────────────────
log "步驟 5/6：加入標題字卡…"
if [ -n "$TITLE" ] && command -v convert &>/dev/null; then
  TITLE_CARD="$OUTDIR/title_card.png"

  convert -size 1080x1920 \
    -gravity Center \
    -background black \
    -fill white \
    -font "DejaVu-Sans-Bold" \
    -pointsize 72 \
    label:"$TITLE" \
    "$TITLE_CARD"

  TITLED="$OUTDIR/${BASENAME}_titled.mp4"
  VID_DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$CURRENT")

  ffmpeg \
    -loop 1 -t 2 -i "$TITLE_CARD" \
    -i "$CURRENT" \
    -filter_complex \
      "[0:v]scale=1080:1920,setsar=1,fade=t=out:st=1.5:d=0.5[title];
       [1:v]scale=1080:1920,setsar=1[main];
       [title][main]concat=n=2:v=1:a=0[v]" \
    -map "[v]" -map "1:a" \
    -c:v libx264 -preset fast -crf 23 \
    -c:a copy \
    "$TITLED" -y -hide_banner -loglevel error
  ok "標題字卡加入完成：$TITLED"
  CURRENT="$TITLED"
elif [ -n "$TITLE" ]; then
  warn "ImageMagick 未安裝，跳過字卡（brew install imagemagick）"
else
  warn "未提供標題文字，跳過字卡"
fi
echo ""

# ─── 步驟 6：ffmpeg 混入背景音樂 ──────────────────────────────────────────────
log "步驟 6/6：混入背景音樂…"
if [ -n "$MUSIC" ] && [ -f "$MUSIC" ]; then
  FINAL="$OUTDIR/${BASENAME}_final.mp4"
  ffmpeg -i "$CURRENT" -i "$MUSIC" \
    -filter_complex "[1:a]volume=0.15[bg];[0:a][bg]amix=inputs=2:duration=first[a]" \
    -map "0:v" -map "[a]" \
    -c:v copy \
    -c:a aac -b:a 192k \
    "$FINAL" -y -hide_banner -loglevel error
  ok "音樂混入完成：$FINAL"
  CURRENT="$FINAL"
elif [ -n "$MUSIC" ]; then
  warn "找不到音樂檔：$MUSIC，跳過"
else
  warn "未提供背景音樂，跳過"
fi
echo ""

# ─── 完成 ──────────────────────────────────────────────────────────────────────
FINAL_OUT="$OUTDIR/${BASENAME}_final.mp4"
if [ "$CURRENT" != "$FINAL_OUT" ]; then
  cp "$CURRENT" "$FINAL_OUT"
fi

echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  完成！輸出影片：${NC}"
echo -e "${GREEN}  $FINAL_OUT${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
