@echo off
set SRC=%~1
if "%SRC%"=="" set SRC=C:\Users\maivi\OneDrive\Documents\BrickEmuPy\assets
set DST=%~dp0..\public\tamagotchi\assets
mkdir "%DST%" 2>nul
copy /Y "%SRC%\TamagotchiP1.bin" "%DST%\"
copy /Y "%SRC%\TamagotchiP1.brick" "%DST%\"
copy /Y "%SRC%\TamagotchiP1.svg" "%DST%\"
node "%~dp0build-p1-shell-svg.mjs"
node "%~dp0build-p1-display-svg.mjs"
node "%~dp0build-p1-display-manifest.mjs"
echo Copied BrickEmuPy P1 assets to public/tamagotchi/assets/
