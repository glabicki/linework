# Where each station sits along its line's drawn route, so a print can draw just the stretch you rode.
#   python3 -I scripts/station_pos.py FEED_DIR [OUT]
# Reads lib/data/geo.json (route shapes in map space) and lib/data/stations.json (stations per line,
# from scripts/stations.py), plus stops.txt / trips.txt / stop_times.txt / calendar.txt from the feed.
# Writes OUT (default lib/data/stops.json): for each line, the distance along its route in map units,
# one number per station, in the same order as stations.json.
import csv, json, collections, math, sys

D = sys.argv[1].rstrip('/') + '/'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'lib/data/stops.json'
GEO = json.load(open('lib/data/geo.json'))
STATIONS = json.load(open('lib/data/stations.json'))

# Same trip choice as stations.py: the weekday direction-0 trip with the most stops.
stops = {r['stop_id']: r for r in csv.DictReader(open(D + 'stops.txt'))}
cal = {r['service_id']: r for r in csv.DictReader(open(D + 'calendar.txt'))}
weekday = {s for s, r in cal.items() if r['tuesday'] == '1'}
trips = {r['trip_id']: r['route_id'] for r in csv.DictReader(open(D + 'trips.txt'))
         if r['service_id'] in weekday and r['direction_id'] == '0'}
st = collections.defaultdict(list)
for r in csv.DictReader(open(D + 'stop_times.txt')):
    if r['trip_id'] in trips: st[r['trip_id']].append(r)
best = {}
for tid, rows in st.items():
    rt = trips[tid]
    if rt not in best or len(rows) > len(best[rt]): best[rt] = rows

def where(stop_id):
    s = stops.get(stop_id[:-1]) if stop_id[-1] in 'NS' and stop_id[:-1] in stops else stops[stop_id]
    return float(s['stop_lon']), float(s['stop_lat']), s['stop_name']

ll = {}
for l in STATIONS:
    rows = sorted(best[l], key=lambda r: int(r['stop_sequence']))
    pts = [where(r['stop_id']) for r in rows]
    if [p[2] for p in pts] != [s[0] for s in STATIONS[l]]:
        sys.exit(f'{l}: feed stations differ from stations.json; run scripts/stations.py on this feed first')
    ll[l] = [(p[0], p[1]) for p in pts]

# Map space is a flat projection of lon/lat. Fit it from each line's two terminals against the two
# ends of its drawn route (pairing them whichever way fits), then refine once with every station.
def solve(pairs):
    # least squares for x = a*lon + b*lat + c and y = d*lon + e*lat + f
    def fit(k):
        A = [[0.0] * 3 for _ in range(3)]; v = [0.0] * 3
        for (lo, la), xy in pairs:
            row = (lo, la, 1.0)
            for i in range(3):
                v[i] += row[i] * xy[k]
                for j in range(3): A[i][j] += row[i] * row[j]
        for i in range(3):  # Gauss-Jordan
            p = max(range(i, 3), key=lambda r: abs(A[r][i])); A[i], A[p] = A[p], A[i]; v[i], v[p] = v[p], v[i]
            for r in range(3):
                if r != i:
                    m = A[r][i] / A[i][i]
                    A[r] = [A[r][j] - m * A[i][j] for j in range(3)]; v[r] -= m * v[i]
        return [v[i] / A[i][i] for i in range(3)]
    return fit(0), fit(1)

def proj(T, p):
    (a, b, c), (d, e, f) = T
    return a * p[0] + b * p[1] + c, d * p[0] + e * p[1] + f

def near(line, q):
    # nearest point on the drawn route: (distance along the route, distance off it)
    pts, s, best_ = GEO[line], 0.0, (0.0, float('inf'))
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        dx, dy = x2 - x1, y2 - y1; L2 = dx * dx + dy * dy or 1.0
        t = max(0.0, min(1.0, ((q[0] - x1) * dx + (q[1] - y1) * dy) / L2))
        off = math.hypot(x1 + t * dx - q[0], y1 + t * dy - q[1])
        if off < best_[1]: best_ = (s + t * math.sqrt(L2), off)
        s += math.sqrt(L2)
    return best_

# First pass: north-south lines pair by latitude (map y grows southward); then let the fit pick.
pairs = []
for l, p in ll.items():
    g = GEO[l]; a, b = p[0], p[-1]
    if abs(a[1] - b[1]) > abs(a[0] - b[0]) * 0.75:
        first_is_north = g[0][1] < g[-1][1]
        n, s_ = (a, b) if a[1] > b[1] else (b, a)
        pairs += [(n, g[0]), (s_, g[-1])] if first_is_north else [(n, g[-1]), (s_, g[0])]
T = solve(pairs)
for _ in range(3):
    pairs = []
    for l, p in ll.items():
        g = GEO[l]; a, b = proj(T, p[0]), proj(T, p[-1])
        keep = math.dist(a, g[0]) + math.dist(b, g[-1]) <= math.dist(a, g[-1]) + math.dist(b, g[0])
        pairs += [(p[0], g[0]), (p[-1], g[-1])] if keep else [(p[0], g[-1]), (p[-1], g[0])]
    T = solve(pairs)
# Refine with every station snapped to its route (drops stations far off it, like other branches).
for _ in range(3):
    pairs = []
    for l, p in ll.items():
        for q in p:
            xy = proj(T, q); s, off = near(l, xy)
            if off < 600:
                pts, acc = GEO[l], 0.0
                for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
                    seg = math.hypot(x2 - x1, y2 - y1)
                    if acc + seg >= s: t = (s - acc) / (seg or 1); pairs.append((q, (x1 + t * (x2 - x1), y1 + t * (y2 - y1)))); break
                    acc += seg
    T = solve(pairs)

# A station well off its drawn route (a branch the drawing doesn't follow) gets null:
# rides to or from it draw the whole line, as rides without stations do.
out, report = {}, []
for l, p in ll.items():
    res = [near(l, proj(T, q)) for q in p]
    med = sorted(o for _, o in res)[len(res) // 2]
    out[l] = [round(s) if o <= med + 900 else None for s, o in res]
    far = [STATIONS[l][i][0] for i, v in enumerate(out[l]) if v is None]
    on = [v for v in out[l] if v is not None]
    steps = [b - a for a, b in zip(on, on[1:]) if b != a]
    turns = sum(1 for a, b in zip(steps, steps[1:]) if (a > 0) != (b > 0))
    report.append(f'{l:>2}: median off {round(med)}' + (f', {turns} out of order' if turns else '')
                  + (f'; whole line for: {", ".join(far)}' if far else ''))
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print('\n'.join(report))
