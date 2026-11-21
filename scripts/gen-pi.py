"""Generate the first N decimal digits of pi (after the point) with mpmath.
Usage: python scripts/gen-pi.py <digits> <out.txt>
"""
import sys, time
from mpmath import mp
n = int(sys.argv[1]); out = sys.argv[2]
t = time.time()
mp.dps = n + 20
s = mp.nstr(mp.pi, n + 5, strip_zeros=False)  # "3.1415..."
digits = s.split('.')[1][:n]
assert digits.startswith('14159265358979323846')
open(out, 'w').write(digits)
print('digits', len(digits), 'seconds', round(time.time() - t, 1))
