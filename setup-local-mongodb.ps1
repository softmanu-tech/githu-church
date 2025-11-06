# PowerShell script to set up local MongoDB for testing

Write-Host "🗄️ Setting up local MongoDB for Church Management System..." -ForegroundColor Yellow

# Check if MongoDB is installed
$mongoPath = Get-Command mongod -ErrorAction SilentlyContinue

if (-not $mongoPath) {
    Write-Host "❌ MongoDB not found. Installing via Chocolatey..." -ForegroundColor Red
    
    # Check if Chocolatey is installed
    $chocoPath = Get-Command choco -ErrorAction SilentlyContinue
    
    if (-not $chocoPath) {
        Write-Host "📦 Installing Chocolatey..." -ForegroundColor Blue
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    }
    
    Write-Host "📦 Installing MongoDB Community Edition..." -ForegroundColor Blue
    choco install mongodb -y
    
    Write-Host "✅ MongoDB installed!" -ForegroundColor Green
} else {
    Write-Host "✅ MongoDB already installed!" -ForegroundColor Green
}

# Create data directory
$dataDir = "C:\data\db"
if (-not (Test-Path $dataDir)) {
    Write-Host "📁 Creating data directory: $dataDir" -ForegroundColor Blue
    New-Item -ItemType Directory -Path $dataDir -Force
    Write-Host "✅ Data directory created!" -ForegroundColor Green
}

# Start MongoDB service
Write-Host "🚀 Starting MongoDB service..." -ForegroundColor Blue
try {
    Start-Service -Name MongoDB -ErrorAction Stop
    Write-Host "✅ MongoDB service started!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Starting MongoDB manually..." -ForegroundColor Yellow
    Start-Process -FilePath "mongod" -ArgumentList "--dbpath", $dataDir -NoNewWindow
    Start-Sleep 3
}

# Test connection
Write-Host "🔍 Testing MongoDB connection..." -ForegroundColor Blue
try {
    $testResult = mongo --eval "db.runCommand('ping')" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MongoDB is running successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Local MongoDB Setup Complete!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📋 Connection Details:" -ForegroundColor White
        Write-Host "   URI: mongodb://localhost:27017/church-management" -ForegroundColor Gray
        Write-Host "   Status: Running" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔄 Next Steps:" -ForegroundColor White
        Write-Host "   1. Update .env.local with the connection string above" -ForegroundColor Gray
        Write-Host "   2. Restart your Next.js server" -ForegroundColor Gray
        Write-Host "   3. Your database will be ready!" -ForegroundColor Gray
    } else {
        throw "Connection test failed"
    }
} catch {
    Write-Host "❌ MongoDB connection test failed" -ForegroundColor Red
    Write-Host "💡 Try manually starting MongoDB:" -ForegroundColor Yellow
    Write-Host "   mongod --dbpath C:\data\db" -ForegroundColor Gray
}
