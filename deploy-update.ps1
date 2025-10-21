# PowerShell Script - INCREMENTAL UPDATE DEPLOYMENT
# This script only uploads changed files without rebuilding everything

Write-Host "========================================" -ForegroundColor Green
Write-Host "INCREMENTAL UPDATE DEPLOYMENT" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

try {
    Write-Host "Step 1: Building only changed files..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed! Please fix errors and try again."
    }

    Write-Host "Step 2: Creating incremental update package..." -ForegroundColor Yellow
    
    # Clean up any existing temp directory
    if (Test-Path "temp_update") {
        Remove-Item -Recurse -Force "temp_update"
    }
    New-Item -ItemType Directory -Name "temp_update" | Out-Null

    # Copy only the updated standalone build files
    Copy-Item -Recurse ".next\standalone\*" "temp_update\"
    
    # Copy updated static files
    Copy-Item -Recurse ".next\static" "temp_update\.next\static"
    
    # Copy updated public files (if any)
    Copy-Item -Recurse "public" "temp_update\public"
    
    # Copy updated ecosystem config (if changed)
    Copy-Item "ecosystem.config.js" "temp_update\"

    Write-Host "Step 3: Creating update package..." -ForegroundColor Yellow
    Compress-Archive -Path "temp_update\*" -DestinationPath "update.zip" -Force

    Write-Host "Step 4: Uploading update to server..." -ForegroundColor Yellow
    scp -i "C:\Users\user\Music\github\m-system\m-system-WebServer-1.pem" update.zip "ec2-user@ec2-98-90-202-108.compute-1.amazonaws.com:~/"

    Write-Host "Step 5: Cleaning up local files..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "temp_update"
    Remove-Item "update.zip"

    Write-Host "========================================" -ForegroundColor Green
    Write-Host "UPDATE PACKAGE READY!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Now run these SERVER UPDATE COMMANDS:" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Green

} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Update deployment failed. Please check the error and try again." -ForegroundColor Red
    exit 1
}
