import os

class ServerFactory:
    @staticmethod
    def create_server(address):
        if os.name == 'nt':
            from .named_pipe_server import NamedPipeServer
            return NamedPipeServer(address)
        else:
            from .socket_server import SocketServer
            return SocketServer(address)
