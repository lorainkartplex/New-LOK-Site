#!/usr/bin/env python3
"""Scrape all BRKC practice sessions for Rounds 2-6 and append to existing CSVs."""

import csv
import re
import subprocess
import os
import time

UA = "Mozilla/5.0"
BASE = "https://results.alphatiming.co.uk/lorainohiokartplex/e"

SESSIONS = []

# Round 2 - Event 316853 (2025-09-06)
for sid, cls in [
    (660988, "206 Junior/390/Senior"),
    (660989, "206 Mini/Cadet / T4 Mini"),
    (660990, "ROTAX Junior Max"),
    (660992, "T4 Junior"),
    (660993, "T4 Senior"),
    (660994, "Piston Kup/Bambino"),
]:
    SESSIONS.append(("Round 2", "2025-09-06", 316853, sid, cls, "P"))

# Round 3 - Event 317421 (2025-09-07)
for sid, cls in [
    (662452, "206 Junior/390/Senior"),
    (662453, "206 Mini/Cadet / T4 Mini"),
    (662454, "ROTAX Junior Max / IAME KA Senior"),
    (662455, "T4 Junior"),
    (662456, "T4 Senior"),
    (662457, "Piston Kup/Bambino"),
]:
    SESSIONS.append(("Round 3", "2025-09-07", 317421, sid, cls, "P"))

# Round 4 - Event 325539 practice day (2025-10-11)
for sid, cls in [
    (680050, "ROTAX Junior Max"),
    (680051, "206 Mini/Cadet"),
    (680052, "206 390"),
    (680053, "206 Senior"),
    (680054, "IAME KA 385"),
    (680055, "IAME KA Senior"),
    (680056, "TaG/X30"),
    (680057, "Piston Kup/Bambino"),
    (680058, "T4 Junior"),
    (680059, "T4 Senior"),
]:
    SESSIONS.append(("Round 4", "2025-10-11", 325539, sid, cls, "P"))

# Round 4 - Event 325550 race day practices (2025-10-11)
# These are combined/unnamed practices - scrape and identify from data
for sid, cls in [
    (680120, "Combined Practice 1"),
    (680134, "Combined Practice 2a"),
    (680136, "Combined Practice 2b"),
    (680157, "Combined Practice 2c"),
    (680158, "Combined Practice 2d"),
    (680171, "Combined Practice 3a"),
    (680197, "Combined Practice 3b"),
    (680198, "Combined Practice 3c"),
    (680241, "Combined Practice 3d"),
    (680242, "Combined Practice 4a"),
    (680259, "Combined Practice 4b"),
    (680260, "Combined Practice 4c"),
    (680261, "Combined Practice 4d"),
    (680262, "Combined Practice 4e"),
]:
    SESSIONS.append(("Round 4", "2025-10-11", 325550, sid, cls, "P"))

# Round 5 - Event 325986 (2025-10-12)
for sid, cls in [
    (681123, "Mini/Cadet"),
    (681124, "Kid Kart"),
    (681125, "Junior"),
    (681126, "Senior/Master"),
    (681127, "Kid Kart"),
    (681128, "Mini/Cadet"),
    (681129, "Junior"),
    (681130, "Senior/Master"),
]:
    SESSIONS.append(("Round 5", "2025-10-12", 325986, sid, cls, "P"))

# Round 6 - Event 327161 (2025-10-18)
for sid, cls in [
    (683461, "Mini/Cadet"),
    (683477, "Junior"),
    (683478, "Senior/Master"),
    (683450, "Kid Kart"),
    (683484, "Mini/Cadet"),
    (683502, "Junior"),
    (683503, "Senior/Master"),
    (683504, "Kid Kart"),
    (683506, "Mini/Cadet"),
    (683507, "Junior"),
    (683508, "Senior/Master"),
]:
    SESSIONS.append(("Round 6", "2025-10-18", 327161, sid, cls, "P"))


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

    # Read existing data
    existing_results = []
    with open(results_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            existing_results.append(row)

    existing_laptimes = []
    existing_max_laps = 0
    with open(laptimes_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        header = next(csv.reader(open(laptimes_file)))
        lap_cols = [h for h in header if h.startswith('L')]
        existing_max_laps = len(lap_cols)
        f.seek(0)
        reader = csv.DictReader(f)
        for row in reader:
            existing_laptimes.append(row)

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

    # Merge: insert practice rows before existing competitive rows for each round
    # Sort order: Round 2 P, Round 2 Q/PF/F, Round 3 P, Round 3 Q/PF/F, etc.
    all_results = new_results  # practice data
    all_results_sorted = []

    # Group new practice by round
    practice_by_round = {}
    for r in new_results:
        rnd = r['round']
        if rnd not in practice_by_round:
            practice_by_round[rnd] = []
        practice_by_round[rnd].append(r)

    # Group existing by round
    existing_by_round = {}
    for r in existing_results:
        rnd = r['Round']
        if rnd not in existing_by_round:
            existing_by_round[rnd] = []
        existing_by_round[rnd].append(r)

    # Merge in order
    for rnd in ['Round 2', 'Round 3', 'Round 4', 'Round 5', 'Round 6']:
        if rnd in practice_by_round:
            all_results_sorted.extend(practice_by_round[rnd])
        if rnd in existing_by_round:
            all_results_sorted.extend(existing_by_round[rnd])

    # Write results
    print(f"\nTotal results: {len(all_results_sorted)} ({len(new_results)} new practice + {len(existing_results)} existing)")
    with open(results_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Round', 'Date', 'Class', 'Session', 'Pos', 'Kart#',
                         'Driver', 'Class Code', 'Laps', 'Avg Speed', 'Gap',
                         'Best Lap', 'Best On Lap', 'Team'])
        for row in all_results_sorted:
            # Handle both new (lowercase keys) and existing (capitalized keys)
            writer.writerow([
                row.get('round', row.get('Round', '')),
                row.get('date', row.get('Date', '')),
                row.get('class', row.get('Class', '')),
                row.get('session_type', row.get('Session', '')),
                row.get('pos', row.get('Pos', '')),
                row.get('no', row.get('Kart#', '')),
                row.get('name', row.get('Driver', '')),
                row.get('cls', row.get('Class Code', '')),
                row.get('laps', row.get('Laps', '')),
                row.get('avg_speed', row.get('Avg Speed', '')),
                row.get('gap', row.get('Gap', '')),
                row.get('best', row.get('Best Lap', '')),
                row.get('best_on', row.get('Best On Lap', '')),
                row.get('team', row.get('Team', '')),
            ])

    # Same for laptimes
    practice_lt_by_round = {}
    for r in new_laptimes:
        rnd = r['round']
        if rnd not in practice_lt_by_round:
            practice_lt_by_round[rnd] = []
        practice_lt_by_round[rnd].append(r)

    existing_lt_by_round = {}
    for r in existing_laptimes:
        rnd = r['Round']
        if rnd not in existing_lt_by_round:
            existing_lt_by_round[rnd] = []
        existing_lt_by_round[rnd].append(r)

    all_laptimes_sorted = []
    for rnd in ['Round 2', 'Round 3', 'Round 4', 'Round 5', 'Round 6']:
        if rnd in practice_lt_by_round:
            all_laptimes_sorted.extend(practice_lt_by_round[rnd])
        if rnd in existing_lt_by_round:
            all_laptimes_sorted.extend(existing_lt_by_round[rnd])

    print(f"Total laptimes: {len(all_laptimes_sorted)} ({len(new_laptimes)} new + {len(existing_laptimes)} existing)")
    lap_headers = ['Round', 'Date', 'Class', 'Session', 'Driver'] + [f'L{i+1}' for i in range(max_laps)]
    with open(laptimes_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(lap_headers)
        for row in all_laptimes_sorted:
            csv_row = [
                row.get('round', row.get('Round', '')),
                row.get('date', row.get('Date', '')),
                row.get('class', row.get('Class', '')),
                row.get('session_type', row.get('Session', '')),
                row.get('driver', row.get('Driver', '')),
            ]
            for j in range(max_laps):
                csv_row.append(row.get(f'L{j+1}', ''))
            writer.writerow(csv_row)

    print("Done!")


if __name__ == '__main__':
    main()
