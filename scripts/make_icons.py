#!/usr/bin/env python3
"""Generate placeholder PNG icons for PWA APK build."""
import struct, zlib, sys


def make_png(size, filename):
    raw = b"\x00" + b"\x1b\x3a\x2d\xff" * (size * size)

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        crc = zlib.crc32(c[4:]) & 0xFFFFFFFF
        return c + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    idat = zlib.compress(raw)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", idat)
        + chunk(b"IEND", b"")
    )
    with open(filename, "wb") as f:
        f.write(png)


if __name__ == "__main__":
    make_png(512, sys.argv[1])
    make_png(192, sys.argv[2])
