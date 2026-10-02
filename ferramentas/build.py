import parse3mf as p, numpy as np, trimesh, json, fast_simplification as fs
def norm(V): return V - V.min(0)
def bb(V): return V.min(0), V.max(0)
def first(items, name):
    for n,parts in items:
        for pn,V,F in parts:
            if pn==name: return norm(V.copy()),F
    raise KeyError(name)
def Rx180(V): V=V.copy(); V[:,1]*=-1; V[:,2]*=-1; return V
def center_xy(V, cx=0, cy=0):
    mn,mx=bb(V); V=V.copy(); V[:,0]+=cx-(mn[0]+mx[0])/2; V[:,1]+=cy-(mn[1]+mx[1])/2; return V
def setz(V, z0): V=V.copy(); V[:,2]+=z0-V[:,2].min(); return V
def simplify(V,F,target):
    if len(F)<=target: return V,F
    V2,F2=fs.simplify(V.astype(np.float32),F.astype(np.int32),target_reduction=1-target/len(F))
    return V2.astype(np.float64),F2
def export(name, nodes):
    """nodes: list of (nodeName, V(z-up mm), F). Convert to Y-up and save GLB."""
    sc=trimesh.Scene()
    for nn,V,F in nodes:
        Vy=np.c_[V[:,0], V[:,2], -V[:,1]]
        m=trimesh.Trimesh(Vy,F,process=True)
        m.merge_vertices()
        sc.add_geometry(m, node_name=nn, geom_name=nn)
    sc.export(f'out/{name}.glb')
    import os; print(name, sum(len(F) for _,_,F in nodes),'tris', os.path.getsize(f'out/{name}.glb')//1024,'KB')
import os; os.makedirs('out',exist_ok=True)

if __name__ == '__main__':
    # ---------- Caixa de agulhas ----------
    it=p.parse('Caixa de Agulhas')
    base,Fb=first(it,'BASE'); lid,Fl=first(it,'COUVERCLE')
    base=center_xy(base); 
    lid=center_xy(Rx180(lid)); lid=setz(lid,25.5); lidTop=lid[:,2].max()
    offs={'INSERT MACHINE':(1.08,-0.45),'INSERT MOLETTE 1':(-14.36,-8.68),'INSERT MOLETTE 2':(15.46,-0.44),'INSERT BOUTTON 1':(15.49,-7.13),'INSERT BOUTTON 2':(15.48,-11.25)}
    nodes=[('Caixa__z',base,Fb),('Tampa__z',lid,Fl)]
    for k,(ox,oy) in offs.items():
        V,F=first(it,k); V=Rx180(V); V=center_xy(V,ox,-oy); V=setz(V,lidTop-2)
        nodes.append(('Aplique__z',V,F))
    # merge aplique nodes
    ap=[n for n in nodes if n[0]=='Aplique__z']; Vs=[];Fs=[];o=0
    for _,V,F in ap: Vs.append(V);Fs.append(F+o);o+=len(V)
    nodes=[n for n in nodes if n[0]!='Aplique__z']+[('Aplique__z',np.vstack(Vs),np.vstack(Fs))]
    export('caixa-agulhas',nodes)

    # ---------- Suporte 4 prateleiras ----------
    it=p.parse('Suporte 4 prateleiras')
    st,Fs_=first(it,'Right Stand'); sh,Fh=first(it,'Basic .stl')
    def stand(xoff):
        V=np.c_[st[:,2]+xoff, st[:,0], 187-st[:,1]]  # X=thickness, Y=depth, Z=height
        return V
    H=[44,89,134,179]
    nodes=[]
    SV=[];SF=[];o=0
    for xo in (0,240):
        V=stand(xo); F=Fs_[:, ::-1] if False else Fs_
        SV.append(V);SF.append(F+o);o+=len(V)
    Vst=np.vstack(SV); Fst=np.vstack(SF)
    # fix winding if mirrored (determinant of mapping)
    M=np.array([[0,0,1],[1,0,0],[0,-1,0]]); 
    if np.linalg.det(M)<0: Fst=Fst[:,::-1]
    PV=[];PF=[];o=0
    for i,h in enumerate(H):
        V=np.c_[sh[:,0], i*62.5+sh[:,1], h+sh[:,2]]
        PV.append(V);PF.append(Fh+o);o+=len(V)
    nodes=[('Laterais__x',Vst,Fst),('Prateleiras__z',np.vstack(PV),np.vstack(PF))]
    export('suporte-4-prateleiras',nodes)

    # ---------- Fita métrica ----------
    it=p.parse('Fita Métrica')
    body,Fbd=first(it,'零件1'); ring,Fr=first(it,'零件2')
    body,Fbd=simplify(body,Fbd,30000)
    body=center_xy(body); ring=setz(center_xy(ring),23.0)
    nodes=[('Corpo__z',body,Fbd),('Tampa__z',ring,Fr)]
    export('fita-metrica',nodes)

    # ---------- Bobinas ----------
    it=p.parse('Bobin')
    b1,F1=first(it,'Sewing Bobbins_1'); b2,F2=first(it,'Sewing Bobbins_2')
    top=Rx180(b1); 
    A=[];B=[];FA=[];FB=[];oa=ob=0
    for (x,y) in [(-13,-8),(13,-8),(0,14)]:
        Vb=center_xy(b2,x,y); Vt=setz(center_xy(top,x,y),11.7-(top[:,2].max()-top[:,2].min()))
        A.append(Vt);FA.append(F1+oa);oa+=len(Vt)
        B.append(Vb);FB.append(F2+ob);ob+=len(Vb)
    export('bobinas',[('Superior__z',np.vstack(A),np.vstack(FA)),('Inferior__z',np.vstack(B),np.vstack(FB))])
