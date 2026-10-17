$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Instale o Node.js 22.9 ou superior.' }
if (-not (Test-Path -LiteralPath 'node_modules/mysql2')) {
    & npm.cmd ci --no-audit --no-fund --cache .sites-runtime/npm-cache
    if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel instalar as dependencias.' }
}
& node scripts/install-mysql-local.mjs
if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel instalar o MySQL local.' }
& node scripts/setup-local.mjs
if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel configurar o banco.' }
& node scripts/seed-demo.mjs
if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel carregar os exemplos.' }
Write-Host 'Pronto. Execute .\Iniciar-YENA.ps1 e abra http://127.0.0.1:4173.'
Write-Host 'O acesso administrativo esta em .sites-runtime/ACESSO-LOCAL.txt.'
