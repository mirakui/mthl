import sys
from lib.server.server_factory import ServerFactory

PIPE_PATH = "\\\\.\\pipe\\candlecat"
OUT_PATH = "candlecat.txt"

print(f"Opening pipe: {PIPE_PATH}")
print(f"Out file: {OUT_PATH}")
server = ServerFactory.create_server(PIPE_PATH)
server.listen()
outfile = open(OUT_PATH, "w")
try:
    print("Receiving data from client...")
    while True:
        line = server.readlines()
        outfile.write(line + "\n")
        print(".", end="")
        outfile.flush()
        sys.stdout.flush()

finally:
    print("Closing server")
    outfile.close()
    server.close()
