# PowerShell Script - CORRECTED DEPLOYMENT
# This script builds locally and uploads with correct file structure

Write-Host "========================================" -ForegroundColor Green
Write-Host "CORRECTED DEPLOYMENT - FIXED STRUCTURE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

try {
    Write-Host "Step 1: Installing all dependencies locally..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "Local npm install failed!"
    }

    Write-Host "Step 2: Building the application locally..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed! Please fix errors and try again."
    }

    Write-Host "Step 3: Preparing deployment package..." -ForegroundColor Yellow
    
    # Clean up any existing temp directory
    if (Test-Path "temp_deploy") {
        Remove-Item -Recurse -Force "temp_deploy"
    }
    New-Item -ItemType Directory -Name "temp_deploy" | Out-Null

    # Copy the standalone build files to the root of temp_deploy
    Copy-Item -Recurse ".next\standalone\*" "temp_deploy\"
    
    # Copy static files to the correct location
    Copy-Item -Recurse ".next\static" "temp_deploy\.next\static"
    
    # Copy public files
    Copy-Item -Recurse "public" "temp_deploy\public"
    
    # Copy ecosystem config
    Copy-Item "ecosystem.config.js" "temp_deploy\"

    Write-Host "Step 4: Creating compressed package..." -ForegroundColor Yellow
    Compress-Archive -Path "temp_deploy\*" -DestinationPath "deployment.zip" -Force

    Write-Host "Step 5: Uploading to server..." -ForegroundColor Yellow
    scp -i "C:\Users\user\Music\github\m-system\m-system-WebServer-1.pem" deployment.zip "ec2-user@ec2-98-90-202-108.compute-1.amazonaws.com:~/"

    Write-Host "Step 6: Cleaning up local files..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "temp_deploy"
    Remove-Item "deployment.zip"

    Write-Host "========================================" -ForegroundColor Green
    Write-Host "LOCAL BUILD COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Now run these SERVER COMMANDS:" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Green

} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Deployment failed. Please check the error and try again." -ForegroundColor Red
    exit 1
}
