param(
  [string]$TargetDrive = "D:",
  [string]$SourceRoot = "H:\",
  [string]$RepoFolder = "ksenia_expert"
)

$ErrorActionPreference = "Stop"

function Normalize-Drive([string]$Drive) {
  if ($Drive.EndsWith(":")) {
    return $Drive
  }
  return "${Drive}:"
}

$target = Normalize-Drive $TargetDrive
$repoPath = Join-Path $SourceRoot $RepoFolder
$targetRepoPath = Join-Path "$target\" $RepoFolder

if (-not (Test-Path -LiteralPath $repoPath)) {
  Write-Error "Source repo not found: $repoPath"
  exit 1
}

if (Test-Path -LiteralPath $targetRepoPath) {
  Write-Host "Workspace OK: $targetRepoPath"
  exit 0
}

$driveName = $target.TrimEnd(":")
$existingDrive = Get-PSDrive -Name $driveName -ErrorAction SilentlyContinue
if ($existingDrive -and -not (Test-Path -LiteralPath $targetRepoPath)) {
  Write-Error "$target exists but does not point to EXPERT workspace. Current root: $($existingDrive.Root)"
  exit 1
}

cmd /c "subst $target `"$SourceRoot`""

if (-not (Test-Path -LiteralPath $targetRepoPath)) {
  Write-Error "Could not restore workspace alias $target => $SourceRoot"
  exit 1
}

Write-Host "Workspace alias restored: $target => $SourceRoot"
Write-Host "Repo available at: $targetRepoPath"
