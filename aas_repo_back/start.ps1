# AAS Repository Backend Server Start Script
Write-Host "Starting AAS Repository Backend Server..." -ForegroundColor Green

# Suppress Pydantic V1 warnings
$env:PYTHONWARNINGS = "ignore::UserWarning:fastapi._compat"

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Start server
Write-Host "Starting server..." -ForegroundColor Cyan
python main_nginx.py --host 0.0.0.0 --port 8000 --workers 1

# Wait after script completion
Write-Host "Server has stopped. Press any key to close the window..." -ForegroundColor Red
Read-Host
