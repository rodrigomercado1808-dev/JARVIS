import json
from pathlib import Path

class CharTokenizer:
    def __init__(self, chars=None):
        self.chars = chars or ['<pad>', '<unk>', '\n'] + list(' abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:!?¿¡()[]{}+-*/=%_#@\\"\'áéíóúÁÉÍÓÚñÑ<>|&')
        self.stoi = {c:i for i,c in enumerate(self.chars)}
        self.itos = {i:c for c,i in self.stoi.items()}
    def encode(self, text): return [self.stoi.get(c, self.stoi['<unk>']) for c in text]
    def decode(self, ids): return ''.join(self.itos.get(int(i), '<unk>') for i in ids)
    def save(self, path): Path(path).write_text(json.dumps(self.chars, ensure_ascii=False), encoding='utf-8')
    @classmethod
    def load(cls, path): return cls(json.loads(Path(path).read_text(encoding='utf-8')))
