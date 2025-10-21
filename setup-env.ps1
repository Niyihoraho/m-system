# PowerShell Script - Setup Environment File for Local Development

Write-Host "========================================" -ForegroundColor Green
Write-Host "LOCAL DEVELOPMENT ENVIRONMENT SETUP" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

try {
    Write-Host "Step 1: Creating .env file for local development..." -ForegroundColor Yellow
    
    # Check if .env already exists
    if (Test-Path ".env") {
        Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
        $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
        if ($overwrite -ne "y" -and $overwrite -ne "Y") {
            Write-Host "Setup cancelled." -ForegroundColor Red
            exit 0
        }
    }

    # Create .env file content
    $envContent = @"
# Environment Variables for Local Development

# Node Environment
NODE_ENV=development

# NextAuth Configuration
AUTH_TRUST_HOST=true
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=mNaqPepJ3tW182v7LcMMsOUiVQrZHykvmqBpw5Ya98M=

# Database Configuration
# Use the same database as production for testing
DATABASE_URL=mysql://adminMinistry:Niyihoraho@db-system-ministry.corcwyqkieso.us-east-1.rds.amazonaws.com:3306/db-system-ministry

# Development Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
"@

    # Write the content to .env file
    $envContent | Out-File -FilePath ".env" -Encoding UTF8

    Write-Host "✅ .env file created successfully!" -ForegroundColor Green

    Write-Host "Step 2: Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed!"
    }

    Write-Host "Step 3: Generating Prisma client..." -ForegroundColor Yellow
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        throw "Prisma generate failed!"
    }

    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SETUP COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run: npm run dev" -ForegroundColor White
    Write-Host "2. Open: http://localhost:3000" -ForegroundColor White
    Write-Host "3. Test your changes locally" -ForegroundColor White
    Write-Host "4. Deploy when ready: .\deploy-smart.ps1" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Green

} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Setup failed. Please check the error and try again." -ForegroundColor Red
    exit 1
}
