#!/usr/bin/env python3
"""Robot de fin de mois : remises CERP pour PharmaScope.

Se connecte au site d'archivage CERP (SAE, cerp-rrm.numeria.fr) avec les identifiants
enregistres dans les secrets GitHub (CERP_LOGIN, CERP_PASSWORD), recupere les nouveaux
avoirs "REMISE COMMERCIALE" (et le recapitulatif des achats sous contrats quand sa rubrique
est configuree), extrait le texte des PDF et le range dans Supabase (cle remises_cerp).
PharmaScope lit ce texte avec les memes regles que les PDF deposes a la main.

Le depot GitHub est public : ce script n'ecrit JAMAIS de montant ni de numero dans le
journal, seulement des comptes ("2 nouveaux documents").
"""
import base64
import datetime
import io
import json
import os
import re
import sys
import urllib.parse

import requests

BASE = "https://cerp-rrm.numeria.fr/a_api/api"
FACTURES = "1_Factures émises"
INDEX_FACTURES = ["Entité juridique", "Document", "Catégorie", "N° de BL", "Numéro de pièce",
                  "Traité", "Date", "HT", "TTC", "Consulté"]
# (rubrique du SAE, filtre sur la categorie) des documents a recuperer
SOURCES = [
    (FACTURES, {"Catégorie": "REMISE COMMERCIALE"}),
]
# rubrique du recapitulatif des achats sous contrats, a renseigner quand elle est connue
# (variable d'environnement CERP_RECAP_RUBRIQUE, ex. "2_Releves", ou ici)
if os.environ.get("CERP_RECAP_RUBRIQUE"):
    SOURCES.append((os.environ["CERP_RECAP_RUBRIQUE"], {}))
GARDER_MOIS = 26


def journal(msg):
    print(msg, flush=True)


def supa_conf():
    url = os.environ.get("SUPA_URL") or ""
    cle = os.environ.get("SUPABASE_KEY") or ""
    if not url or not cle:
        # la cle publique (anon) de l'appli est deja dans index.html
        src = open(os.path.join(os.path.dirname(__file__), "..", "index.html"), encoding="utf-8").read()
        url = url or re.search(r'const SUPA_URL="([^"]+)"', src).group(1)
        cle = cle or re.search(r'const SUPA_KEY="([^"]+)"', src).group(1)
    return url, cle


def supa_lire(url, cle, id_):
    r = requests.get(url + "/rest/v1/app_data", params={"id": "eq." + id_, "select": "data"},
                     headers={"apikey": cle, "Authorization": "Bearer " + cle}, timeout=60)
    r.raise_for_status()
    rows = r.json()
    return rows[0]["data"] if rows else None


def supa_ecrire(url, cle, id_, data):
    r = requests.post(url + "/rest/v1/app_data",
                      headers={"apikey": cle, "Authorization": "Bearer " + cle, "Content-Type": "application/json",
                               "Prefer": "resolution=merge-duplicates,return=minimal"},
                      data=json.dumps({"id": id_, "data": data, "updated_at": datetime.datetime.utcnow().isoformat() + "Z"}),
                      timeout=60)
    r.raise_for_status()


def push(url, cle, titre, texte):
    try:
        requests.post(url + "/functions/v1/push", timeout=30,
                      headers={"apikey": cle, "Authorization": "Bearer " + cle, "Content-Type": "application/json"},
                      data=json.dumps({"action": "alerte", "sujet": "remises", "titre": titre, "texte": texte, "page": "generiques"}))
    except Exception:
        journal("Notification non envoyee (sans gravite).")


class Cerp:
    def __init__(self, login, mdp):
        self.s = requests.Session()
        self.s.headers.update({"Language": "fr", "Accept": "application/json, text/plain, */*"})
        r = self.s.post(BASE + "/Account/Logon", timeout=60,
                        json={"DomainName": "CERP", "UserName": login, "Password": mdp, "MfaCode": None, "CookiePath": "/a_api/"})
        if r.status_code != 200:
            raise RuntimeError("connexion CERP refusee (code %s)" % r.status_code)
        try:
            j = r.json()
            jeton = j if isinstance(j, str) else r.text
        except ValueError:
            jeton = r.text
        self.s.headers["Authorization"] = "ARGUS " + urllib.parse.quote(jeton, safe="-_.!~*'()")

    def chercher(self, rubrique, filtres, prendre=60):
        noms = INDEX_FACTURES if rubrique == FACTURES else list(filtres.keys())
        corps = {"DocumentType": base64.b64encode(rubrique.encode("utf-8")).decode(),
                 "QueryParams": {"ArchiveTicket": "", "Take": prendre, "Skip": 0,
                                 "IndexFilters": [{"Filter": filtres.get(n, ""), "Name": n, "Hide": False} for n in noms],
                                 "SortField": "", "SortDescending": True, "SortFields": [], "RecordCount": True}}
        r = self.s.post(BASE + "/EAS/Query", json=corps, timeout=120)
        r.raise_for_status()
        return r.json().get("data") or []

    def pdf(self, item):
        r = self.s.post(BASE + "/EAS/GetDocumentAsStream", timeout=120,
                        json={"RecordRef": item["_RecordRef"], "DocumentTicket": item["_DocumentTicket"], "Download": True, "Legal": False})
        r.raise_for_status()
        b = r.content
        if not b.startswith(b"%PDF"):
            try:
                b = base64.b64decode(r.json())
            except Exception:
                pass
        return b


def texte_pdf(octets):
    import pdfplumber
    with pdfplumber.open(io.BytesIO(octets)) as pdf:
        return "\n".join((p.extract_text() or "") for p in pdf.pages[:8])


def date_iso(s):
    m = re.match(r"(\d{2})/(\d{2})/(\d{4})", s or "")
    return "%s-%s-%s" % (m.group(3), m.group(2), m.group(1)) if m else None


def fin_de_mois_paris():
    maintenant = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    return (maintenant + datetime.timedelta(days=1)).day == 1


def main():
    # lance a la main (bouton Run workflow) ou apres une mise a jour du robot : on travaille tout de suite
    manuel = os.environ.get("GITHUB_EVENT_NAME") in ("workflow_dispatch", "push")
    if not manuel and not fin_de_mois_paris():
        journal("Pas le dernier jour du mois : rien a faire.")
        return 0
    url, cle = supa_conf()
    login, mdp = os.environ.get("CERP_LOGIN"), os.environ.get("CERP_PASSWORD")
    etat = supa_lire(url, cle, "remises_cerp") or {}
    lus = etat.get("lus") or {}
    if not login or not mdp:
        etat["robot"] = {"le": datetime.datetime.utcnow().isoformat() + "Z", "ok": False, "msg": "identifiants CERP non enregistrés dans GitHub"}
        supa_ecrire(url, cle, "remises_cerp", etat)
        journal("Identifiants CERP absents des secrets GitHub.")
        return 1
    nouveaux = 0
    try:
        cerp = Cerp(login, mdp)
        journal("Connexion CERP : OK")
        limite = (datetime.date.today() - datetime.timedelta(days=31 * GARDER_MOIS)).isoformat()
        for rubrique, filtres in SOURCES:
            docs = cerp.chercher(rubrique, filtres)
            journal("%s : %d document(s) dans la liste" % (rubrique.split("_", 1)[-1], len(docs)))
            for it in docs:
                d = date_iso(it.get("Date"))
                if not d or d < limite:
                    continue
                cle_doc = "%s|%s|%s" % (it.get("Catégorie") or rubrique, it.get("Numéro de pièce") or it.get("_DocumentTicket"), d)
                if cle_doc in lus:
                    continue
                txt = texte_pdf(cerp.pdf(it))
                if not txt.strip():
                    continue
                lus[cle_doc] = {"cat": it.get("Catégorie") or rubrique, "num": it.get("Numéro de pièce"), "date": d, "texte": txt[:20000]}
                nouveaux += 1
        # on ne garde que les GARDER_MOIS derniers mois
        lus = {k: v for k, v in lus.items() if (v.get("date") or "") >= limite}
        etat.update({"v": 1, "lus": lus, "robot": {"le": datetime.datetime.utcnow().isoformat() + "Z", "ok": True, "nb": nouveaux}})
        supa_ecrire(url, cle, "remises_cerp", etat)
        journal("%d nouveau(x) document(s) range(s) dans PharmaScope." % nouveaux)
    except Exception as e:  # noqa: BLE001
        msg = str(e)[:120]
        msg = re.sub(r"\d{4,}", "…", msg)
        etat["robot"] = {"le": datetime.datetime.utcnow().isoformat() + "Z", "ok": False, "msg": msg}
        try:
            supa_ecrire(url, cle, "remises_cerp", etat)
        except Exception:
            pass
        journal("Erreur : " + msg)
        push(url, cle, "⚠️ Robot CERP en erreur", "Les remises CERP du mois n'ont pas pu être récupérées : " + msg)
        return 1
    push(url, cle, "💊 Remises génériqueurs : fin de mois",
         ("%d document(s) CERP récupéré(s). " % nouveaux if nouveaux else "") +
         "Déposez dans PharmaScope les 2 exports SY by Cegedim et le relevé du Crédit Agricole pour vérifier les versements.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
