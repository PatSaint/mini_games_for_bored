from pathlib import Path
import struct

TPQ = 480
ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'midis' / 'generated'

SONGS = {
    'snake/start.mid': [(72, 240), (76, 240), (79, 480)],
    'snake/eat.mid': [(76, 120), (79, 120), (84, 240)],
    'snake/death.mid': [(74, 120), (70, 120), (66, 360)],

    'tetris/bgm.mid': [(64, 120), (67, 120), (71, 120), (74, 240), (71, 120), (67, 120), (64, 240)],
    'tetris/rotate.mid': [(72, 90), (76, 90), (79, 180)],
    'tetris/drop.mid': [(67, 120), (55, 180)],
    'tetris/lineclear.mid': [(72, 120), (76, 120), (79, 120), (84, 360)],
    'tetris/levelup.mid': [(72, 120), (76, 120), (79, 120), (84, 120), (88, 480)],
    'tetris/gameover.mid': [(64, 120), (63, 120), (62, 120), (60, 480)],

    'pong/hit.mid': [(76, 60), (79, 60), (83, 120)],
    'pong/score.mid': [(72, 100), (76, 100), (79, 100), (84, 240)],
    'pong/win.mid': [(72, 120), (76, 120), (79, 120), (84, 120), (88, 360)],
    'pong/lose.mid': [(72, 120), (68, 120), (64, 240)],

    'invaders/bgm.mid': [(60, 120), (63, 120), (67, 120), (70, 120), (67, 120), (63, 120)],
    'invaders/shoot.mid': [(84, 60), (88, 60), (91, 90)],
    'invaders/hit.mid': [(76, 60), (72, 60), (68, 90)],
    'invaders/explode.mid': [(60, 90), (58, 90), (55, 180)],
    'invaders/waveclear.mid': [(72, 120), (76, 120), (79, 120), (84, 360)],
    'invaders/gameover.mid': [(67, 120), (66, 120), (64, 120), (62, 360)],

    'minesweeper/reveal.mid': [(74, 70), (79, 70)],
    'minesweeper/flag.mid': [(72, 80), (76, 80), (79, 120)],
    'minesweeper/explode.mid': [(64, 120), (60, 120), (55, 240)],
    'minesweeper/win.mid': [(72, 100), (76, 100), (79, 100), (84, 360)],

    'flappy/flap.mid': [(84, 60), (88, 60)],
    'flappy/score.mid': [(76, 70), (79, 70), (84, 120)],
    'flappy/crash.mid': [(74, 120), (69, 120), (62, 360)],

    'breakout/bgm.mid': [(60, 120), (64, 120), (67, 120), (71, 120), (74, 240), (71, 120), (67, 120)],
    'breakout/paddle.mid': [(79, 60), (83, 60)],
    'breakout/brick.mid': [(72, 60), (76, 60), (79, 90)],
    'breakout/powerup.mid': [(72, 90), (76, 90), (79, 90), (84, 240)],
    'breakout/lose.mid': [(67, 120), (64, 120), (60, 360)],
    'breakout/win.mid': [(72, 120), (76, 120), (79, 120), (84, 120), (88, 360)],

    'life/ambient.mid': [(60, 240), (64, 240), (67, 240), (71, 480)],
    'life/toggle.mid': [(76, 60), (79, 60)],
    'life/tick.mid': [(72, 60), (74, 60)],
    'life/complete.mid': [(72, 120), (76, 120), (79, 120), (84, 240)],
    'life/extinction.mid': [(66, 120), (62, 120), (57, 240)],

    'asteroids/bgm.mid': [(62, 120), (65, 120), (69, 120), (74, 240), (69, 120), (65, 120)],
    'asteroids/thrust.mid': [(72, 40), (76, 40), (79, 40), (83, 120)],
    'asteroids/shoot.mid': [(86, 50), (89, 50), (93, 90)],
    'asteroids/split.mid': [(74, 60), (71, 60), (67, 120)],
    'asteroids/explode.mid': [(60, 90), (58, 90), (55, 180)],
    'asteroids/gameover.mid': [(64, 120), (62, 120), (60, 120), (58, 360)],

    'simon/red.mid': [(60, 120)],
    'simon/blue.mid': [(64, 120)],
    'simon/green.mid': [(67, 120)],
    'simon/yellow.mid': [(69, 120)],
    'simon/success.mid': [(60, 100), (64, 100), (67, 100), (72, 260)],
    'simon/fail.mid': [(72, 100), (67, 100), (60, 260)],
}


def vlq(n: int) -> bytes:
    buf = [n & 0x7F]
    n >>= 7
    while n:
        buf.append(0x80 | (n & 0x7F))
        n >>= 7
    return bytes(reversed(buf))


def chunk(tag: bytes, payload: bytes) -> bytes:
    return tag + struct.pack('>I', len(payload)) + payload


def midi_file(notes, tempo=500000, velocity=100):
    track = bytearray()
    track += vlq(0) + b'\xff\x51\x03' + struct.pack('>I', tempo)[1:]
    track += vlq(0) + bytes([0xC0, 0])
    for note, dur in notes:
        track += vlq(0) + bytes([0x90, note, velocity])
        track += vlq(dur) + bytes([0x80, note, 0])
    track += vlq(0) + b'\xff\x2f\x00'
    header = chunk(b'MThd', struct.pack('>HHH', 0, 1, TPQ))
    body = chunk(b'MTrk', bytes(track))
    return header + body


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for rel, notes in SONGS.items():
        path = OUT / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(midi_file(notes))
        print(f'Wrote {path.relative_to(ROOT)}')

if __name__ == '__main__':
    main()
