param(
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$destRoot = Join-Path $root 'midis'

$items = @(
  @{ Game = 'snake';      File = 'maybe.mid';                     Url = 'https://raw.githubusercontent.com/m-malandro/CC0-midis/main/midis/maybe.mid' },
  @{ Game = 'tetris';     File = 'gears.mid';                     Url = 'https://raw.githubusercontent.com/m-malandro/CC0-midis/main/midis/gears.mid' },
  @{ Game = 'pong';       File = 'movin-on.mid';                  Url = 'https://raw.githubusercontent.com/m-malandro/CC0-midis/main/midis/movin-on.mid' },
  @{ Game = 'invaders';   File = 'frantic-boss-battle.mid';       Url = 'https://raw.githubusercontent.com/m-malandro/CC0-midis/main/midis/frantic-boss-battle.mid' },
  @{ Game = 'breakout';   File = 'lighthearted-battle-theme.mid'; Url = 'https://raw.githubusercontent.com/m-malandro/CC0-midis/main/midis/lighthearted-battle-theme.mid' },
  @{ Game = 'flappy';     File = 'do-you-remember.mid';          Url = 'https://raw.githubusercontent.com/m-malandro/CC0-midis/main/midis/do-you-remember.mid' },
  @{ Game = 'asteroids';  File = 'android-observation-room.mid';  Url = 'https://raw.githubusercontent.com/m-malandro/CC0-midis/main/midis/android-observation-room.mid' },
  @{ Game = 'simon';      File = 'gather-your-party.mid';        Url = 'https://raw.githubusercontent.com/m-malandro/CC0-midis/main/midis/gather-your-party.mid' },
  @{ Game = 'life';       File = 'sitar-jam.mid';                 Url = 'https://raw.githubusercontent.com/m-malandro/CC0-midis/main/midis/sitar-jam.mid' },
  @{ Game = 'minesweeper';File = 'mine-all-mine.mid';             Url = 'https://raw.githubusercontent.com/m-malandro/CC0-midis/main/midis/mine-all-mine.mid' },
  @{ Game = 'misc';       File = 'game-over.mid';                 Url = 'https://raw.githubusercontent.com/m-malandro/CC0-midis/main/midis/game-over.mid' }
)

New-Item -ItemType Directory -Force -Path $destRoot | Out-Null

foreach ($item in $items) {
  $dir = Join-Path $destRoot $item.Game
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $outFile = Join-Path $dir $item.File
  if ($WhatIf) {
    Write-Host "[WHATIF] $($item.Game) -> $outFile"
    continue
  }
  Write-Host "Downloading $($item.Game): $($item.File)"
  Invoke-WebRequest -Uri $item.Url -OutFile $outFile
}

Write-Host 'Done.'
