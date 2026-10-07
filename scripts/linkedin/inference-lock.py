"""Hold one POSIX inference slot until the parent closes stdin or exits."""
import fcntl
import os
from pathlib import Path
import sys

path = Path(sys.argv[1])
path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
fd = os.open(path, os.O_CREAT | os.O_RDWR, 0o600)
try:
    fcntl.flock(fd, fcntl.LOCK_EX)
    print("ready", flush=True)
    sys.stdin.buffer.read()
finally:
    fcntl.flock(fd, fcntl.LOCK_UN)
    os.close(fd)
