$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Instale o Node.js 22.9 ou superior antes de iniciar a YENA.'
}
$yenaPreviousKey = $env:DEEPSEEK_API_KEY
try {
    if (-not $env:DEEPSEEK_API_KEY -and (-not (Test-Path -LiteralPath '.env') -or -not (Select-String -LiteralPath '.env' -Pattern '^DEEPSEEK_API_KEY=.+$' -Quiet))) {
        Write-Host 'A chave fica apenas na memória do processo e não é salva em arquivo.'
        $yenaSecureKey = Read-Host 'Cole uma nova chave do DeepSeek (Enter para demonstração)' -AsSecureString
        $yenaKeyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($yenaSecureKey)
        try { $env:DEEPSEEK_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($yenaKeyPointer) }
        finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($yenaKeyPointer); $yenaSecureKey.Dispose() }
    }
    & node scripts/start-local.mjs
}
finally { $env:DEEPSEEK_API_KEY = $yenaPreviousKey }
