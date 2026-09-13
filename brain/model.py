import torch
from torch import nn

class JarvisTransformer(nn.Module):
    def __init__(self, vocab_size, context_size=256, width=256, heads=4, layers=4):
        super().__init__(); self.context_size=context_size
        self.token=nn.Embedding(vocab_size,width); self.position=nn.Embedding(context_size,width)
        block=nn.TransformerEncoderLayer(d_model=width,nhead=heads,dim_feedforward=4*width,dropout=0.1,batch_first=True,activation='gelu')
        self.blocks=nn.TransformerEncoder(block,num_layers=layers); self.norm=nn.LayerNorm(width); self.lm_head=nn.Linear(width,vocab_size,bias=False); self.lm_head.weight=self.token.weight
    def forward(self, ids, targets=None):
        b,t=ids.shape; pos=torch.arange(t,device=ids.device); x=self.token(ids)+self.position(pos)[None,:,:]; mask=torch.triu(torch.ones(t,t,device=ids.device),diagonal=1).bool(); logits=self.lm_head(self.norm(self.blocks(x,mask=mask)))
        loss=None if targets is None else nn.functional.cross_entropy(logits.reshape(-1,logits.size(-1)),targets.reshape(-1))
        return logits,loss
