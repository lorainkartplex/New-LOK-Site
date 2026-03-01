#!/usr/bin/env python3
"""
Parse BRKC Alpha Timing HTML results into CSV spreadsheets.
Fetches result and laptimes tabs from Alpha Timing.
Outputs two CSVs:
  - data/brkc-results.csv  (session standings)
  - data/brkc-laptimes.csv (individual lap times per driver per session)
"""

import csv
import re
import subprocess
import os
import time

UA = "Mozilla/5.0"
BASE = "https://results.alphatiming.co.uk/lorainohiokartplex/e"

SESSIONS = []

# Round 4 - Event 325550 (race day)
for sid, cls, stype in [
    (680387, "206 Mini/Cadet", "Q"), (680412, "T4 Junior", "Q"),
    (680426, "206 Sr/Master", "Q"), (680454, "2-Stroke", "Q"),
    (680563, "Piston Cup/Bambino", "H1"), (680457, "206 Mini/Cadet", "H1"),
    (680462, "T4 Junior", "H1"), (680556, "206 Senior/Master", "H1"),
    (680559, "2-Stroke", "H1"), (680583, "206 Mini/Cadet", "H2"),
    (680590, "T4 Junior", "H2"), (680597, "206 Senior/Master", "H2"),
    (680600, "2-Stroke", "H2"), (680634, "206 Mini/Cadet", "F"),
    (680638, "T4 Junior", "F"), (680640, "206 Senior/Masters", "F"),
    (680654, "2-Stroke", "F"),
]:
    SESSIONS.append(("Round 4", "2025-10-11", 325550, sid, cls, stype))

# Round 5 - Event 325986
for sid, cls, stype in [
    (681157, "Mini/Cadet", "Q"), (681159, "206 Senior/Masters", "Q"),
    (681158, "206/T4 Junior", "Q"), (681185, "2-Stroke", "Q"),
    (681204, "Kid Kart", "H1"), (681262, "Mini/Cadet", "H1"),
    (681274, "206 Senior/Masters", "H1"), (681277, "206/T4 Junior", "H1"),
    (681283, "2-Stroke", "H1"), (681253, "Kid Kart", "H2"),
    (681263, "Mini/Cadet", "H2"), (681275, "206 Senior/Masters", "H2"),
    (681278, "206/T4 Junior", "H2"), (681285, "2-Stroke", "H2"),
    (681447, "Mini/Cadet", "F"), (681448, "206 Senior/Masters", "F"),
    (681449, "206/T4 Junior", "F"), (681452, "2-Stroke", "F"),
]:
    SESSIONS.append(("Round 5", "2025-10-12", 325986, sid, cls, stype))

# Round 6 - Event 327161
for sid, cls, stype in [
    (683840, "Kid Kart", "Q"), (683821, "206 Mini/Cadet", "Q"),
    (683822, "206/T4 Senior/Masters", "Q"), (683823, "206 Junior", "Q"),
    (683841, "T4 Mini/Swift Mini", "Q"), (683842, "T4 Junior", "Q"),
    (683630, "2-Stroke", "Q"), (683948, "Kid Kart", "H1"),
    (683972, "206 Mini/Cadet", "H1"), (683973, "206/T4 Seniors/Masters", "H1"),
    (683976, "206 Junior", "H1"), (683978, "T4 Mini/Swift Mini", "H1"),
    (683979, "T4 Junior", "H1"), (683982, "2-Stroke", "H1"),
    (683985, "Kid Kart", "H2"), (683986, "206 Mini/Cadet", "H2"),
    (683987, "206/T4 Seniors/Masters", "H2"), (683993, "206 Junior", "H2"),
    (683997, "T4 Mini/Swift Mini", "H2"), (683999, "T4 Junior", "H2"),
    (684000, "2-Stroke", "H2"), (684082, "206 Mini/Cadet", "F"),
    (684086, "206/T4 Senior/Masters", "F"), (684095, "T4/Swift Mini", "F"),
    (684099, "206/T4 Junior", "F"), (684105, "2-Stroke", "F"),
]:
    SESSIONS.append(("Round 6", "2025-11-02", 327161, sid, cls, stype))


def fetch_url(url):
    result = subprocess.run(
        ["curl", "-sL", "-A", UA, url],
        capture_output=True, text=True, timeout=30
    )
    return result.stdout


def parse_results(html):
    """Parse result table. Returns list of dicts."""
    drivers = []

    # Find the results table
    table_match = re.findall(
        r'<table class="at-session-results-table"[^>]*>([\s\S]*?)</table>', html
    )
    if not table_match:
        return drivers

    table = table_match[0]
    rows = re.findall(r'<tr[^>]*>([\s\S]*?)</tr>', table)

    for row in rows:
        # Skip header rows (th elements)
        if '<th' in row:
            continue

        tds = re.findall(r'<td[^>]*>([\s\S]*?)</td>', row)
        if not tds:
            continue

        # Clean each cell
        cells = []
        for td in tds:
            text = re.sub(r'<[^>]+>', '', td).strip()
            text = ' '.join(text.split())
            cells.append(text)

        # Skip sub-header rows like "Full Result", "206 MINI/Cadet Result", etc.
        if len(cells) <= 2:
            continue
        if cells[0] in ('Full Result', '') and any('Result' in c for c in cells):
            continue
        # Skip if first cell has "Result" in it
        if 'Result' in cells[0]:
            continue

        # Table structure (13 cols typically):
        # [0] Pos, [1] pos-change, [2] Kart#, [3] Name, [4] Cls,
        # [5] Laps, [6] empty, [7] Avg Speed, [8] Gap, [9] Best Lap,
        # [10] Best On Lap, [11] empty/team-icon, [12] Team
        #
        # But sometimes fewer columns (no Cls, no Team, etc.)
        # Key identifiers: MPH in avg speed, M:SS.SSS in best lap

        driver = {
            'pos': '', 'no': '', 'name': '', 'cls': '',
            'laps': '', 'avg_speed': '', 'gap': '', 'best': '',
            'best_on': '', 'team': ''
        }

        # Find anchor fields
        mph_idx = None
        for i, c in enumerate(cells):
            if 'MPH' in c:
                mph_idx = i
                break

        # Find name (first cell with 2+ alpha words)
        name_idx = None
        for i, c in enumerate(cells):
            if re.match(r'^[A-Za-z][A-Za-z\s\.\'-]{3,}$', c) and ' ' in c:
                name_idx = i
                break

        if name_idx is None:
            # Maybe DNS/DNF entry with just a name
            for i, c in enumerate(cells):
                if re.match(r'^[A-Za-z][A-Za-z\s\.\'-]{3,}$', c):
                    name_idx = i
                    break

        if name_idx is not None:
            driver['name'] = cells[name_idx]

            # Pos is typically cells[0]
            driver['pos'] = cells[0] if cells[0] else ''

            # Kart# is right before name (skip pos-change between pos and kart#)
            if name_idx >= 2:
                driver['no'] = cells[name_idx - 1]
            elif name_idx == 1:
                driver['no'] = cells[0]

            # Class is right after name (if present)
            if name_idx + 1 < len(cells):
                cls_val = cells[name_idx + 1]
                if cls_val and not cls_val.isdigit() and 'MPH' not in cls_val:
                    driver['cls'] = cls_val

        if mph_idx is not None:
            driver['avg_speed'] = cells[mph_idx]
            # Laps is 1-2 cells before MPH
            for back in [1, 2]:
                idx = mph_idx - back
                if idx >= 0 and cells[idx].isdigit():
                    driver['laps'] = cells[idx]
                    break
            # Gap is right after MPH
            if mph_idx + 1 < len(cells):
                gap = cells[mph_idx + 1]
                # Gap is a number, "X Laps", or empty for leader
                driver['gap'] = gap

        # Best lap: M:SS.SSS pattern
        for i, c in enumerate(cells):
            if re.match(r'^\d+:\d+\.\d+$', c):
                driver['best'] = c
                # Best on lap is next cell
                if i + 1 < len(cells) and cells[i + 1].isdigit():
                    driver['best_on'] = cells[i + 1]
                break

        # Team: last non-empty cell if it's text
        if cells[-1] and re.match(r'^[A-Za-z]', cells[-1]) and cells[-1] != driver['name']:
            driver['team'] = cells[-1]
        # Also check second-to-last
        elif len(cells) >= 2 and cells[-2] and re.match(r'^[A-Za-z]', cells[-2]) and cells[-2] != driver['name'] and cells[-2] != driver['cls']:
            driver['team'] = cells[-2]

        # Handle DNS/DNF
        if not mph_idx:
            for c in cells:
                if c in ('DNS', 'DNF', 'DSQ'):
                    driver['pos'] = c
                    driver['laps'] = '0'
                    break

        if driver['name']:
            drivers.append(driver)

    return drivers


def parse_laptimes(html):
    """Parse laptimes from the chart JS data embedded in the page.
    Returns dict: { driver_name: [lap_time_strings] }
    """
    drivers = {}
    datasets = re.findall(r'\{label:"([^"]+)"[^}]*data:\[([^\]]*)\]', html)

    for name, data_str in datasets:
        if not data_str.strip():
            continue
        laps = []
        for val in data_str.split(','):
            try:
                secs = float(val.strip())
                if secs > 0:
                    mins = int(secs // 60)
                    remainder = secs % 60
                    laps.append(f"{mins}:{remainder:06.3f}")
                else:
                    laps.append("")
            except (ValueError, TypeError):
                laps.append("")
        if any(laps):
            drivers[name] = laps

    return drivers


def main():
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)))
    os.makedirs(data_dir, exist_ok=True)

    results_file = os.path.join(data_dir, "brkc-results.csv")
    laptimes_file = os.path.join(data_dir, "brkc-laptimes.csv")

    results_rows = []
    laptimes_rows = []
    max_laps = 0

    total = len(SESSIONS)
    for i, (round_name, date, event_id, session_id, class_name, session_type) in enumerate(SESSIONS):
        print(f"[{i+1}/{total}] {round_name} - {class_name} {session_type} (sid={session_id})")

        # Fetch result tab
        result_html = fetch_url(f"{BASE}/{event_id}/s/{session_id}/result")
        time.sleep(0.15)

        # Fetch laptimes tab
        laptimes_html = fetch_url(f"{BASE}/{event_id}/s/{session_id}/laptimes")
        time.sleep(0.15)

        # Parse results
        drivers = parse_results(result_html)

        # Check for data
        has_data = any(d.get('laps', '0') not in ('', '0') for d in drivers)

        # Parse lap times
        lt_data = parse_laptimes(laptimes_html)
        if lt_data:
            has_data = True

        if not has_data:
            print(f"  -> Skipped (no data)")
            continue

        print(f"  -> {len(drivers)} results, {len(lt_data)} laptimes entries")

        for d in drivers:
            results_rows.append({
                'round': round_name, 'date': date, 'class': class_name,
                'session_type': session_type, **d
            })

        for driver_name, laps in lt_data.items():
            lt_row = {
                'round': round_name, 'date': date, 'class': class_name,
                'session_type': session_type, 'driver': driver_name,
            }
            for j, lap in enumerate(laps):
                lt_row[f'L{j+1}'] = lap
            if len(laps) > max_laps:
                max_laps = len(laps)
            laptimes_rows.append(lt_row)

    # Write results CSV
    print(f"\nWriting {len(results_rows)} result rows to {results_file}")
    with open(results_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Round', 'Date', 'Class', 'Session', 'Pos', 'Kart#',
                         'Driver', 'Class Code', 'Laps', 'Avg Speed', 'Gap',
                         'Best Lap', 'Best On Lap', 'Team'])
        for row in results_rows:
            writer.writerow([
                row.get('round'), row.get('date'), row.get('class'),
                row.get('session_type'), row.get('pos'), row.get('no'),
                row.get('name'), row.get('cls'), row.get('laps'),
                row.get('avg_speed'), row.get('gap'), row.get('best'),
                row.get('best_on'), row.get('team'),
            ])

    # Write laptimes CSV
    print(f"Writing {len(laptimes_rows)} laptime rows to {laptimes_file}")
    lap_headers = ['Round', 'Date', 'Class', 'Session', 'Driver'] + [f'L{i+1}' for i in range(max_laps)]
    with open(laptimes_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(lap_headers)
        for row in laptimes_rows:
            csv_row = [
                row.get('round'), row.get('date'), row.get('class'),
                row.get('session_type'), row.get('driver'),
            ]
            for j in range(max_laps):
                csv_row.append(row.get(f'L{j+1}', ''))
            writer.writerow(csv_row)

    print("Done!")


if __name__ == '__main__':
    main()
