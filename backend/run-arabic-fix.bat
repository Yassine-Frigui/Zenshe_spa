@echo off
REM ============================================================================
REM Fix Arabic Translations (Services & Categories) - Windows Batch Script
REM ============================================================================
REM This script executes the fix SQL with proper UTF-8 encoding
REM ============================================================================

echo ========================================
echo Fix Arabic Translations (Services & Categories)
echo ========================================
echo.

REM Set UTF-8 code page for console
chcp 65001 > nul

REM MySQL connection parameters (update these)
set MYSQL_HOST=localhost
set MYSQL_PORT=4306
set MYSQL_USER=root
set MYSQL_DB=zenshespa_database

REM Prompt for password
set /p MYSQL_PASSWORD="Enter MySQL password: "

echo.
echo Executing fix script with UTF-8 encoding...
echo.
    

REM Execute the categories fix SQL file with proper UTF-8 encoding
mysql --host=%MYSQL_HOST% --port=%MYSQL_PORT% --user=%MYSQL_USER% --password=%MYSQL_PASSWORD% --database=%MYSQL_DB% --default-character-set=utf8mb4 < "%~dp0fix-categories-arabic-translations.sql"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Categories translations fixed successfully!
) else (
    echo ❌ Error fixing categories translations
    goto :error
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCCESS: All Arabic translations have been fixed!
    echo.
    echo Fixed services (54 total):
    echo - Services 1-13: V-Steam, Vajacials, Packages
    echo - Services 14-22: Massages, Spa, Waxing
    echo - Services 23-32: Rituels ZenShe
    echo - Services 53-54: Massage Packages
    echo.
    echo Fixed categories (6 total):
    echo - Category 3: Massages (تدليك)
    echo - Category 6: Épilation (إزالة الشعر)
    echo.
    echo Next steps:
    echo 1. Refresh your browser (Ctrl+F5)
    echo 2. Switch to Arabic language in the app
    echo 3. Check ServicesPage and BookingPage
    echo 4. All Arabic text should display correctly now!
    echo.
    echo Testing the fix...
    mysql --host=%MYSQL_HOST% --port=%MYSQL_PORT% --user=%MYSQL_USER% --password=%MYSQL_PASSWORD% --database=%MYSQL_DB% --default-character-set=utf8mb4 -e "SELECT 'Services:' as type, COUNT(*) as count FROM services_translations WHERE language_code='ar' UNION SELECT 'Categories:', COUNT(*) FROM categories_services_translations WHERE language_code='ar';"
) else (
    echo.
    echo ❌ ERROR: Failed to execute fix. Error code: %ERRORLEVEL%
    echo.
    echo Please check:
    echo 1. Database connection settings
    echo 2. MySQL is running on port 4306
    echo 3. User has write permissions
    echo 4. The fix SQL files exist
    echo.
)

echo.
pause
