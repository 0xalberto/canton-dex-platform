# CantonDEX Trading Service Runner (Windows)

Write-Host "Starting CantonDEX Trading Service..." -ForegroundColor Green

# Check if Python is available
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Python not found. Please install Python 3.10+." -ForegroundColor Red
    exit 1
}

# Check if venv exists
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    python -m venv venv
}

# Activate venv
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& .\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt --quiet

# Run service
Write-Host ""
Write-Host "Starting FastAPI Trading Service on http://localhost:8000" -ForegroundColor Green
Write-Host "Real-time matching engine active!" -ForegroundColor Yellow
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop..." -ForegroundColor Gray
Write-Host ""

python main.py
