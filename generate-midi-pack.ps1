$root = Split-Path -Parent $MyInvocation.MyCommand.Path
python (Join-Path $root 'generate-midi-pack.py')
