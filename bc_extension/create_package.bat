@echo off
echo Starting AL Package Creation...

REM Set AL Package cache
if not exist ".alpackages" mkdir .alpackages

echo Attempting to create package using AL Language Extension...

REM Try using VS Code AL extension
code . --wait

echo Package creation process initiated.
echo Check VS Code for package creation status.
echo Generated .app file should appear in this directory.

pause
