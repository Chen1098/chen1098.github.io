#!/usr/bin/env bash
# Usage: ./run.sh your_solution.cpp
# Compiles your C++ solution and runs it on every test in data/, 3s time limit each.
SRC="$1"
if [ -z "$SRC" ]; then echo "usage: ./run.sh sol.cpp"; exit 1; fi
DIR="$(cd "$(dirname "$0")" && pwd)"
g++ -O2 -std=c++17 -o /tmp/popquiz_sol "$SRC" || exit 1
pass=0; total=0
for in in "$DIR"/data/*.in; do
  name=$(basename "$in" .in); total=$((total+1))
  start=$(date +%s.%N)
  out=$(timeout 3 /tmp/popquiz_sol < "$in"); code=$?
  t=$(echo "$(date +%s.%N) - $start" | bc)
  exp=$(cat "$DIR/data/$name.ans")
  if [ $code -eq 124 ]; then echo "$name  TLE";
  elif [ $code -ne 0 ]; then echo "$name  RE (exit $code)";
  elif [ "$(echo $out | tr -d '[:space:]')" == "$(echo $exp | tr -d '[:space:]')" ]; then echo "$name  AC  ${t}s"; pass=$((pass+1));
  else echo "$name  WA  (expected $exp, got $out)"; fi
done
echo "----"; echo "$pass / $total passed"
