$ErrorActionPreference = "Continue"

$repoCandidates = @(
  "D:\ksenia_expert",
  "H:\ksenia_expert"
)

Write-Host "EXPERT workspace check"
Write-Host "======================"

Write-Host ""
Write-Host "Drive aliases:"
cmd /c subst

$repoPath = $repoCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $repoPath) {
  Write-Host "FAIL repo path not found. Tried:"
  $repoCandidates | ForEach-Object { Write-Host " - $_" }
  exit 1
}

Write-Host ""
Write-Host "Repo path: $repoPath"
Push-Location $repoPath

try {
  $gitTop = git rev-parse --show-toplevel 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Git root: $gitTop"
  } else {
    Write-Host "FAIL git root not available"
  }

  $status = git status --short
  if ($status) {
    Write-Host ""
    Write-Host "Git dirty files:"
    $status
  } else {
    Write-Host "Git status: clean"
  }

  $nodePath = "$env:USERPROFILE\scoop\apps\nodejs-lts\current"
  $nodeBinPath = "$env:USERPROFILE\scoop\apps\nodejs-lts\current\bin"
  $npmPath = "$env:APPDATA\npm"
  $env:Path = "$nodePath;$nodeBinPath;$env:USERPROFILE\scoop\shims;$npmPath;$env:Path"

  Write-Host ""
  Write-Host "Node tooling:"
  node --version
  npm --version
  npx --version

  Write-Host ""
  Write-Host "Package scripts:"
  npm pkg get scripts
} finally {
  Pop-Location
}
