import socket
PIPE_PATH = '\\\\.\\pipe\\foo'

print(f'Opening pipe: {PIPE_PATH}')
sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
sock.connect(PIPE_PATH)

print('waiting for a connection')

sock.send(b'Hello, world\n')
