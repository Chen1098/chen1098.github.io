# GNY 2026 — Problem I: POP Quiz (self-made test data)

Problem statement: <https://east.na.icpc.global/scoreboard/2026/eastdiv/problems/I.pdf>
(2026 ICPC East Division Regional, time limit 3 s, n ≤ 10^5, coordinates in [1, 1000])

These are **unofficial** tests. Expected answers come from a reference solution that was
stress-tested against an independent O(n³) brute force on 6000 random small cases; every
small test below is also checked by the brute force.

## Run

```bash
./run.sh my_solution.cpp
```

Prints AC / WA / TLE / RE per test.

## Tests

| # | n | answer | what it checks |
|---|---|---|---|
| 01 | 5 | yes | sample 1 |
| 02 | 2 | no | sample 2 |
| 03 | 1 | yes | single point with x = y = z |
| 04 | 1 | no | single point, not all equal |
| 05 | 3 | yes | two exactly opposite directions with different lengths |
| 06 | 2 | no | two *almost* opposite directions (cross product = −1) |
| 07 | 3 | yes | almost-opposite pair + a point that fills the big gap |
| 08 | 3 | no | almost-opposite pair + a point on the wrong side |
| 09 | 3 | yes | yes only via a triangle (no opposite pair) |
| 10 | 3 | yes | opposite pair hidden in a triple |
| 11 | 3 | no | three directions spanning less than a half-turn |
| 12 | 5 | no | all points in the same direction (different multiples) |
| 13 | 10^5 | no | max n, every point in one direction |
| 14 | 10^5 | yes | max n, one line through the origin, both directions |
| 15 | 10^5 | yes | max n, uniform random |
| 16 | 10^5 | no | max n, open half-plane |
| 17 | 10^5 | no | half-plane + points on one boundary ray only |
| 18 | 10^5 | yes | test 17 + one hidden point on the other boundary ray |
| 19 | 10^5 | no | half-plane with points hugging both boundary rays (precision trap) |
| 20 | 10^5 | yes | test 19 + one point exactly opposite an existing one |
| 21 | 10^5 | no | test 19 + one exact boundary ray |
| 22 | 10^5 | yes | test 19 + both exact boundary rays |
| 23 | 10^5 | yes | max n, open quadrant + one x = y = z point |
| 24 | 10^5 | no | max n, open quadrant |
