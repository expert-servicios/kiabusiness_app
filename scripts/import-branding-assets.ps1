param(
  [string]$SourceDir = "C:\dev\Nueva Pagina web"
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$PublicDir = Join-Path $RepoRoot "public"
$BrandingDir = Join-Path $PublicDir "branding"
$LogosDir = Join-Path $BrandingDir "logos"
$AvatarsDir = Join-Path $BrandingDir "avatars"
$BackgroundsDir = Join-Path $BrandingDir "backgrounds"

New-Item -ItemType Directory -Force -Path $LogosDir | Out-Null
New-Item -ItemType Directory -Force -Path $AvatarsDir | Out-Null
New-Item -ItemType Directory -Force -Path $BackgroundsDir | Out-Null

function Copy-BrandAsset {
  param(
    [string[]]$Candidates,
    [string]$TargetPath,
    [switch]$Required
  )

  foreach ($candidate in $Candidates) {
    $path = Join-Path $SourceDir $candidate
    if (Test-Path $path) {
      Copy-Item $path $TargetPath -Force
      Write-Host "OK copied $candidate -> $TargetPath" -ForegroundColor Green
      return $true
    }
  }

  if ($Required) {
    Write-Host "MISSING required asset for $TargetPath" -ForegroundColor Red
    Write-Host "Looked for:" -ForegroundColor Yellow
    $Candidates | ForEach-Object { Write-Host " - $_" }
    return $false
  }

  Write-Host "Optional asset not found for $TargetPath" -ForegroundColor Yellow
  return $false
}

$ok = $true

$ok = (Copy-BrandAsset -Required -Candidates @(
  "expert-logo.png",
  "logos\expert-logo.png",
  "branding\logos\expert-logo.png",
  "public\branding\logos\expert-logo.png"
) -TargetPath (Join-Path $LogosDir "expert-logo.png")) -and $ok

$ok = (Copy-BrandAsset -Required -Candidates @(
  "expert-logo-dark.png",
  "logos\expert-logo-dark.png",
  "branding\logos\expert-logo-dark.png",
  "public\branding\logos\expert-logo-dark.png"
) -TargetPath (Join-Path $LogosDir "expert-logo-dark.png")) -and $ok

Copy-BrandAsset -Candidates @(
  "expert-isotipo.png",
  "logos\expert-isotipo.png",
  "branding\logos\expert-isotipo.png",
  "public\branding\logos\expert-isotipo.png"
) -TargetPath (Join-Path $LogosDir "expert-isotipo.png") | Out-Null

Copy-BrandAsset -Candidates @(
  "expert-favicon.png",
  "logos\expert-favicon.png",
  "branding\logos\expert-favicon.png",
  "public\branding\logos\expert-favicon.png"
) -TargetPath (Join-Path $LogosDir "expert-favicon.png") | Out-Null

Copy-BrandAsset -Candidates @(
  "ksenia-avatar.png",
  "avatars\ksenia-avatar.png",
  "branding\avatars\ksenia-avatar.png",
  "public\branding\avatars\ksenia-avatar.png"
) -TargetPath (Join-Path $AvatarsDir "ksenia-avatar.png") | Out-Null

Copy-BrandAsset -Candidates @(
  "hero-bg.png",
  "backgrounds\hero-bg.png",
  "branding\backgrounds\hero-bg.png",
  "public\branding\backgrounds\hero-bg.png"
) -TargetPath (Join-Path $BackgroundsDir "hero-bg.png") | Out-Null

if (Test-Path (Join-Path $LogosDir "expert-favicon.png")) {
  Copy-Item (Join-Path $LogosDir "expert-favicon.png") (Join-Path $PublicDir "favicon.png") -Force
  Write-Host "OK copied favicon.png to public root" -ForegroundColor Green
}

$readme = @"
# EXPERT Branding Assets

Required production assets:

- `/branding/logos/expert-logo.png`
- `/branding/logos/expert-logo-dark.png`
- `/branding/logos/expert-isotipo.png`
- `/branding/logos/expert-favicon.png`
- `/branding/avatars/ksenia-avatar.png`
- `/branding/backgrounds/hero-bg.png`

Use PNG assets in the website for final visual fidelity. SVG files in this folder are fallback assets only.

## Next.js paths

```tsx
<Image src="/branding/logos/expert-logo-dark.png" alt="EXPERT" width={190} height={64} />
<Image src="/branding/avatars/ksenia-avatar.png" alt="Ksenia Ilicheva" width={560} height={640} />
```
"@

Set-Content -Path (Join-Path $BrandingDir "README.md") -Value $readme -Encoding UTF8

Write-Host ""
Write-Host "Branding import finished." -ForegroundColor Cyan
Write-Host "Repo root: $RepoRoot"
Write-Host "Branding folder: $BrandingDir"

if (-not $ok) {
  Write-Host ""
  Write-Host "Some required assets are missing. Put expert-logo.png and expert-logo-dark.png in $SourceDir and rerun this script." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "git add public/branding public/favicon.png scripts/import-branding-assets.ps1"
Write-Host "git commit -m 'Add final EXPERT branding assets'"
Write-Host "git push"
