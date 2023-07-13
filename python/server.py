import socket

PIPE_PATH = '\\\\.\\pipe\\foo'

print(f'Opening pipe: {PIPE_PATH}')
sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
sock.bind(PIPE_PATH)
sock.listen(1)

def sock_readlines(sock, recv_buffer=4096, delim='\n'):
    buffer = ''
    data = True
    while data:
        data = sock.recv(recv_buffer)
        buffer += data.decode()

        while buffer.find(delim) != -1:
            line, buffer = buffer.split('\n', 1)
            yield line
    return

while True:
    print('waiting for a connection')
    connection, client_address = sock.accept()

    try:
        print('connection from', client_address)

        for line in sock_readlines(connection):
            print('received {!r}'.format(line))

    finally:
        connection.close()
