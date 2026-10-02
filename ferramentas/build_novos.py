import parse3mf as p, numpy as np
from build import norm, first, center_xy, setz, simplify, export   # reaproveita funções (não reexecuta builds: guardado abaixo)
import os; os.makedirs('out',exist_ok=True)
# ---------- Suporte 3 prateleiras ----------
it=p.parse('Suporte 3 prateleiras')
arc,Fa=first(it,'Arco_lateral 1'); arc2,Fa2=first(it,'Arco_lateral 2'); sh,Fh=first(it,'prateleira')
arc,Fa=simplify(arc,Fa,7000); arc2,Fa2=simplify(arc2,Fa2,7000); sh,Fh=simplify(sh,Fh,4000)
def lateral(V,xoff):  # X=espessura, Y=profundidade, Z=altura (arco impresso deitado, chão = borda y=200)
    return np.c_[V[:,2]+xoff, V[:,0], 200-V[:,1]]
LV=[];LF=[];o=0
# lateral 1: mapeamento espelha → inverte faces; lateral 2 vem espelhada no arquivo → desespelha a profundidade
LV.append(lateral(arc,-1.0)); LF.append(Fa[:,::-1]); o=len(arc)
V2=lateral(arc2,236.6); V2[:,1]=240-V2[:,1]
LV.append(V2); LF.append(Fa2+o)
PV=[];PF=[];o=0
for centro,h in ((40,200),(115,120),(192.5,55)):
    V=np.c_[sh[:,0], centro-35+sh[:,1], h-12+sh[:,2]]
    PV.append(V);PF.append(Fh+o);o+=len(V)
export('suporte-3-prateleiras',[('Laterais__x',np.vstack(LV),np.vstack(LF)),('Prateleiras__z',np.vstack(PV),np.vstack(PF))])
# ---------- Porta canetinhas 80 ----------
it=p.parse('porta canetinhas 80 un')
V,F=first(it,'丙烯马克笔架2.0-80色')
import trimesh
R=trimesh.transformations.rotation_matrix(np.radians(-90),[0,1,0])[:3,:3]   # impresso deitado → em pé (foto do designer)
V=(R@V.T).T; V=V-V.min(0)
export('porta-canetinhas-80',[('Peca__x',center_xy(V),F)])                  # camadas: eixo X impresso virou horizontal
