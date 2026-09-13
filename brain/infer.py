import argparse, torch
from model import JarvisTransformer
from tokenizer import CharTokenizer
p=argparse.ArgumentParser(); p.add_argument('--model',default='brain/checkpoints/jarvis.pt'); p.add_argument('--prompt',required=True); p.add_argument('--tokens',type=int,default=160); args=p.parse_args(); tok=CharTokenizer.load('brain/tokenizer.json'); ck=torch.load(args.model,map_location='cpu'); model=JarvisTransformer(ck['vocab'],ck['context']); model.load_state_dict(ck['model']); model.eval(); ids=torch.tensor([tok.encode(args.prompt)[-ck['context']:]],dtype=torch.long)
with torch.no_grad():
 for _ in range(args.tokens):
  logits,_=model(ids[:,-ck['context']:]); nxt=torch.multinomial(torch.softmax(logits[:,-1,:]/0.8,dim=-1),1); ids=torch.cat([ids,nxt],dim=1)
generated=tok.decode(ids[0].tolist()); print(generated[len(args.prompt[-ck['context']:]):])
