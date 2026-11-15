# Refresh Linework's MTA data from the public subway GTFS feed.
#   python3 scripts/refresh_gtfs.py            download the live feed, check it, rebuild, report
#   python3 scripts/refresh_gtfs.py --dir X    use an already-unzipped feed in folder X (no download)
#   add --apply to swap the new data in (otherwise it only writes the report)
# Outputs: out/stations.json, out/proto_geo.json, out/data_version.json, out/gtfs_report.md
# In the real app the same job runs on a server weekly; the app downloads data_version.json and
# fetches new station/route files only when the version changes. Rides keep their line + stations
# by name, so a feed change never rewrites history.
import csv, json, os, shutil, subprocess, sys, tempfile, urllib.request, zipfile, datetime

FEED = 'https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip'
NEED = ['agency.txt', 'calendar.txt', 'routes.txt', 'shapes.txt', 'stop_times.txt', 'stops.txt', 'trips.txt', 'feed_info.txt']
LINES = ['1','2','3','4','5','6','7','A','C','E','B','D','F','M','G','J','Z','L','N','Q','R','W','GS','FS','H','SI']
args = sys.argv[1:]
apply = '--apply' in args
here = os.getcwd()
work = tempfile.mkdtemp(prefix='gtfs_', dir=os.path.join(here, 'gtfs'))

if '--dir' in args:
    src = args[args.index('--dir') + 1]
else:
    z = os.path.join(work, 'gtfs_subway.zip')
    # curl uses the system certificate store (some Python installs have none)
    subprocess.run(['curl', '-fsSL', '--max-time', '180', '-A', 'linework-data-refresh', '-o', z, FEED], check=True)
    src = os.path.join(work, 'feed')
    with zipfile.ZipFile(z) as zf:
        for n in zf.namelist():  # only plain .txt files at the top level
            if n.endswith('.txt') and '/' not in n and '..' not in n: zf.extract(n, src)

problems = [f'missing {n}' for n in NEED if not os.path.exists(os.path.join(src, n))]
if problems: sys.exit('Feed rejected: ' + ', '.join(problems))
info = next(csv.DictReader(open(os.path.join(src, 'feed_info.txt'))))
start, end = info['feed_start_date'], info['feed_end_date']
today = datetime.date.today().strftime('%Y%m%d')
if end < today: problems.append(f'feed expired {end}')

st_new, geo_new = os.path.join(work, 'stations.json'), os.path.join(work, 'proto_geo.json')
py = sys.executable
subprocess.run([py, '-I', 'scripts/stations.py', src, st_new], check=True, capture_output=True)
subprocess.run([py, '-I', 'scripts/proto_geo.py', src, geo_new, '45'], check=True, capture_output=True)
new, geo = json.load(open(st_new)), json.load(open(geo_new))
missing = [l for l in LINES if l not in new or l not in geo]
if missing: problems.append('lines missing: ' + ' '.join(missing))

old = json.load(open('out/stations.json')) if os.path.exists('out/stations.json') else {}
oldv = json.load(open('out/data_version.json')) if os.path.exists('out/data_version.json') else {}
rows = []
for l in LINES:
    a, b = {s[0]: s[1] for s in old.get(l, [])}, {s[0]: s[1] for s in new.get(l, [])}
    added, gone = sorted(set(b) - set(a)), sorted(set(a) - set(b))
    ta, tb = (max(a.values()) if a else 0), (max(b.values()) if b else 0)
    if added or gone or abs(ta - tb) >= 1:
        rows.append(f'| {l} | {", ".join(added) or "–"} | {", ".join(gone) or "–"} | {ta:.0f} → {tb:.0f} min |')

ver = {'feed_version': info.get('feed_version', ''), 'feed_start': start, 'feed_end': end,
       'checked': datetime.datetime.now().strftime('%Y-%m-%d %H:%M'), 'lines': len(new)}
same = oldv.get('feed_version') == ver['feed_version'] and not rows
rep = [f'# MTA data refresh, {ver["checked"]}', '',
       f'Feed **{ver["feed_version"]}**, valid {start} to {end}. Previous: {oldv.get("feed_version", "none recorded")}.', '',
       ('**Problems, not applied:** ' + '; '.join(problems)) if problems else (f'{len(rows)} lines changed.' if rows else 'No changes to stations or full-line times.'), '']
if rows: rep += ['| Line | Stations added | Stations removed | Full trip |', '| --- | --- | --- | --- |'] + rows
open('out/gtfs_report.md', 'w').write('\n'.join(rep) + '\n')

if apply and not problems:
    shutil.copy(st_new, 'out/stations.json'); shutil.copy(geo_new, 'out/proto_geo.json')
    json.dump(ver, open('out/data_version.json', 'w'), indent=1)
    if src.startswith(work):
        if os.path.exists('gtfs/prev'): shutil.rmtree('gtfs/prev')
        if os.path.exists('gtfs/data'): os.rename('gtfs/data', 'gtfs/prev')
        shutil.move(src, 'gtfs/data')
shutil.rmtree(work, ignore_errors=True)
print('\n'.join(rep))
print('applied' if apply and not problems else 'not applied')
