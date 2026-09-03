#!/usr/bin/env sh
set -eu

mkdir -p /Lean/Data /results

python3 /module/download_samsung_electro_data.py \
  --output /Lean/Data/samsung_electro.csv \
  --start "${SAMSUNG_ELECTRO_START_DATE:-2024-01-01}" \
  --end "${SAMSUNG_ELECTRO_END_DATE:-2025-01-01}"

cp /module/config.json /results/config.json
cd /results

exec dotnet /Lean/Launcher/bin/Debug/QuantConnect.Lean.Launcher.dll
