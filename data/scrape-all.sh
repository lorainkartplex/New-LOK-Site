#!/bin/bash
# Scrape all BRKC Round 4, 5, 6 competitive sessions from Alpha Timing
# Outputs: /tmp/brkc_round4_raw.txt, /tmp/brkc_round5_raw.txt, /tmp/brkc_round6_raw.txt

UA="Mozilla/5.0"
BASE="https://results.alphatiming.co.uk/lorainohiokartplex/e"

scrape_session() {
  local event_id="$1"
  local session_id="$2"
  local session_name="$3"
  local outfile="$4"

  echo "=== SESSION: $session_name (ID: $session_id) ===" >> "$outfile"

  # Result tab
  echo "=== RESULTS ===" >> "$outfile"
  curl -sL -A "$UA" "$BASE/$event_id/s/$session_id/result" | sed -n '/<table class="at-session-results-table"/,/<\/table>/p' | sed 's/<[^>]*>//g' | tr -s ' \t' ' ' | sed '/^ $/d' | sed '/^$/d' >> "$outfile"

  # Laptimes tab
  echo "=== LAPTIMES ===" >> "$outfile"
  curl -sL -A "$UA" "$BASE/$event_id/s/$session_id/laptimes" | sed -n '/<table class="at-session-results-table"\|Download laptimes/,/<\/table>\|var ctx/p' | sed 's/<[^>]*>//g' | tr -s ' \t' ' ' | sed '/^ $/d' | sed '/^$/d' | grep -v 'var ctx\|Download laptimes\|Click on a driver' >> "$outfile"

  echo "" >> "$outfile"
  echo "Scraped: $session_name" >&2
}

# ===== ROUND 4 =====
R4FILE="/tmp/brkc_round4_raw.txt"
echo "===== BRKC ROUND 4 - October 11, 2025 =====" > "$R4FILE"
echo "" >> "$R4FILE"

# Event 325539 - Practice day qualifying
scrape_session 325539 680060 "ROTAX Junior Max Qualifying" "$R4FILE"
scrape_session 325539 680061 "206 MINI/Cadet Qualifying" "$R4FILE"
scrape_session 325539 680062 "206 390 Qualifying" "$R4FILE"
scrape_session 325539 680063 "206 Senior Qualifying" "$R4FILE"
scrape_session 325539 680064 "IAME KA 385 Qualifying" "$R4FILE"
scrape_session 325539 680065 "IAME KA Senior Qualifying" "$R4FILE"
scrape_session 325539 680066 "TaG/X30 Qualifying" "$R4FILE"
scrape_session 325539 680067 "Piston Kup/Bambino Qualifying" "$R4FILE"
scrape_session 325539 680068 "Tillotson T4 Junior Qualifying" "$R4FILE"
scrape_session 325539 680069 "Tillotson T4 Senior Qualifying" "$R4FILE"

# Event 325550 - Race day
scrape_session 325550 680387 "206 Mini/Cadet Quali" "$R4FILE"
scrape_session 325550 680412 "T4 Junior Quali" "$R4FILE"
scrape_session 325550 680426 "206 Sr/Master Quali" "$R4FILE"
scrape_session 325550 680454 "2-Stroke Quali" "$R4FILE"
scrape_session 325550 680563 "Piston Cup/Bambino Heat 1" "$R4FILE"
scrape_session 325550 680457 "206 Mini/Cadet Heat 1" "$R4FILE"
scrape_session 325550 680462 "T4 Junior Heat 1" "$R4FILE"
scrape_session 325550 680556 "206 Senior/Master Heat 1" "$R4FILE"
scrape_session 325550 680559 "2-Stroke Heat 1" "$R4FILE"
scrape_session 325550 680583 "206 Mini/Cadet Heat 2" "$R4FILE"
scrape_session 325550 680590 "T4 Junior Heat 2" "$R4FILE"
scrape_session 325550 680597 "206 Senior/Master Heat 2" "$R4FILE"
scrape_session 325550 680600 "2-Stroke Heat 2" "$R4FILE"
scrape_session 325550 680634 "206 Mini/Cadet Finals" "$R4FILE"
scrape_session 325550 680638 "T4 Junior Final" "$R4FILE"
scrape_session 325550 680640 "206 Senior/Masters Final" "$R4FILE"
scrape_session 325550 680654 "2-Stroke Finals" "$R4FILE"

echo "Round 4 done." >&2

# ===== ROUND 5 =====
R5FILE="/tmp/brkc_round5_raw.txt"
echo "===== BRKC ROUND 5 - October 12, 2025 =====" > "$R5FILE"
echo "" >> "$R5FILE"

scrape_session 325986 681157 "Mini/Cadet Quali" "$R5FILE"
scrape_session 325986 681159 "206 Senior/Masters Quali" "$R5FILE"
scrape_session 325986 681158 "206/T4 Junior Quali" "$R5FILE"
scrape_session 325986 681185 "2-Stroke Quali" "$R5FILE"
scrape_session 325986 681204 "Kid Kart Heat 1" "$R5FILE"
scrape_session 325986 681262 "Mini/Cadet Heat 1" "$R5FILE"
scrape_session 325986 681274 "206 Senior/Masters Heat 1" "$R5FILE"
scrape_session 325986 681277 "206/T4 Junior Heat 1" "$R5FILE"
scrape_session 325986 681283 "2-Stroke Heat 1" "$R5FILE"
scrape_session 325986 681253 "Kid Kart Heat 2" "$R5FILE"
scrape_session 325986 681263 "Mini/Cadet Heat 2" "$R5FILE"
scrape_session 325986 681275 "206 Seniors/Masters Heat 2" "$R5FILE"
scrape_session 325986 681278 "206/T4 Juniors Heat 2" "$R5FILE"
scrape_session 325986 681285 "2-Stroke Heat 2" "$R5FILE"
scrape_session 325986 681447 "Mini/Cadet Finals" "$R5FILE"
scrape_session 325986 681448 "206 Senior/Masters Final" "$R5FILE"
scrape_session 325986 681449 "206/T4 Junior Finals" "$R5FILE"
scrape_session 325986 681452 "2-Stroke Finals" "$R5FILE"

echo "Round 5 done." >&2

# ===== ROUND 6 =====
R6FILE="/tmp/brkc_round6_raw.txt"
echo "===== BRKC ROUND 6 - November 2, 2025 =====" > "$R6FILE"
echo "" >> "$R6FILE"

scrape_session 327161 683840 "Kid Kart Qualifying" "$R6FILE"
scrape_session 327161 683821 "206 Mini/Cadet Qualifying" "$R6FILE"
scrape_session 327161 683822 "206/T4 Senior/Masters Qualifying" "$R6FILE"
scrape_session 327161 683823 "206 Junior Qualifying" "$R6FILE"
scrape_session 327161 683841 "T4 Mini/Swift Mini Qualifying" "$R6FILE"
scrape_session 327161 683842 "T4 Junior Qualifying" "$R6FILE"
scrape_session 327161 683630 "2-Stroke Qualifying" "$R6FILE"
scrape_session 327161 683948 "Kid Kart Heat 1" "$R6FILE"
scrape_session 327161 683972 "206 Mini/Cadet Heat 1" "$R6FILE"
scrape_session 327161 683973 "206/T4 Seniors/Masters Heat 1" "$R6FILE"
scrape_session 327161 683976 "206 Junior Heat 1" "$R6FILE"
scrape_session 327161 683978 "T4 Mini/Swift Mini Heat 1" "$R6FILE"
scrape_session 327161 683979 "T4 Junior Heat 1" "$R6FILE"
scrape_session 327161 683982 "2-Stroke Heat 1" "$R6FILE"
scrape_session 327161 683985 "Kid Kart Heat 2" "$R6FILE"
scrape_session 327161 683986 "206 Mini/Cadet Heat 2" "$R6FILE"
scrape_session 327161 683987 "206/T4 Seniors/Masters Heat 2" "$R6FILE"
scrape_session 327161 683993 "206 Junior Heat 2" "$R6FILE"
scrape_session 327161 683997 "T4 Mini/Swift Mini Heat 2" "$R6FILE"
scrape_session 327161 683999 "T4 Junior Heat 2" "$R6FILE"
scrape_session 327161 684000 "2-Stroke Heat 2" "$R6FILE"
scrape_session 327161 684082 "206 Mini/Cadet Finals" "$R6FILE"
scrape_session 327161 684086 "206/T4 Senior/Masters Final" "$R6FILE"
scrape_session 327161 684095 "T4/Swift Mini Finals" "$R6FILE"
scrape_session 327161 684099 "206/T4 Junior Finals" "$R6FILE"
scrape_session 327161 684105 "2-Stroke Finals" "$R6FILE"

echo "Round 6 done." >&2
echo "All rounds scraped." >&2
