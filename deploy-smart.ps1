# PowerShell Script - SMART DEPLOYMENT
# This script detects changes and chooses the appropriate deployment method

Write-Host "========================================" -ForegroundColor Green
Write-Host "SMART DEPLOYMENT - AUTO DETECT CHANGES" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check what type of changes were made
$hasCodeChanges = $false
$hasConfigChanges = $false
$hasDependencyChanges = $false

Write-Host "Step 1: Analyzing changes..." -ForegroundColor Yellow

# Check for code changes (app, components, lib, types)
$codeFiles = Get-ChildItem -Path "app", "components", "lib", "types" -Recurse -File -ErrorAction SilentlyContinue
if ($codeFiles) {
    $hasCodeChanges = $true
    Write-Host "✓ Code changes detected" -ForegroundColor Green
}

# Check for config changes
$configFiles = @("next.config.ts", "package.json", "ecosystem.config.js", "prisma/schema.prisma")
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        $hasConfigChanges = $true
        Write-Host "✓ Config changes detected: $file" -ForegroundColor Green
        break
    }
}

# Check for dependency changes
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" -Raw
    if ($packageJson -match '"dependencies"' -or $packageJson -match '"devDependencies"') {
        $hasDependencyChanges = $true
        Write-Host "✓ Dependency changes detected" -ForegroundColor Green
    }
}

Write-Host "Step 2: Choosing deployment strategy..." -ForegroundColor Yellow

if ($hasConfigChanges -or $hasDependencyChanges) {
    Write-Host "🔄 FULL DEPLOYMENT required (config/dependency changes)" -ForegroundColor Yellow
    Write-Host "Running full deployment..." -ForegroundColor Yellow
    
    # Run full deployment
    & ".\deploy.ps1"
} else {
    Write-Host "⚡ INCREMENTAL UPDATE possible (code changes only)" -ForegroundColor Yellow
    Write-Host "Running incremental update..." -ForegroundColor Yellow
    
    # Run incremental update
    & ".\deploy-update.ps1"
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "SMART DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
