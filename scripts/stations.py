# Stations and scheduled minutes per line, from the MTA GTFS feed: for each line, the weekday
# trip with the most stops (direction 0), with cumulative minutes from its first stop.
import csv, json, collections, sys
D = (sys.argv[1] if len(sys.argv) > 1 else 'gtfs/data') + '/'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'out/stations.json'
names = {r['stop_id']: r['stop_name'] for r in csv.DictReader(open(D + 'stops.txt'))}
cal = {r['service_id']: r for r in csv.DictReader(open(D + 'calendar.txt'))}
weekday = {s for s, r in cal.items() if r['tuesday'] == '1'}
trips = {}
for r in csv.DictReader(open(D + 'trips.txt')):
    if r['service_id'] in weekday and r['direction_id'] == '0':
        trips[r['trip_id']] = r['route_id']
st = collections.defaultdict(list)
for r in csv.DictReader(open(D + 'stop_times.txt')):
    if r['trip_id'] in trips: st[r['trip_id']].append(r)
def mins(t): h, m, s = map(int, t.split(':')); return h * 60 + m + s / 60
best = {}
for tid, rows in st.items():
    rt = trips[tid]
    if rt not in best or len(rows) > len(best[rt]): best[rt] = rows
out = {}
for rt, rows in best.items():
    rows.sort(key=lambda r: int(r['stop_sequence']))
    t0 = mins(rows[0]['departure_time'])
    seen, lst = set(), []
    for r in rows:
        n = names[r['stop_id'][:-1]] if r['stop_id'][-1] in 'NS' else names[r['stop_id']]
        if n in seen: n = n + ' '  # keep distinct
        seen.add(n); lst.append([n.strip(), round(mins(r['arrival_time']) - t0, 1)])
    out[rt] = lst
keep = ['1','2','3','4','5','6','7','A','C','E','B','D','F','M','N','Q','R','W','G','J','Z','L','GS','FS','H','SI']
out = {k: out[k] for k in keep if k in out}
print({k: (len(v), v[-1][1]) for k, v in out.items()}, [k for k in keep if k not in out])
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
