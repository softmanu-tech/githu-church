# PowerShell script to switch to minimal Next.js 14.2.5 setup

Write-Host "🔄 Switching to Next.js 14.2.5 minimal setup..." -ForegroundColor Yellow

# Stop any running Node processes
Write-Host "⏹️  Stopping Node.js processes..." -ForegroundColor Blue
try {
    taskkill /f /im node.exe 2>$null
    Write-Host "✅ Node.js processes stopped" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  No Node.js processes to stop" -ForegroundColor Gray
}

# Backup current package.json
Write-Host "💾 Backing up current package.json..." -ForegroundColor Blue
Copy-Item package.json package.json.backup -Force
Write-Host "✅ Backup created: package.json.backup" -ForegroundColor Green

# Replace with minimal version
Write-Host "🔄 Switching to minimal package.json..." -ForegroundColor Blue
Copy-Item package-minimal.json package.json -Force
Write-Host "✅ Minimal package.json activated" -ForegroundColor Green

# Remove problematic files
Write-Host "🧹 Cleaning up..." -ForegroundColor Blue
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ Cleanup completed" -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm cache clean --force
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Ready to test! Run:" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 Your CRON_API_KEY is still working:" -ForegroundColor Yellow
    Write-Host "   node test-cron.js" -ForegroundColor White
} else {
    Write-Host "❌ Installation failed. Check the error messages above." -ForegroundColor Red
    Write-Host ""
    Write-Host "🔄 To restore original package.json:" -ForegroundColor Yellow
    Write-Host "   Copy-Item package.json.backup package.json -Force" -ForegroundColor White
}

