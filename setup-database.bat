@echo off
echo Setting up Financial Analytics Database...
echo.

REM Use full path to psql
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres -d postgres -f database-setup.sql

echo.
echo Database setup completed!
pause
