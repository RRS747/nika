import numpy as np, re, os, sys
from lxml import etree
NS={'c':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02','p':'http://schemas.microsoft.com/3dmanufacturing/production/2015/06'}
P='{http://schemas.microsoft.com/3dmanufacturing/production/2015/06}'
def T(s):
    if not s: return np.eye(4)
    v=list(map(float,s.split())); M=np.eye(4)
    M[:3,:3]=np.array(v[:9]).reshape(3,3).T; M[:3,3]=v[9:12]  # 3mf row-vector convention
    return M
cache={}
def load(root,path):
    if (root,path) not in cache:
        cache[(root,path)]=etree.parse(os.path.join(root,path.lstrip('/')))
    return cache[(root,path)]
def objmesh(root,path,oid):
    """return list of (component_objectid, verts, tris) in object coords"""
    doc=load(root,path)
    o=doc.find(f".//c:object[@id='{oid}']",NS)
    out=[]
    m=o.find('c:mesh',NS)
    if m is not None:
        vs=m.find('c:vertices',NS); ts=m.find('c:triangles',NS)
        V=np.array([[float(v.get('x')),float(v.get('y')),float(v.get('z'))] for v in vs],dtype=np.float64)
        F=np.array([[int(t.get('v1')),int(t.get('v2')),int(t.get('v3'))] for t in ts],dtype=np.int64)
        out.append((oid,V,F))
    comps=o.find('c:components',NS)
    if comps is not None:
        for c in comps:
            p=c.get(P+'path') or path
            M=T(c.get('transform'))
            for cid,V,F in objmesh(root,p,c.get('objectid')):
                V2=(np.c_[V,np.ones(len(V))]@M.T)[:,:3]
                out.append((cid,V2,F))
    return out
def names(root):
    f=os.path.join(root,'Metadata/model_settings.config'); d={}; od={}
    if os.path.exists(f):
        x=etree.parse(f)
        for o in x.findall('object'):
            on=o.find("metadata[@key='name']"); od[o.get('id')]=on.get('value') if on is not None else ''
            for p in o.findall('part'):
                n=p.find("metadata[@key='name']"); d[p.get('id')]=n.get('value') if n is not None else ''
    return od,d
def parse(root):
    doc=load(root,'/3D/3dmodel.model'); od,pd=names(root); items=[]
    for it in doc.findall('.//c:build/c:item',NS):
        oid=it.get('objectid'); M=T(it.get('transform'))
        parts=[]
        for cid,V,F in objmesh(root,'/3D/3dmodel.model',oid):
            V2=(np.c_[V,np.ones(len(V))]@M.T)[:,:3]
            parts.append((pd.get(cid,cid),V2,F))
        items.append((od.get(oid,oid),parts))
    return items
if __name__=='__main__':
    for d in sys.argv[1:]:
        print('==',d)
        for n,parts in parse(d)[:12]:
            for pn,V,F in parts:
                mn,mx=V.min(0),V.max(0)
                print(f'  {n!r:28} part {pn!r:24} tris {len(F):7d} min {mn.round(1)} size {(mx-mn).round(1)}')
