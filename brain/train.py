import argparse, math, torch
from pathlib import Path
from model import JarvisTransformer
from tokenizer import CharTokenizer

p=argparse.ArgumentParser(); p.add_argument('--data',default='brain/data.pt'); p.add_argument('--out',default='brain/checkpoints/jarvis.pt'); p.add_argument('--steps',type=int,default=5000); p.add_argument('--batch',type=int,default=16); p.add_argument('--context',type=int,default=256); p.add_argument('--lr',type=float,default=3e-4); args=p.parse_args()
data=torch.load(args.data); tok=CharTokenizer.load('brain/tokenizer.json'); device='cuda' if torch.cuda.is_available() else 'cpu'; model=JarvisTransformer(len(tok.chars),args.context).to(device); opt=torch.optim.AdamW(model.parameters(),lr=args.lr)
def batch(split):
 x=data[split]; starts=torch.randint(0,len(x)-args.context-1,(args.batch,)); a=torch.stack([x[i:i+args.context] for i in starts]).to(device); b=torch.stack([x[i+1:i+args.context+1] for i in starts]).to(device); return a,b
for step in range(args.steps):
 model.train(); x,y=batch('train'); _,loss=model(x,y); opt.zero_grad(); loss.backward(); torch.nn.utils.clip_grad_norm_(model.parameters(),1.0); opt.step()
 if step%100==0: print(f'step={step} loss={loss.item():.4f}',flush=True)
Path(args.out).parent.mkdir(parents=True,exist_ok=True); torch.save({'model':model.state_dict(),'vocab':len(tok.chars),'context':args.context},args.out); print('saved',args.out)
