@echo off
echo Git Push Status Check
echo =====================

echo.
echo Current Git Status:
git status --porcelain

echo.
echo Recent Commits:
git log --oneline -3

echo.
echo Remote Status:
git remote -v

echo.
echo Branch Information:
git branch -a

echo.
echo Latest Commit Details:
git show --name-only HEAD

pause
