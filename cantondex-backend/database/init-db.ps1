# CantonDEX Database Initialization Script (Windows)

Write-Host "Initializing CantonDEX Database..." -ForegroundColor Green

# Database connection details
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "postgres" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "cantondex" }

# Set password environment variable
$env:PGPASSWORD = $DB_PASSWORD

# Check if database exists, create if not
Write-Host "Creating database '$DB_NAME'..." -ForegroundColor Cyan
$dbExists = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'"
if (-not $dbExists) {
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME"
}

# Run schema
Write-Host "Creating database schema..." -ForegroundColor Cyan
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f schema.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Database initialization complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Database Info:" -ForegroundColor Yellow
    Write-Host "  Host: $DB_HOST"
    Write-Host "  Port: $DB_PORT"
    Write-Host "  Database: $DB_NAME"
    Write-Host "  User: $DB_USER"
    Write-Host ""
    Write-Host "Ready for trading!" -ForegroundColor Green
} else {
    Write-Host "Database initialization failed!" -ForegroundColor Red
    exit 1
}
