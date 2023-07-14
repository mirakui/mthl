from lib.server.server_factory import ServerFactory

PIPE_PATH = '\\\\.\\pipe\\foo'

print(f'Opening pipe: {PIPE_PATH}')
server = ServerFactory.create_server(PIPE_PATH)
server.listen()
try:
    print('Receiving data from client...')
    while True:
        line = server.readlines()
        print(f'Received: {line}')

finally:
    print('Closing server')
    server.close()
