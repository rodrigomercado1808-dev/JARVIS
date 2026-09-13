import argparse, json
from pathlib import Path
import torch
from tokenizer import CharTokenizer

p=argparse.ArgumentParser(); p.add_argument('--input',required=True); p.add_argument('--output',default='brain/data.pt'); args=p.parse_args()
text=Path(args.input).read_text(encoding='utf-8'); tok=CharTokenizer(); tok.save('brain/tokenizer.json'); ids=torch.tensor(tok.encode(text),dtype=torch.long); split=int(len(ids)*.9); Path(args.output).parent.mkdir(parents=True,exist_ok=True); torch.save({'train':ids[:split],'valid':ids[split:]},args.output); print(json.dumps({'tokens':len(ids),'vocab':len(tok.chars),'train':split}))
