class Server:
    def __init__(self, address):
        self.address = address

    def listen(self):
        raise NotImplementedError

    def readlines(self):
        raise NotImplementedError

    def close(self):
        raise NotImplementedError
