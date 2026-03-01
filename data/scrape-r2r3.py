#!/usr/bin/env python3
"""Scrape BRKC Rounds 2 and 3, append to existing CSVs."""

import csv
import re
import subprocess
import os
import time

UA = "Mozilla/5.0"
BASE = "https://results.alphatiming.co.uk/lorainohiokartplex/e"

SESSIONS = []

# Round 2 - Event 316853 (July 12, 2025)
# Qualifying sessions
for sid, cls, stype in [
    (660995, "206 Junior/390/Senior", "Q"),
    (660996, "206 Mini/Cadet / T4 Mini", "Q"),
    (660997, "ROTAX Junior Max", "Q"),
    (660999, "T4 Junior", "Q"),
    (661000, "T4 Senior", "Q"),
    (661001, "Piston Kup/Bambino", "Q"),
    # Pre-Finals (treat as H1)
    (661494, "206 Junior/390/Senior", "PF"),
    (661514, "206 Mini/Cadet / T4 Mini", "PF"),
    (661536, "ROTAX Junior Max", "PF"),
    (661624, "T4 Junior", "PF"),
    (661747, "T4 Senior", "PF"),
    (661722, "Piston Kup/Bambino", "PF"),
    # Finals
    (661935, "206 Junior/390/Senior", "F"),
    (661947, "206 Mini/Cadet / T4 Mini", "F"),
    (661955, "ROTAX Junior Max", "F"),
    (661974, "T4 Junior", "F"),
    (661988, "T4 Senior", "F"),
    (661888, "Piston Kup/Bambino", "F"),
]:
    SESSIONS.append(("Round 2", "2025-07-12", 316853, sid, cls, stype))

# Round 3 - Event 317421 (August 30, 2025)
# Qualifying sessions
for sid, cls, stype in [
    (662458, "206 Junior/390/Senior", "Q"),
    (662459, "206 Mini/Cadet / T4 Mini", "Q"),
    (662460, "ROTAX Junior Max / IAME KA Senior", "Q"),
    (662461, "T4 Junior", "Q"),
    (662462, "T4 Senior", "Q"),
    (662463, "Piston Kup/Bambino", "Q"),
    # Pre-Finals
    (662600, "206 Junior/390/Senior", "PF"),
    (662603, "206 Mini/Cadet / T4 Mini", "PF"),
    (662616, "ROTAX Junior Max / IAME KA Senior", "PF"),
    (662625, "T4 Junior", "PF"),
    (662639, "T4 Senior", "PF"),
    (662648, "Piston Kup/Bambino", "PF"),
    # Finals
    (662751, "206 Junior/390/Senior", "F"),
    (662769, "206 Mini/Cadet / T4 Mini", "F"),
    (662789, "ROTAX Junior Max / IAME KA Senior", "F"),
    (662810, "T4 Junior", "F"),
    (662824, "T4 Senior", "F"),
    (662708, "Piston Kup/Bambino", "F"),
]:
    SESSIONS.append(("Round 3", "2025-08-30", 317421, sid, cls, stype))


def fetch_url(url):
    result = subprocess.run(
        ["curl", "-sL", "-A", UA, url],
        capture_output=True, text=True, timeout=30
    )
    return result.stdout


def parse_results(html):
    drivers = []
    table_match = re.findall(
        r'<table class="at-session-results-table"[^>]*>([\s\S]*?)</table>', html
    )
    if not table_match:
        return drivers

    table = table_match[0]
    rows = re.findall(r'<tr[^>]*>([\s\S]*?)</tr>', table)

    for row in rows:
        if '<th' in row:
            continue
        tds = re.findall(r'<td[^>]*>([\s\S]*?)</td>', row)
        if not tds:
            continue

        cells = []
        for td in tds:
            text = re.sub(r'<[^>]+>', '', td).strip()
            text = ' '.join(text.split())
            cells.append(text)

        if len(cells) <= 2:
            continue
        if any('Result' in c for c in cells[:2]):
            continue

        driver = {
            'pos': '', 'no': '', 'name': '', 'cls': '',
            'laps': '', 'avg_speed': '', 'gap': '', 'best': '',
            'best_on': '', 'team': ''
        }

        mph_idx = None
        for i, c in enumerate(cells):
            if 'MPH' in c:
                mph_idx = i
                break

        name_idx = None
        for i, c in enumerate(cells):
            if re.match(r'^[A-Za-z][A-Za-z\s\.\'-]{3,}$', c) and ' ' in c:
                name_idx = i
                break
        if name_idx is None:
            for i, c in enumerate(cells):
                if re.match(r'^[A-Za-z][A-Za-z\s\.\'-]{3,}$', c):
                    name_idx = i
                    break

        if name_idx is not None:
            driver['name'] = cells[name_idx]
            driver['pos'] = cells[0] if cells[0] else ''
            if name_idx >= 2:
                driver['no'] = cells[name_idx - 1]
            elif name_idx == 1:
                driver['no'] = cells[0]
            if name_idx + 1 < len(cells):
                cls_val = cells[name_idx + 1]
                if cls_val and not cls_val.isdigit() and 'MPH' not in cls_val:
                    driver['cls'] = cls_val

        if mph_idx is not None:
            driver['avg_speed'] = cells[mph_idx]
            for back in [1, 2]:
                idx = mph_idx - back
                if idx >= 0 and cells[idx].isdigit():
                    driver['laps'] = cells[idx]
                    break
            if mph_idx + 1 < len(cells):
                driver['gap'] = cells[mph_idx + 1]

        for i, c in enumerate(cells):
            if re.match(r'^\d+:\d+\.\d+$', c):
                driver['best'] = c
                if i + 1 < len(cells) and cells[i + 1].isdigit():
                    driver['best_on'] = cells[i + 1]
                break

        if cells[-1] and re.match(r'^[A-Za-z]', cells[-1]) and cells[-1] != driver['name']:
            driver['team'] = cells[-1]
        elif len(cells) >= 2 and cells[-2] and re.match(r'^[A-Za-z]', cells[-2]) and cells[-2] != driver['name'] and cells[-2] != driver['cls']:
            driver['team'] = cells[-2]

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
    results_file = os.path.join(data_dir, "brkc-results.csv")
    laptimes_file = os.path.join(data_dir, "brkc-laptimes.csv")

    # Read existing data to find max laps column count
    existing_max_laps = 0
    if os.path.exists(laptimes_file):
        with open(laptimes_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader)
            lap_cols = [h for h in header if h.startswith('L')]
            existing_max_laps = len(lap_cols)

    new_results = []
    new_laptimes = []
    max_laps = existing_max_laps

    total = len(SESSIONS)
    for i, (round_name, date, event_id, session_id, class_name, session_type) in enumerate(SESSIONS):
        print(f"[{i+1}/{total}] {round_name} - {class_name} {session_type} (sid={session_id})")

        result_html = fetch_url(f"{BASE}/{event_id}/s/{session_id}/result")
        time.sleep(0.15)
        laptimes_html = fetch_url(f"{BASE}/{event_id}/s/{session_id}/laptimes")
        time.sleep(0.15)

        drivers = parse_results(result_html)
        has_data = any(d.get('laps', '0') not in ('', '0') for d in drivers)

        lt_data = parse_laptimes(laptimes_html)
        if lt_data:
            has_data = True

        if not has_data:
            print(f"  -> Skipped (no data)")
            continue

        print(f"  -> {len(drivers)} results, {len(lt_data)} laptimes entries")

        for d in drivers:
            new_results.append({
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
            new_laptimes.append(lt_row)

    # Read existing results and prepend new data (R2, R3 come before R4)
    existing_results = []
    if os.path.exists(results_file):
        with open(results_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                existing_results.append(row)

    existing_laptimes = []
    if os.path.exists(laptimes_file):
        with open(laptimes_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                existing_laptimes.append(row)

    # Write combined results CSV (new rounds first, then existing)
    print(f"\nAdding {len(new_results)} new result rows (total with existing: {len(new_results) + len(existing_results)})")
    with open(results_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Round', 'Date', 'Class', 'Session', 'Pos', 'Kart#',
                         'Driver', 'Class Code', 'Laps', 'Avg Speed', 'Gap',
                         'Best Lap', 'Best On Lap', 'Team'])

        # New data first (Round 2, 3)
        for row in new_results:
            writer.writerow([
                row.get('round'), row.get('date'), row.get('class'),
                row.get('session_type'), row.get('pos'), row.get('no'),
                row.get('name'), row.get('cls'), row.get('laps'),
                row.get('avg_speed'), row.get('gap'), row.get('best'),
                row.get('best_on'), row.get('team'),
            ])
        # Existing data (Round 4, 5, 6)
        for row in existing_results:
            writer.writerow([
                row.get('Round'), row.get('Date'), row.get('Class'),
                row.get('Session'), row.get('Pos'), row.get('Kart#'),
                row.get('Driver'), row.get('Class Code'), row.get('Laps'),
                row.get('Avg Speed'), row.get('Gap'), row.get('Best Lap'),
                row.get('Best On Lap'), row.get('Team'),
            ])

    # Write combined laptimes CSV
    print(f"Adding {len(new_laptimes)} new laptime rows (total: {len(new_laptimes) + len(existing_laptimes)})")
    lap_headers = ['Round', 'Date', 'Class', 'Session', 'Driver'] + [f'L{i+1}' for i in range(max_laps)]
    with open(laptimes_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(lap_headers)

        for row in new_laptimes:
            csv_row = [row.get('round'), row.get('date'), row.get('class'),
                       row.get('session_type'), row.get('driver')]
            for j in range(max_laps):
                csv_row.append(row.get(f'L{j+1}', ''))
            writer.writerow(csv_row)

        for row in existing_laptimes:
            csv_row = [row.get('Round'), row.get('Date'), row.get('Class'),
                       row.get('Session'), row.get('Driver')]
            for j in range(max_laps):
                csv_row.append(row.get(f'L{j+1}', ''))
            writer.writerow(csv_row)

    print("Done!")


if __name__ == '__main__':
    main()
