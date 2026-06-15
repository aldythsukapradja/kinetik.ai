@echo off
REM ============================================================
REM  Kinetik local server — double-click this file.
REM  Serving over http lets the Store read each App_*.html
REM  manifest + embedded icon (file:// blocks that for security).
REM  Tries Python first, then Node (npx serve). Opens the browser.
REM ============================================================
cd /d "%~dp0"

REM --- refresh the SEED_FILES line INSIDE index.html so any App_*.html dropped in this
REM     folder is auto-discovered (no separate apps.json to maintain) ---
powershell -NoProfile -Command "$names = Get-ChildItem -Filter 'App_*.html' | Sort-Object Name | ForEach-Object { '\"' + $_.Name + '\"' }; $line = 'const SEED_FILES=[' + ($names -join ',') + '];'; $enc = New-Object System.Text.UTF8Encoding($false); $p = Join-Path (Get-Location) 'index.html'; $html = [System.IO.File]::ReadAllText($p, $enc); $rx = New-Object System.Text.RegularExpressions.Regex('const SEED_FILES=\[.*?\];'); $html = $rx.Replace($html, $line, 1); [System.IO.File]::WriteAllText($p, $html, $enc)"
echo Refreshed SEED_FILES in index.html

echo Starting Kinetik at http://localhost:5500  (close this window to stop)
start "" http://localhost:5500/index.html

where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 5500
  goto :eof
)
where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 5500
  goto :eof
)
where npx >nul 2>nul
if %errorlevel%==0 (
  npx --yes serve -l 5500 .
  goto :eof
)
echo.
echo Could not find Python or Node. Install either one, then double-click again.
pause
