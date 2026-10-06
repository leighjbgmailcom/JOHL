#!/usr/bin/env bash
# Turns a recap script (plain text, blank line between paragraphs) into
# an MP3 in the Rinkside Report voice.
#
#   tools/recap/make_audio.sh recaps/scripts/2026-10-04.txt recaps/audio/2026-10-04.mp3
#
# The speech engine (sherpa-onnx) and the voice model (Kokoro) are
# downloaded from their GitHub releases the first time, into
# $RECAP_TTS_CACHE (default ~/.cache/johl-recap-tts, about 500 MB).
# Needs curl, tar, awk and ffmpeg.
#
# Write the script the way it should be SAID: numbers as words ("ten to
# five", "forty seconds in"), full sentences rather than one-word
# exclamations, no web addresses or symbols. A name the voice gets wrong
# can be respelled the way it sounds in the script (not on the page).
set -euo pipefail

SCRIPT_FILE=${1:?usage: make_audio.sh <script.txt> <out.mp3>}
OUT=${2:?usage: make_audio.sh <script.txt> <out.mp3>}

CACHE=${RECAP_TTS_CACHE:-$HOME/.cache/johl-recap-tts}
ENGINE_VERSION=1.12.14
ENGINE=sherpa-onnx-v$ENGINE_VERSION-linux-x64-static
MODEL=kokoro-multi-lang-v1_0
VOICE=${RECAP_VOICE_SID:-14}   # 14 = "am_fenrir", the voice picked for the Rinkside Report
SPEED=${RECAP_VOICE_SPEED:-1.0} # larger = slower

mkdir -p "$CACHE"
if [ ! -x "$CACHE/$ENGINE/bin/sherpa-onnx-offline-tts" ]; then
    echo "Downloading the speech engine..." >&2
    curl -sSL -o "$CACHE/engine.tar.bz2" "https://github.com/k2-fsa/sherpa-onnx/releases/download/v$ENGINE_VERSION/$ENGINE.tar.bz2"
    tar xjf "$CACHE/engine.tar.bz2" -C "$CACHE" && rm "$CACHE/engine.tar.bz2"
fi
if [ ! -f "$CACHE/$MODEL/model.onnx" ]; then
    echo "Downloading the voice model..." >&2
    curl -sSL -o "$CACHE/model.tar.bz2" "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/$MODEL.tar.bz2"
    tar xjf "$CACHE/model.tar.bz2" -C "$CACHE" && rm "$CACHE/model.tar.bz2"
fi

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
K="$CACHE/$MODEL"

# A short pause between paragraphs.
ffmpeg -hide_banner -loglevel error -y -f lavfi -i anullsrc=r=24000:cl=mono -t 0.55 "$WORK/gap.wav"

# One clip per paragraph, read in order.
awk -v dir="$WORK" 'BEGIN { RS = ""; ORS = "" } { gsub(/\n/, " "); file = sprintf("%s/p%03d.txt", dir, NR); print > file; close(file) }' "$SCRIPT_FILE"

: > "$WORK/list.txt"
for para in "$WORK"/p*.txt; do
    wav="${para%.txt}.wav"
    "$CACHE/$ENGINE/bin/sherpa-onnx-offline-tts" \
        --kokoro-model="$K/model.onnx" --kokoro-voices="$K/voices.bin" --kokoro-tokens="$K/tokens.txt" \
        --kokoro-data-dir="$K/espeak-ng-data" --kokoro-dict-dir="$K/dict" \
        --kokoro-lexicon="$K/lexicon-us-en.txt,$K/lexicon-zh.txt" \
        --num-threads=4 --sid="$VOICE" --kokoro-length-scale="$SPEED" \
        --output-filename="$wav" "$(cat "$para")" > "$WORK/tts.log" 2>&1 || { cat "$WORK/tts.log" >&2; exit 1; }
    [ -s "$wav" ] || { echo "No audio produced for $para" >&2; cat "$WORK/tts.log" >&2; exit 1; }
    [ -s "$WORK/list.txt" ] && echo "file '$WORK/gap.wav'" >> "$WORK/list.txt"
    echo "file '$wav'" >> "$WORK/list.txt"
done

ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$WORK/list.txt" -c copy "$WORK/all.wav"

# Brought up to a comfortable speaking volume; nothing else is done to the voice.
mkdir -p "$(dirname "$OUT")"
ffmpeg -hide_banner -loglevel error -y -i "$WORK/all.wav" \
    -af "volume=7.5dB,alimiter=limit=0.84:attack=5:release=80" -ar 44100 -ac 1 -b:a 96k "$OUT"

ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT" | awk '{ printf "Wrote %s (%d:%02d)\n", out, $1 / 60, $1 % 60 }' out="$OUT"
