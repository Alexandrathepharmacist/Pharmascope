# Construit data/bdpm.json a partir de la Base de donnees publique des medicaments (ANSM).
# Sert au module "Potentiels" de PharmaScope : generiques (repertoire) et biosimilaires.
import json, re, sys, unicodedata, urllib.request, datetime

BASES = ["https://base-donnees-publique.medicaments.gouv.fr/download/file/{f}",
         "https://base-donnees-publique.medicaments.gouv.fr/telechargement.php?fichier={f}"]

def get(f):
    err = []
    for b in BASES:
        u = b.format(f=f)
        try:
            req = urllib.request.Request(u, headers={"User-Agent": "PharmaScope/1.0"})
            raw = urllib.request.urlopen(req, timeout=120).read()
            if len(raw) < 1000 or raw[:200].lower().find(b"<html") >= 0:
                err.append(u + " : contenu inattendu"); continue
            try: txt = raw.decode("utf-8")
            except UnicodeDecodeError: txt = raw.decode("cp1252")
            print(f, "OK", u, len(raw))
            return [l.split("\t") for l in txt.splitlines() if l.strip()]
        except Exception as e:
            err.append(u + " : " + str(e))
    sys.exit("Echec telechargement " + f + "\n" + "\n".join(err))

def norm(s):
    s = unicodedata.normalize("NFD", s or "").encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", s.upper()).strip()

LABS = [("BIOGARAN","BIOGARAN"),("ZENTIVA","ZENTIVA"),("TEVA","TEVA"),("VIATRIS","VIATRIS"),("MYLAN","VIATRIS"),
        ("ARROW","ARROW"),("SANDOZ","SANDOZ"),("EUROGENERICS","EG LABO"),("EG LABO","EG LABO"),("CRISTERS","CRISTERS"),
        ("ZYDUS","ZYDUS"),("SUBSTIPHARM","SUBSTIPHARM"),("ACCORD","ACCORD"),("KRKA","KRKA"),("AGUETTANT","AGUETTANT"),
        ("AMGEN","AMGEN"),("CELLTRION","CELLTRION"),("FRESENIUS","FRESENIUS"),("BIOCON","BIOCON"),("PFIZER","PFIZER"),
        ("SAMSUNG","SAMSUNG BIOEPIS"),("ORGANON","ORGANON"),("STADA","STADA"),("ALMUS","ALMUS"),("BIOGEN","BIOGEN")]
def lab(t):
    n = norm(t)
    for k, v in LABS:
        if k in n: return v
    return n.split(";")[0].strip()[:40] or "?"

def prix(s):
    s = (s or "").strip().replace(" ", "")
    if not s: return None
    if s.count(",") > 1: s = s.replace(",", "", s.count(",") - 1)
    try: return round(float(s.replace(",", ".")), 2)
    except ValueError: return None

cis = {r[0]: r for r in get("CIS_bdpm.txt") if len(r) > 10}
cip_rows = [r for r in get("CIS_CIP_bdpm.txt") if len(r) > 6]
gener = [r for r in get("CIS_GENER_bdpm.txt") if len(r) > 3]
compo = [r for r in get("CIS_COMPO_bdpm.txt") if len(r) > 3]

labs, labi = [], {}
def L(name):
    if name not in labi: labi[name] = len(labs); labs.append(name)
    return labi[name]

cis_cips, cis_comm = {}, {}
cipinfo = {}
for r in cip_rows:
    c, cip13 = r[0], r[6].strip()
    comm = "arr" not in norm(r[4]).lower() and "ARRET" not in norm(r[4])
    cis_cips.setdefault(c, []).append(cip13)
    cis_comm[c] = cis_comm.get(c, False) or comm
    cipinfo[cip13] = (prix(r[9]) if len(r) > 9 else None, comm)

# --- generiques : repertoire ---
grp, cipg, grp_labs = {}, {}, {}
for r in gener:
    gid, lib, c, typ = r[0].strip(), r[1].strip(), r[2].strip(), r[3].strip()
    if c not in cis: continue
    grp[gid] = lib
    li = L(lab(cis[c][10]))
    for cp in cis_cips.get(c, []):
        cipg[cp] = [gid, int(typ) if typ.isdigit() else 9, li, cipinfo.get(cp, (None,))[0]]
    if typ in ("1", "2", "4") and cis_comm.get(c):
        s = grp_labs.setdefault(gid, set()); s.add(li)

# --- biosimilaires (groupes substituables + quelques hors liste) ---
BIO = [("FILGRASTIM","Filgrastim",["NEUPOGEN"],1),("PEGFILGRASTIM","Pegfilgrastim",["NEULASTA"],1),
       ("RANIBIZUMAB","Ranibizumab",["LUCENTIS"],1),("TERIPARATIDE","Teriparatide",["FORSTEO"],1),
       ("ETANERCEPT","Etanercept",["ENBREL"],1),("ADALIMUMAB","Adalimumab",["HUMIRA"],1),
       ("ENOXAPARINE","Enoxaparine",["LOVENOX"],1),("FOLLITROPINE ALFA","Follitropine alfa",["GONAL"],1),
       ("EPOETINE","Epoetine",["EPREX"],1),("AFLIBERCEPT","Aflibercept",["EYLEA"],1),
       ("USTEKINUMAB","Ustekinumab",["STELARA"],1),("DENOSUMAB","Denosumab",["PROLIA","XGEVA"],1),
       ("INSULINE ASPARTE","Insuline asparte",["NOVORAPID","FIASP"],0),("INSULINE LISPRO","Insuline lispro",["HUMALOG","LYUMJEV"],0),
       ("INSULINE GLARGINE","Insuline glargine",["LANTUS","TOUJEO"],0),("INFLIXIMAB","Infliximab",["REMICADE"],0),
       ("TOCILIZUMAB","Tocilizumab",["ROACTEMRA"],0)]
bio, bio_labs = {}, {}
seen = set()
for r in compo:
    c, sub = r[0].strip(), norm(r[3])
    if c not in cis or c in seen: continue
    for key, name, refs, substituable in BIO:
        if key == "FILGRASTIM" and "PEG" in sub: continue
        if key == "EPOETINE" and "BETA" in sub: continue
        if key in sub:
            den = norm(cis[c][1])
            g = name
            if key == "DENOSUMAB": g = "Denosumab 120 mg" if "120" in den else "Denosumab 60 mg"
            if key == "AFLIBERCEPT" and "ZALTRAP" in den: break
            isref = 1 if any(den.startswith(x) for x in refs) else 0
            li = L(lab(cis[c][10]))
            for cp in cis_cips.get(c, []):
                bio[cp] = [g, isref, li, substituable, cipinfo.get(cp, (None,))[0]]
            if not isref and cis_comm.get(c): bio_labs.setdefault(g, set()).add(li)
            seen.add(c)
            break

out = {"maj": datetime.date.today().isoformat(), "source": "Base de donnees publique des medicaments (ANSM)",
       "labs": labs, "grp": grp, "cip": cipg, "grp_labs": {k: sorted(v) for k, v in grp_labs.items()},
       "bio": bio, "bio_labs": {k: sorted(v) for k, v in bio_labs.items()},
       "cles": {"cip": "[groupe, type (0 princeps, 1 generique, 2 complementarite, 4 substituable), labo, prix TTC]",
                "bio": "[groupe, 1=reference, labo, 1=substituable par le pharmacien, prix TTC]"}}
import os; os.makedirs("data", exist_ok=True)
json.dump(out, open("data/bdpm.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("groupes", len(grp), "cip generiques", len(cipg), "cip biosim", len(bio), "labos", len(labs))
if len(grp) < 500 or len(cipg) < 5000: sys.exit("Resultat anormalement petit : fichier non publie")
