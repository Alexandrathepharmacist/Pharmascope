import { useState, useCallback, useRef, useEffect, createContext, useContext, useMemo } from "react";

// ─── WINDOW WIDTH HOOK ───────────────────────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 375);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

// ─── THEME ───────────────────────────────────────────────────────────────────
const TL = { bg:"#f0f4f8", card:"#ffffff", border:"#e2e8f0", text:"#0f172a", neutral:"#64748b", primary:"#1a56db", success:"#0e9f6e", warning:"#d97706", danger:"#dc2626", muted:"#f8fafc", headerBg:"#ffffff", navBg:"#ffffff", shadow:"rgba(0,0,0,0.06)" };
const TD = { bg:"#0b1120", card:"#1a2235", border:"#2a3a52", text:"#f1f5f9", neutral:"#94a3b8", primary:"#60a5fa", success:"#34d399", warning:"#fbbf24", danger:"#f87171", muted:"#111827", headerBg:"#111827", navBg:"#111827", shadow:"rgba(0,0,0,0.4)" };
type Theme = typeof TL;
const ThemeCtx = createContext<Theme>(TL);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const MONTHS = ["Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc","Jan"];
function fmt(n: number | null | undefined) { if (n == null || isNaN(n as number)) return "—"; return Number(n).toLocaleString("fr-FR",{maximumFractionDigits:0})+"€"; }
function pct(n: number | null | undefined) { if (n == null || isNaN(n as number)) return "—"; return (Number(n)>=0?"+":"")+Number(n).toFixed(1)+"%"; }
function fmtN(n: number | null | undefined) { if (n == null || isNaN(n as number)) return "—"; return Number(n).toLocaleString("fr-FR",{maximumFractionDigits:0}); }

const STC: Record<string,{label:string,bg:string,text:string,border:string}> = {
  boom:{label:"🚀 En boom",bg:"#dcfce7",text:"#166534",border:"#86efac"},
  good:{label:"✅ Bon",bg:"#dbeafe",text:"#1e40af",border:"#93c5fd"},
  stable:{label:"→ Stable",bg:"#f3f4f6",text:"#374151",border:"#d1d5db"},
  warning:{label:"⚠️ Attention",bg:"#fef3c7",text:"#92400e",border:"#fcd34d"},
  danger:{label:"🔴 Danger",bg:"#fee2e2",text:"#991b1b",border:"#fca5a5"}
};

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Product { name:string; pvmp:number; prmp:number; pvTTC:number; qte:number; marge:number; tx:number; stock:number; }
interface Competitor { name:string; ca:number; marge:number; tx:number; notes:string; }
interface Monthly { m:string; ca:number; marge:number; }
interface BrandData {
  tva:string; ca:number; marge:number; ca_n1:number; marge_n1:number; qte:number; tx:number; evol:number; status:string; color:string;
  info:string; objectifTx:number; notes:string[]; actions:string[];
  monthly:Monthly[]; products:Product[]; competitors:Competitor[];
  merchandising?:any; stock?:any; rfa?:any; promos?:any[]; flyers?:any[];
}
interface LabData {
  tva:string; ca:number; marge:number; ca_n1:number; marge_n1:number; qte:number; tx:number; evol:number; status:string; color:string;
  segment:string; info:string; objectifTx?:number; notes:string[]; actions:string[]; monthly:Monthly[]; topProduits:string[];
}

// ─── STATIC DATA ─────────────────────────────────────────────────────────────
const BD: Record<string,BrandData> = {
  "La Rosée":{tva:"20",ca:17834,marge:6841,ca_n1:17834,marge_n1:7399,qte:1478,tx:38.4,evol:0.0,status:"stable",color:"#f59e0b",info:"Marque naturelle premium en forte croissance. Clientèle CSP+ sensible au naturel.",objectifTx:42,notes:["Bonne visibilité vitrine","Réassort rapide nécessaire"],actions:["Mettre en avant la gamme visage","Proposer coffret cadeau en période festive","Former l'équipe aux arguments naturel/bio"],monthly:[{m:"Fév",ca:1200,marge:461},{m:"Mar",ca:1450,marge:557},{m:"Avr",ca:1680,marge:645},{m:"Mai",ca:1820,marge:699},{m:"Juin",ca:1520,marge:584},{m:"Juil",ca:1280,marge:492},{m:"Aoû",ca:1100,marge:423},{m:"Sep",ca:1380,marge:530},{m:"Oct",ca:1490,marge:572},{m:"Nov",ca:1560,marge:599},{m:"Déc",ca:1980,marge:760},{m:"Jan",ca:1374,marge:528}],products:[{name:"Sérum Vitamine C",pvmp:18.90,prmp:11.20,pvTTC:18.90,qte:312,marge:7.70,tx:40.7,stock:24},{name:"Crème Hydratante",pvmp:14.50,prmp:8.80,pvTTC:14.50,qte:445,marge:5.70,tx:39.3,stock:38},{name:"Gel Nettoyant",pvmp:12.90,prmp:7.60,pvTTC:12.90,qte:289,marge:5.30,tx:41.1,stock:19},{name:"Eau Micellaire",pvmp:9.90,prmp:5.80,pvTTC:9.90,qte:432,marge:4.10,tx:41.4,stock:31}],competitors:[{name:"Aroma-Zone",ca:8000,marge:3200,tx:40,notes:"Présent en ligne surtout"},{name:"Respire",ca:5000,marge:2000,tx:40,notes:"Gamme déo forte"}],rfa:{tauxNegocié:8.5,tauxAtteint:7.2,montantEstimé:1280,echeance:"Déc 2025",notes:"Objectif : atteindre palier 9%"},promos:[{nom:"Offre printemps",remise:"20% / 3 achetés 1 offert",fin:"30/06",produits:["Sérum Vitamine C"]}],flyers:[{mois:"Avr",theme:"Beauté naturelle",marques:["La Rosée","SVR"],statut:"planifié"}],stock:{valeurStock:2400,joursStock:49,tauxRupture:3.2,alertes:["Sérum Vitamine C : stock bas"]},merchandising:{totalEtageres:3,etageres:[{etagere:1,produits:["Sérum Vitamine C","Gel Nettoyant"]},{etagere:2,produits:["Crème Hydratante","Eau Micellaire"]},{etagere:3,produits:["Coffrets","Promotions"]}],facing:"Min 2 facings/référence",rotation:"Bonne (>8 rotations/an)",tips:["Nouveautés à hauteur des yeux","Best-sellers en tête de gondole"]}},
  "Pileje":{tva:"5.5",ca:58057,marge:22610,ca_n1:67508,marge_n1:26270,qte:4820,tx:38.9,evol:-14.0,status:"warning",color:"#3b82f6",info:"1ère marque parapharmacie en CA et marge absolue. Recul post-reprise à surveiller.",objectifTx:40,notes:["Recul de -14% à analyser","Conditions commerciales à renégocier"],actions:["Analyser le recul : prix ou trafic?","Renégocier conditions sur best-sellers","Organiser formation avec délégué Pileje"],monthly:[{m:"Fév",ca:5200,marge:2023},{m:"Mar",ca:5800,marge:2256},{m:"Avr",ca:5100,marge:1984},{m:"Mai",ca:4800,marge:1867},{m:"Juin",ca:4600,marge:1789},{m:"Juil",ca:4200,marge:1634},{m:"Aoû",ca:4100,marge:1595},{m:"Sep",ca:4500,marge:1751},{m:"Oct",ca:4800,marge:1867},{m:"Nov",ca:5200,marge:2023},{m:"Déc",ca:5600,marge:2178},{m:"Jan",ca:4157,marge:1617}],products:[{name:"Lactibiane Référence",pvmp:38.90,prmp:23.50,pvTTC:38.90,qte:580,marge:15.40,tx:39.6,stock:42},{name:"L-Méthylfolate",pvmp:29.90,prmp:18.20,pvTTC:29.90,qte:342,marge:11.70,tx:39.1,stock:28},{name:"Omega 3 Pileje",pvmp:32.50,prmp:19.80,pvTTC:32.50,qte:289,marge:12.70,tx:39.1,stock:35},{name:"Chronobiane",pvmp:19.90,prmp:11.90,pvTTC:19.90,qte:445,marge:8.00,tx:40.2,stock:51}],competitors:[{name:"Nutergia",ca:9579,marge:4106,tx:42.9,notes:"En recul -24%"},{name:"Therascience",ca:12394,marge:4569,tx:36.9,notes:"En croissance +37%"}],rfa:{tauxNegocié:12.0,tauxAtteint:10.8,montantEstimé:6267,echeance:"Déc 2025",notes:"Attention : recul du CA risque de baisser le palier RFA"},promos:[{nom:"Rentrée santé",remise:"15% + PLV",fin:"30/09",produits:["Lactibiane","Chronobiane"]}],flyers:[{mois:"Sep",theme:"Rentrée & immunité",marques:["Pileje","Nutergia"],statut:"planifié"}],stock:{valeurStock:8400,joursStock:53,tauxRupture:2.1,alertes:[]},merchandising:{totalEtageres:4,etageres:[{etagere:1,produits:["Lactibiane Référence","Lactibiane Tolerance"]},{etagere:2,produits:["L-Méthylfolate","Omega 3"]},{etagere:3,produits:["Gamme Gynéco","Gamme Sport"]},{etagere:4,produits:["Chronobiane","Stress Pileje"]}],facing:"3 facings minimum Lactibiane",rotation:"Bonne (>10 rotations/an)",tips:["Lactibiane toujours en tête de rayon","Espace conseil micronutrition"]}},
  "SVR":{tva:"20",ca:12349,marge:4770,ca_n1:5825,marge_n1:2248,qte:798,tx:38.6,evol:112.0,status:"boom",color:"#10b981",info:"Croissance exceptionnelle +112%. Dermo-cosmétique accessible à fort taux de marque.",objectifTx:38,notes:["Croissance remarquable","Gamme à développer en priorité"],actions:["Augmenter le facing","Commander les nouvelles références","Créer mise en avant vitrine"],monthly:[{m:"Fév",ca:620,marge:239},{m:"Mar",ca:780,marge:301},{m:"Avr",ca:920,marge:355},{m:"Mai",ca:1150,marge:444},{m:"Juin",ca:1280,marge:494},{m:"Juil",ca:1380,marge:533},{m:"Aoû",ca:1210,marge:467},{m:"Sep",ca:1050,marge:405},{m:"Oct",ca:980,marge:378},{m:"Nov",ca:1100,marge:425},{m:"Déc",ca:1280,marge:494},{m:"Jan",ca:599,marge:231}],products:[{name:"Clairial SPF50",pvmp:22.90,prmp:14.10,pvTTC:22.90,qte:180,marge:8.80,tx:38.4,stock:22},{name:"Cicavit+ Crème",pvmp:18.50,prmp:11.40,pvTTC:18.50,qte:156,marge:7.10,tx:38.4,stock:15},{name:"B3 Sérum",pvmp:24.90,prmp:15.30,pvTTC:24.90,qte:98,marge:9.60,tx:38.6,stock:12},{name:"Topialyse Baume",pvmp:16.90,prmp:10.40,pvTTC:16.90,qte:364,marge:6.50,tx:38.5,stock:28}],competitors:[{name:"CeraVe",ca:3916,marge:1308,tx:33.4,notes:"En forte croissance aussi"},{name:"La Roche Posay",ca:15288,marge:5385,tx:35.2,notes:"Leader dermo"}],rfa:{tauxNegocié:9.0,tauxAtteint:9.0,montantEstimé:1111,echeance:"Déc 2025",notes:"Objectif atteint"},promos:[],flyers:[{mois:"Mai",theme:"Solaires & protection",marques:["SVR","Avène"],statut:"confirmé"}],stock:{valeurStock:1800,joursStock:53,tauxRupture:4.1,alertes:["B3 Sérum : commander 20 unités"]},merchandising:{totalEtageres:3,etageres:[{etagere:1,produits:["Clairial SPF50","B3 Sérum"]},{etagere:2,produits:["Cicavit+","Psoriasis"]},{etagere:3,produits:["Topialyse Baume","Eau Thermale"]}],facing:"2 facings par référence",rotation:"Excellente (>12 rotations/an)",tips:["Clairial SPF en tête avril-sept","Cross-sell avec Avène thermale"]}},
  "Avène":{tva:"20",ca:28450,marge:10010,ca_n1:26800,marge_n1:9580,qte:2140,tx:35.2,evol:6.2,status:"good",color:"#06b6d4",info:"Référence dermo-cosmétique. Eau thermale apaisante. Très bonne rotation gamme bébé et peau sensible.",objectifTx:36,notes:["Leader en CA dermo","Bonne dynamique +6.2%"],actions:["Renforcer gamme solaires au printemps","Proposer coffret hivernal Xeracalm","Mettre en avant la gamme bébé"],monthly:[{m:"Fév",ca:1980,marge:697},{m:"Mar",ca:2340,marge:824},{m:"Avr",ca:2980,marge:1049},{m:"Mai",ca:3450,marge:1214},{m:"Juin",ca:3200,marge:1126},{m:"Juil",ca:2800,marge:986},{m:"Aoû",ca:2200,marge:774},{m:"Sep",ca:2100,marge:739},{m:"Oct",ca:2280,marge:803},{m:"Nov",ca:2450,marge:862},{m:"Déc",ca:2980,marge:1049},{m:"Jan",ca:1690,marge:595}],products:[{name:"Solaire SPF50+ Visage",pvmp:19.90,prmp:12.50,pvTTC:19.90,qte:480,marge:7.40,tx:37.2,stock:45},{name:"Eau Thermale spray 150",pvmp:8.90,prmp:5.60,pvTTC:8.90,qte:620,marge:3.30,tx:37.1,stock:82},{name:"Xeracalm Baume",pvmp:22.50,prmp:14.20,pvTTC:22.50,qte:312,marge:8.30,tx:36.9,stock:38},{name:"Tolérance hydratant",pvmp:17.90,prmp:11.20,pvTTC:17.90,qte:728,marge:6.70,tx:37.4,stock:62}],competitors:[{name:"La Roche-Posay",ca:15288,marge:5385,tx:35.2,notes:"Concurrent direct"},{name:"Bioderma",ca:5122,marge:1472,tx:28.8,notes:"En recul -42%"}],rfa:{tauxNegocié:10.5,tauxAtteint:10.5,montantEstimé:2987,echeance:"Déc 2025",notes:"Palier atteint"},promos:[{nom:"Solaires été",remise:"Offre 3+1",fin:"31/08",produits:["SPF50+","SPF30"]}],flyers:[{mois:"Avr",theme:"Solaires printemps",marques:["Avène","SVR"],statut:"confirmé"}],stock:{valeurStock:4200,joursStock:54,tauxRupture:1.8,alertes:[]},merchandising:{totalEtageres:5,etageres:[{etagere:1,produits:["Solaires visage","Solaires corps"]},{etagere:2,produits:["Eau thermale","Hydratants"]},{etagere:3,produits:["Xeracalm","Peau atopique"]},{etagere:4,produits:["Gamme Bébé","Cicalfate"]},{etagere:5,produits:["Trixéra","A-Oxitive"]}],facing:"Min 3 facings eau thermale",rotation:"Très bonne (>11 rotations/an)",tips:["Eau thermale en caisse pour achat impulsif","Solaires : sortir dès mars"]}},
  "CeraVe":{tva:"20",ca:3916,marge:1308,ca_n1:2277,marge_n1:760,qte:312,tx:33.4,evol:72.0,status:"boom",color:"#8b5cf6",info:"Croissance +72%. Plébiscitée sur les réseaux. Recommandations dermatologiques fréquentes.",objectifTx:35,notes:["Tendance forte","Profil CSP+ millennial/GenZ"],actions:["Augmenter les commandes","Commander nouvelles références Retinol","Espace dédié CeraVe/SVR/La Rosée"],monthly:[{m:"Fév",ca:180,marge:60},{m:"Mar",ca:220,marge:73},{m:"Avr",ca:280,marge:94},{m:"Mai",ca:350,marge:117},{m:"Juin",ca:420,marge:140},{m:"Juil",ca:480,marge:160},{m:"Aoû",ca:390,marge:130},{m:"Sep",ca:340,marge:114},{m:"Oct",ca:380,marge:127},{m:"Nov",ca:420,marge:140},{m:"Déc",ca:356,marge:119},{m:"Jan",ca:100,marge:33}],products:[{name:"Hydratant visage SPF25",pvmp:16.90,prmp:11.20,pvTTC:16.90,qte:98,marge:5.70,tx:33.7,stock:18},{name:"Lotion Hydratante corps",pvmp:12.50,prmp:8.30,pvTTC:12.50,qte:142,marge:4.20,tx:33.6,stock:22},{name:"Gel nettoyant moussant",pvmp:11.90,prmp:7.90,pvTTC:11.90,qte:72,marge:4.00,tx:33.6,stock:14}],competitors:[{name:"SVR",ca:12349,marge:4770,tx:38.6,notes:"Taux plus élevé"},{name:"Bioderma",ca:5122,marge:1472,tx:28.8,notes:"En fort recul"}],rfa:{tauxNegocié:7.0,tauxAtteint:7.0,montantEstimé:274,echeance:"Déc 2025",notes:"Augmenter commandes pour améliorer palier"},promos:[],flyers:[],stock:{valeurStock:620,joursStock:58,tauxRupture:5.0,alertes:["Stock faible — augmenter les commandes"]},merchandising:{totalEtageres:2,etageres:[{etagere:1,produits:["Hydratants visage","SPF"]},{etagere:2,produits:["Corps","Nettoyants"]}],facing:"2 facings par référence",rotation:"Excellente",tips:["Co-présenter avec SVR et La Rosée","Étiquette 'Recommandé dermatologues'"]}},
  "La Roche Posay":{tva:"20",ca:15288,marge:5385,ca_n1:9993,marge_n1:3519,qte:1120,tx:35.2,evol:53.0,status:"boom",color:"#0ea5e9",info:"Croissance forte +53%. 1ère gamme dermo par potentiel. Recommandations dermatologiques nombreuses.",objectifTx:36,notes:["Croissance exceptionnelle","Potentiel important à développer"],actions:["Développer gamme Cicaplast","Renforcer les solaires","Proposer conseil dermatologique"],monthly:[{m:"Fév",ca:980,marge:345},{m:"Mar",ca:1120,marge:394},{m:"Avr",ca:1450,marge:510},{m:"Mai",ca:1780,marge:627},{m:"Juin",ca:1620,marge:570},{m:"Juil",ca:1380,marge:486},{m:"Aoû",ca:1100,marge:387},{m:"Sep",ca:1050,marge:370},{m:"Oct",ca:1120,marge:394},{m:"Nov",ca:1280,marge:451},{m:"Déc",ca:1408,marge:496},{m:"Jan",ca:1000,marge:352}],products:[{name:"Anthelios SPF50+",pvmp:21.90,prmp:14.20,pvTTC:21.90,qte:340,marge:7.70,tx:35.2,stock:38},{name:"Cicaplast Baume B5",pvmp:14.50,prmp:9.40,pvTTC:14.50,qte:289,marge:5.10,tx:35.2,stock:34},{name:"Effaclar Duo+",pvmp:19.90,prmp:12.90,pvTTC:19.90,qte:198,marge:7.00,tx:35.2,stock:22},{name:"Lipikar Baume AP+",pvmp:17.50,prmp:11.30,pvTTC:17.50,qte:293,marge:6.20,tx:35.4,stock:45}],competitors:[{name:"Avène",ca:28450,marge:10010,tx:35.2,notes:"Leader, taux identique"},{name:"SVR",ca:12349,marge:4770,tx:38.6,notes:"Taux meilleur, volume moindre"}],rfa:{tauxNegocié:11.0,tauxAtteint:10.2,montantEstimé:1559,echeance:"Déc 2025",notes:"Légèrement sous objectif — pousser Cicaplast"},promos:[{nom:"Été solaires",remise:"Offre 2+1",fin:"31/08",produits:["Anthelios"]}],flyers:[{mois:"Mai",theme:"Protection solaire",marques:["La Roche Posay","SVR"],statut:"planifié"}],stock:{valeurStock:2800,joursStock:67,tauxRupture:2.3,alertes:[]},merchandising:{totalEtageres:4,etageres:[{etagere:1,produits:["Anthelios SPF50+","Anthelios teintés"]},{etagere:2,produits:["Cicaplast","Lipikar"]},{etagere:3,produits:["Effaclar","Acné"]},{etagere:4,produits:["Toleriane","Riche"]}],facing:"3 facings Anthelios en saison",rotation:"Très bonne",tips:["Anthelios en présentoir caisse mars-août","Coin conseil recommandations dermo"]}},
  "Nuxe":{tva:"20",ca:12338,marge:3898,ca_n1:15423,marge_n1:4874,qte:920,tx:31.6,evol:-20.0,status:"warning",color:"#d4a853",info:"Recul de -20%. Pression concurrentielle de La Rosée et SVR. Taux de marque inférieur à la moyenne dermo.",objectifTx:35,notes:["Recul à investiguer","Conditions commerciales à revoir"],actions:["Analyser les raisons du recul","Vérifier conditions avec délégué","Mise en avant ciblée Huile Prodigieuse"],monthly:[{m:"Fév",ca:1180,marge:373},{m:"Mar",ca:1320,marge:417},{m:"Avr",ca:1150,marge:363},{m:"Mai",ca:1080,marge:341},{m:"Juin",ca:980,marge:310},{m:"Juil",ca:880,marge:278},{m:"Aoû",ca:780,marge:247},{m:"Sep",ca:920,marge:291},{m:"Oct",ca:1050,marge:332},{m:"Nov",ca:1180,marge:373},{m:"Déc",ca:1420,marge:449},{m:"Jan",ca:398,marge:126}],products:[{name:"Huile Prodigieuse 100ml",pvmp:29.90,prmp:20.40,pvTTC:29.90,qte:245,marge:9.50,tx:31.8,stock:28},{name:"Rêve de Miel Lèvres",pvmp:9.90,prmp:6.70,pvTTC:9.90,qte:312,marge:3.20,tx:32.3,stock:45},{name:"Insta-Masque",pvmp:18.90,prmp:13.00,pvTTC:18.90,qte:178,marge:5.90,tx:31.2,stock:18},{name:"Le Lait Corps",pvmp:14.50,prmp:9.90,pvTTC:14.50,qte:185,marge:4.60,tx:31.7,stock:24}],competitors:[{name:"La Rosée",ca:17834,marge:6841,tx:38.4,notes:"En forte progression"},{name:"Caudalie",ca:14224,marge:5065,tx:35.6,notes:"Même positionnement, meilleure marge"}],rfa:{tauxNegocié:8.0,tauxAtteint:6.5,montantEstimé:802,echeance:"Déc 2025",notes:"Recul du CA impacte la RFA"},promos:[],flyers:[],stock:{valeurStock:2200,joursStock:65,tauxRupture:1.5,alertes:["Stock excédentaire possible — surveiller DLC"]},merchandising:{totalEtageres:3,etageres:[{etagere:1,produits:["Huile Prodigieuse","Sérum"]},{etagere:2,produits:["Rêve de Miel","Corps"]},{etagere:3,produits:["Crèmes visage","Masques"]}],facing:"2 facings Huile Prodigieuse",rotation:"Moyenne",tips:["Réduire références si recul continue","Concentrer sur best-sellers"]}},
  "Caudalie":{tva:"20",ca:14224,marge:5065,ca_n1:16734,marge_n1:5957,qte:1045,tx:35.6,evol:-15.0,status:"warning",color:"#7c3aed",info:"Marque premium vin & beauté. Clientèle fidèle CSP+. Recul -15% post-reprise.",objectifTx:37,notes:["Recul post-reprise à surveiller","Clientèle très fidèle à conserver"],actions:["Maintenir visibilité en vitrine","Proposer coffrets cadeaux en décembre","Vérifier ruptures Vinosource"],monthly:[{m:"Fév",ca:1350,marge:481},{m:"Mar",ca:1420,marge:506},{m:"Avr",ca:1280,marge:456},{m:"Mai",ca:1180,marge:420},{m:"Juin",ca:1090,marge:388},{m:"Juil",ca:980,marge:349},{m:"Aoû",ca:890,marge:317},{m:"Sep",ca:1050,marge:374},{m:"Oct",ca:1120,marge:399},{m:"Nov",ca:1380,marge:492},{m:"Déc",ca:1986,marge:707},{m:"Jan",ca:498,marge:177}],products:[{name:"Vinosource S.O.S Sérum",pvmp:45.00,prmp:29.20,pvTTC:45.00,qte:198,marge:15.80,tx:35.1,stock:22},{name:"Eau Beauté",pvmp:24.50,prmp:15.80,pvTTC:24.50,qte:312,marge:8.70,tx:35.5,stock:38},{name:"Crème Corps Vendanges",pvmp:28.00,prmp:18.00,pvTTC:28.00,qte:245,marge:10.00,tx:35.7,stock:28},{name:"Polyphénol C15",pvmp:56.00,prmp:36.00,pvTTC:56.00,qte:290,marge:20.00,tx:35.7,stock:18}],competitors:[{name:"La Rosée",ca:17834,marge:6841,tx:38.4,notes:"Positionnement naturel concurrent"},{name:"Nuxe",ca:12338,marge:3898,tx:31.6,notes:"Concurrent en recul aussi"}],rfa:{tauxNegocié:9.5,tauxAtteint:8.0,montantEstimé:1138,echeance:"Déc 2025",notes:"Sous objectif suite au recul"},promos:[{nom:"Coffrets Noël",remise:"Kit démo offert",fin:"31/12",produits:["Vinosource","Polyphénol"]}],flyers:[{mois:"Déc",theme:"Coffrets Noël premium",marques:["Caudalie","Nuxe"],statut:"planifié"}],stock:{valeurStock:3100,joursStock:80,tauxRupture:1.2,alertes:["Stock élevé Corps — envisager promotion"]},merchandising:{totalEtageres:3,etageres:[{etagere:1,produits:["Vinosource S.O.S","Polyphénol C15"]},{etagere:2,produits:["Eau Beauté","Micellar"]},{etagere:3,produits:["Corps","Coffrets"]}],facing:"2 facings best-sellers",rotation:"Moyenne",tips:["Coffrets Noël : commander en octobre","Espace cadeaux premium distinct"]}},
  "Nutergia":{tva:"5.5",ca:9579,marge:4106,ca_n1:12604,marge_n1:5407,qte:742,tx:42.9,evol:-24.0,status:"warning",color:"#059669",info:"Taux de marque excellent (42,9%) mais recul de -24% à investiguer. Concurrent direct de Pileje.",objectifTx:43,notes:["Meilleur taux de marque de la catégorie","Recul inquiétant -24%"],actions:["Analyser recul vs Therascience","Vérifier référencement","Renforcer conseils ERGYVIT et ERGYBASE"],monthly:[{m:"Fév",ca:980,marge:420},{m:"Mar",ca:1050,marge:451},{m:"Avr",ca:920,marge:395},{m:"Mai",ca:820,marge:352},{m:"Juin",ca:750,marge:322},{m:"Juil",ca:680,marge:292},{m:"Aoû",ca:620,marge:266},{m:"Sep",ca:750,marge:322},{m:"Oct",ca:820,marge:352},{m:"Nov",ca:890,marge:382},{m:"Déc",ca:980,marge:420},{m:"Jan",ca:319,marge:137}],products:[{name:"ERGYVIT",pvmp:32.50,prmp:18.60,pvTTC:32.50,qte:180,marge:13.90,tx:42.8,stock:24},{name:"ERGYBASE",pvmp:28.90,prmp:16.50,pvTTC:28.90,qte:156,marge:12.40,tx:42.9,stock:18},{name:"ERGYPHILUS Confort",pvmp:35.00,prmp:20.00,pvTTC:35.00,qte:198,marge:15.00,tx:42.9,stock:21},{name:"ERGYOMEGA 3",pvmp:38.00,prmp:21.70,pvTTC:38.00,qte:208,marge:16.30,tx:42.9,stock:19}],competitors:[{name:"Therascience",ca:12394,marge:4569,tx:36.9,notes:"En croissance +37%"},{name:"Pileje",ca:58057,marge:22610,tx:38.9,notes:"Leader de la catégorie"}],rfa:{tauxNegocié:10.0,tauxAtteint:7.6,montantEstimé:728,echeance:"Déc 2025",notes:"Recul fort — risque de perdre palier"},promos:[],flyers:[],stock:{valeurStock:1650,joursStock:63,tauxRupture:2.8,alertes:[]},merchandising:{totalEtageres:3,etageres:[{etagere:1,produits:["ERGYVIT","ERGYBASE"]},{etagere:2,produits:["ERGYPHILUS","ERGYOMEGA"]},{etagere:3,produits:["Sport","Autres"]}],facing:"2 facings par référence",rotation:"Moyenne en baisse",tips:["Vérifier la connaissance produit","Comparer avec argumentaire Therascience"]}},
  "Therascience":{tva:"5.5",ca:12394,marge:4569,ca_n1:9046,marge_n1:3338,qte:920,tx:36.9,evol:37.0,status:"good",color:"#16a34a",info:"Croissance +37%. Compléments alimentaires expert. Profil santé/sportif cohérent avec la clientèle.",objectifTx:38,notes:["Bonne dynamique","À développer face au recul Nutergia"],actions:["Développer le rayon Therascience","Former l'équipe aux nouvelles gammes","Capitaliser sur la gamme sport"],monthly:[{m:"Fév",ca:850,marge:313},{m:"Mar",ca:950,marge:350},{m:"Avr",ca:1020,marge:376},{m:"Mai",ca:1150,marge:424},{m:"Juin",ca:1180,marge:435},{m:"Juil",ca:1220,marge:450},{m:"Aoû",ca:1080,marge:398},{m:"Sep",ca:1020,marge:376},{m:"Oct",ca:980,marge:361},{m:"Nov",ca:1050,marge:387},{m:"Déc",ca:894,marge:330},{m:"Jan",ca:0,marge:0}],products:[{name:"Physiomance Cardio",pvmp:38.00,prmp:24.00,pvTTC:38.00,qte:180,marge:14.00,tx:36.8,stock:22},{name:"Physiomance Ergy C",pvmp:29.50,prmp:18.60,pvTTC:29.50,qte:245,marge:10.90,tx:36.9,stock:28},{name:"Physiomance Sport",pvmp:42.00,prmp:26.50,pvTTC:42.00,qte:178,marge:15.50,tx:36.9,stock:18},{name:"Physiomance Silicium",pvmp:32.00,prmp:20.20,pvTTC:32.00,qte:317,marge:11.80,tx:36.9,stock:35}],competitors:[{name:"Nutergia",ca:9579,marge:4106,tx:42.9,notes:"Taux plus élevé mais en recul"},{name:"Pileje",ca:58057,marge:22610,tx:38.9,notes:"Leader segment"}],rfa:{tauxNegocié:9.0,tauxAtteint:9.0,montantEstimé:1115,echeance:"Déc 2025",notes:"Objectif atteint"},promos:[],flyers:[{mois:"Jan",theme:"Bonnes résolutions santé",marques:["Therascience","Pileje"],statut:"planifié"}],stock:{valeurStock:2100,joursStock:62,tauxRupture:2.0,alertes:[]},merchandising:{totalEtageres:3,etageres:[{etagere:1,produits:["Cardio","Cholestérol"]},{etagere:2,produits:["Sport","Récupération"]},{etagere:3,produits:["Digestion","Immunité"]}],facing:"2 facings Cardio et Sport",rotation:"Bonne",tips:["Espace conseil sport/vitalité","Complémentaire avec Pileje seniors"]}},
  "Cooper":{tva:"10",ca:22450,marge:7430,ca_n1:21890,marge_n1:7243,qte:3210,tx:33.1,evol:2.6,status:"stable",color:"#6366f1",info:"Gamme OTC généraliste très large. Bonne rotation. Produits conseil du quotidien.",objectifTx:35,notes:["Volume important","Rotation rapide"],actions:["Optimiser facing par famille","Profiter promotions saisonnières","Développer gamme vétérinaire"],monthly:[{m:"Fév",ca:1850,marge:612},{m:"Mar",ca:1980,marge:655},{m:"Avr",ca:1920,marge:635},{m:"Mai",ca:1890,marge:625},{m:"Juin",ca:1850,marge:612},{m:"Juil",ca:1780,marge:589},{m:"Aoû",ca:1820,marge:602},{m:"Sep",ca:1890,marge:625},{m:"Oct",ca:1950,marge:645},{m:"Nov",ca:2050,marge:678},{m:"Déc",ca:2120,marge:702},{m:"Jan",ca:1350,marge:447}],products:[{name:"Paracétamol 1000mg",pvmp:2.50,prmp:1.65,pvTTC:2.50,qte:1240,marge:0.85,tx:34.0,stock:380},{name:"Ibuprofène 400mg",pvmp:3.20,prmp:2.10,pvTTC:3.20,qte:820,marge:1.10,tx:34.4,stock:245},{name:"Povidone Iodée",pvmp:4.90,prmp:3.20,pvTTC:4.90,qte:580,marge:1.70,tx:34.7,stock:120},{name:"Pansements assortis",pvmp:5.90,prmp:3.90,pvTTC:5.90,qte:570,marge:2.00,tx:33.9,stock:85}],competitors:[{name:"Biogaran",ca:244269,marge:101308,tx:41.5,notes:"Leader génériques"},{name:"Sanofi",ca:98450,marge:28900,tx:29.4,notes:"OTC national fort"}],rfa:{tauxNegocié:6.0,tauxAtteint:6.0,montantEstimé:1347,echeance:"Déc 2025",notes:"Volume important — vérifier paliers fin d'année"},promos:[{nom:"Hiver",remise:"20% antitussifs",fin:"28/02",produits:["Toux","Rhume"]}],flyers:[{mois:"Nov",theme:"Hiver santé",marques:["Cooper","Sanofi"],statut:"planifié"}],stock:{valeurStock:3800,joursStock:62,tauxRupture:1.5,alertes:[]},merchandising:{totalEtageres:4,etageres:[{etagere:1,produits:["Antidouleur","Anti-inflammatoires"]},{etagere:2,produits:["Antiseptiques","Pansements"]},{etagere:3,produits:["Digestion","Toux/Rhume"]},{etagere:4,produits:["Vétérinaire","Divers"]}],facing:"Min 5 facings paracétamol",rotation:"Excellente (>15 rotations/an)",tips:["Optimiser selon saisonnalité","Hiver : pousser antitussifs"]}},
  "BIOGARAN":{tva:"2.1",ca:244269,marge:101308,ca_n1:257210,marge_n1:106190,qte:38842,tx:41.5,evol:-5.0,status:"stable",color:"#1a56db",info:"N°1 des génériques — pilier de la pharmacie. 101K€ de marge. Taux de substitution 91,19%.",objectifTx:42,notes:["Taux de substitution à maintenir >91%","Surveiller négociation RFA 15%"],actions:["Maintenir substitution >91%","Négocier meilleures conditions","Former l'équipe à proposer systématiquement le générique"],monthly:[{m:"Fév",ca:21500,marge:8922},{m:"Mar",ca:22800,marge:9462},{m:"Avr",ca:20900,marge:8673},{m:"Mai",ca:20500,marge:8508},{m:"Juin",ca:19800,marge:8217},{m:"Juil",ca:18900,marge:7843},{m:"Aoû",ca:18200,marge:7553},{m:"Sep",ca:20100,marge:8342},{m:"Oct",ca:21500,marge:8922},{m:"Nov",ca:22100,marge:9171},{m:"Déc",ca:20100,marge:8342},{m:"Jan",ca:17869,marge:7414}],products:[{name:"Amoxicilline 1g",pvmp:3.20,prmp:1.88,pvTTC:3.20,qte:4850,marge:1.32,tx:41.3,stock:580},{name:"Metformine 850mg",pvmp:2.80,prmp:1.65,pvTTC:2.80,qte:5210,marge:1.15,tx:41.1,stock:620},{name:"Oméprazole 20mg",pvmp:2.50,prmp:1.47,pvTTC:2.50,qte:6780,marge:1.03,tx:41.2,stock:790},{name:"Atorvastatine 20mg",pvmp:3.40,prmp:2.00,pvTTC:3.40,qte:5890,marge:1.40,tx:41.2,stock:685}],competitors:[{name:"Zentiva",ca:15230,marge:5230,tx:34.3,notes:"N°2 loin derrière"},{name:"Sandoz",ca:3227,marge:932,tx:28.9,notes:"En recul fort -75%"}],rfa:{tauxNegocié:15.0,tauxAtteint:14.2,montantEstimé:34686,echeance:"Déc 2025",notes:"Enjeu majeur : chaque point = +2444€"},promos:[],flyers:[],stock:{valeurStock:48000,joursStock:72,tauxRupture:0.8,alertes:[]},merchandising:{totalEtageres:6,etageres:[{etagere:1,produits:["Antibiotiques","Amoxicilline"]},{etagere:2,produits:["Antidiabétiques","Metformine"]},{etagere:3,produits:["Cardio","Statines"]},{etagere:4,produits:["Digestif","IPP"]},{etagere:5,produits:["Antihypertenseurs","Diurétiques"]},{etagere:6,produits:["Autres génériques"]}],facing:"Organisation par DCI",rotation:"Excellente",tips:["Organisation DCI pour substitution","Former l'équipe à l'interchangeabilité"]}}
};

const LD: Record<string,LabData> = {
  "BIOGARAN":{tva:"2.1",ca:244269,marge:101308,ca_n1:257210,marge_n1:106190,qte:38842,tx:41.5,evol:-5.0,status:"stable",color:"#1a56db",segment:"génériques",info:"N°1 des génériques. Pilier de la pharmacie avec 101K€ de marge.",objectifTx:42,notes:["Taux de substitution à maintenir >91%","Négocier palier RFA 15%"],actions:["Maintenir substitution >91%","Optimiser conditions d'achat"],monthly:[{m:"Fév",ca:21500,marge:8922},{m:"Mar",ca:22800,marge:9462},{m:"Avr",ca:20900,marge:8673},{m:"Mai",ca:20500,marge:8508},{m:"Juin",ca:19800,marge:8217},{m:"Juil",ca:18900,marge:7843},{m:"Aoû",ca:18200,marge:7553},{m:"Sep",ca:20100,marge:8342},{m:"Oct",ca:21500,marge:8922},{m:"Nov",ca:22100,marge:9171},{m:"Déc",ca:20100,marge:8342},{m:"Jan",ca:17869,marge:7414}],topProduits:["Oméprazole","Metformine","Amoxicilline","Atorvastatine","Sertraline"]},
  "PIERRE FABRE":{tva:"20",ca:68420,marge:24020,ca_n1:62800,marge_n1:22050,qte:4820,tx:35.1,evol:8.9,status:"good",color:"#10b981",segment:"dermo",info:"Groupe incluant Avène, Ducray, René Furterer. Bonne dynamique globale.",objectifTx:36,notes:["Croissance régulière","Synergies entre marques à exploiter"],actions:["Optimiser cross-selling marques PF","Développer gamme solaires Avène"],monthly:[{m:"Fév",ca:5200,marge:1825},{m:"Mar",ca:5800,marge:2036},{m:"Avr",ca:6200,marge:2176},{m:"Mai",ca:6500,marge:2282},{m:"Juin",ca:6300,marge:2211},{m:"Juil",ca:5800,marge:2036},{m:"Aoû",ca:5400,marge:1895},{m:"Sep",ca:5600,marge:1966},{m:"Oct",ca:5800,marge:2036},{m:"Nov",ca:6000,marge:2106},{m:"Déc",ca:6120,marge:2148},{m:"Jan",ca:3700,marge:1299}],topProduits:["Avène Eau Thermale","Ducray Shampoings","René Furterer Forticea","A-Derma Exomega"]},
  "SANOFI":{tva:"mix",ca:98450,marge:28900,ca_n1:102340,marge_n1:30120,qte:8920,tx:29.4,evol:-3.8,status:"stable",color:"#f59e0b",segment:"OTC",info:"Géant pharmaceutique. OTC fort (Doliprane, Smecta, Maalox).",objectifTx:31,notes:["Volume important","Promotions saisonnières régulières"],actions:["Optimiser commandes groupées","Profiter promos hivernales antitussifs"],monthly:[{m:"Fév",ca:8200,marge:2411},{m:"Mar",ca:8800,marge:2587},{m:"Avr",ca:8100,marge:2381},{m:"Mai",ca:7900,marge:2322},{m:"Juin",ca:7800,marge:2293},{m:"Juil",ca:7600,marge:2235},{m:"Aoû",ca:7800,marge:2293},{m:"Sep",ca:8200,marge:2411},{m:"Oct",ca:8600,marge:2528},{m:"Nov",ca:9200,marge:2705},{m:"Déc",ca:9450,marge:2778},{m:"Jan",ca:6800,marge:1999}],topProduits:["Doliprane 1000","Smecta","Maalox","Rhinadvil","Mucosolvan"]},
  "COOPER":{tva:"10",ca:22450,marge:7430,ca_n1:21890,marge_n1:7243,qte:3210,tx:33.1,evol:2.6,status:"stable",color:"#6366f1",segment:"OTC",info:"Gamme OTC généraliste. Bonne rotation sur produits du quotidien.",objectifTx:35,notes:["Volume stable","Bonne rotation"],actions:["Optimiser espace selon saisonnalité"],monthly:[{m:"Fév",ca:1850,marge:612},{m:"Mar",ca:1980,marge:655},{m:"Avr",ca:1920,marge:635},{m:"Mai",ca:1890,marge:625},{m:"Juin",ca:1850,marge:612},{m:"Juil",ca:1780,marge:589},{m:"Aoû",ca:1820,marge:602},{m:"Sep",ca:1890,marge:625},{m:"Oct",ca:1950,marge:645},{m:"Nov",ca:2050,marge:678},{m:"Déc",ca:2120,marge:702},{m:"Jan",ca:1350,marge:447}],topProduits:["Paracétamol Cooper","Ibuprofène Cooper","Antiseptiques","Pansements"]},
  "PILEJE":{tva:"5.5",ca:58057,marge:22610,ca_n1:67508,marge_n1:26270,qte:4820,tx:38.9,evol:-14.0,status:"warning",color:"#3b82f6",segment:"compléments",info:"1er labo parapharmacie. Micronutrition expert. Recul -14% à analyser.",objectifTx:40,notes:["1er en marge absolue parapharmacie","Recul à investiguer"],actions:["Analyser le recul CA","Renégocier conditions","Formation équipe"],monthly:[{m:"Fév",ca:5200,marge:2023},{m:"Mar",ca:5800,marge:2256},{m:"Avr",ca:5100,marge:1984},{m:"Mai",ca:4800,marge:1867},{m:"Juin",ca:4600,marge:1789},{m:"Juil",ca:4200,marge:1634},{m:"Aoû",ca:4100,marge:1595},{m:"Sep",ca:4500,marge:1751},{m:"Oct",ca:4800,marge:1867},{m:"Nov",ca:5200,marge:2023},{m:"Déc",ca:5600,marge:2178},{m:"Jan",ca:4157,marge:1617}],topProduits:["Lactibiane Référence","L-Méthylfolate","Omega 3","Chronobiane"]}
};

const UNIVERS = [
  {id:"solaires",name:"Soins solaires",icon:"☀️",color:"#f59e0b",desc:"SPF visage, corps, enfant, après-soleil",marques:["Avène","SVR","La Roche Posay","CeraVe","La Rosée"],trend:"boom",tips:["Sortir les solaires dès mars","Anthelios/Avène en tête de gondole","Proposer systématiquement l'après-soleil"]},
  {id:"dermo",name:"Dermo-cosmétique",icon:"🧴",color:"#06b6d4",desc:"Soins visage, corps, anti-âge, nettoyants",marques:["Avène","La Roche Posay","SVR","CeraVe","Nuxe","Caudalie","La Rosée"],trend:"up",tips:["Regrouper par profil peau","Cross-sell sérum + crème","Valoriser formules naturelles pour CSP+"]},
  {id:"capillaires",name:"Soins capillaires",icon:"💇",color:"#7c3aed",desc:"Shampoings, soins, traitements cuir chevelu",marques:["Ducray","Klorane","Nuxe"],trend:"stable",tips:["Regrouper par problème","Mettre en avant anti-chute Ducray","Proposer rituels en coffret"]},
  {id:"complements",name:"Compléments alimentaires",icon:"💊",color:"#10b981",desc:"Micronutrition, probiotiques, oméga 3, sport",marques:["Pileje","Nutergia","Therascience"],trend:"up",tips:["Espace conseil micronutrition","Afficher tableau des indications","Complémentarité Pileje / Therascience seniors"]}
];

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const s = STC[status] || STC.stable;
  return <span style={{display:"inline-flex",alignItems:"center",fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,background:s.bg,color:s.text,border:`1px solid ${s.border}`}}>{s.label}</span>;
}

function Card({ children, onClick, style, noPad, className }: any) {
  const C = useContext(ThemeCtx);
  return <div onClick={onClick} className={className||""} style={{background:C.card,borderRadius:14,border:`1px solid ${C.border}`,boxShadow:`0 2px 8px ${C.shadow}`,padding:noPad?0:16,cursor:onClick?"pointer":"default",overflow:"hidden",...(style||{})}}>{children}</div>;
}

function SecTitle({ children, color }: { children: React.ReactNode; color?: string }) {
  const C = useContext(ThemeCtx);
  return <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
    <div style={{width:4,height:20,borderRadius:2,background:color||"#1a56db",flexShrink:0}}/>
    <span style={{fontSize:14,fontWeight:700,color:C.text,letterSpacing:0.3}}>{children}</span>
  </div>;
}

function KPI({ label, value, sub, color, alert }: any) {
  const C = useContext(ThemeCtx);
  return <div style={{background:C.card,borderRadius:12,border:`1px solid ${alert?"#fca5a5":C.border}`,padding:"12px 14px",boxShadow:`0 1px 4px ${C.shadow}`}}>
    <div style={{fontSize:10,color:C.neutral,fontWeight:500,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div>
    <div style={{fontSize:18,fontWeight:700,color:alert?"#dc2626":(color||"#1a56db"),lineHeight:1.1}}>{value}</div>
    {sub && <div style={{fontSize:11,color:C.neutral,marginTop:3}}>{sub}</div>}
  </div>;
}

function AlertBox({ children, type, title }: any) {
  const cfg: any = {
    info:{bg:"#eff6ff",border:"#93c5fd",text:"#1e40af",icon:"ℹ️"},
    warning:{bg:"#fffbeb",border:"#fcd34d",text:"#92400e",icon:"⚠️"},
    danger:{bg:"#fef2f2",border:"#fca5a5",text:"#991b1b",icon:"🔴"},
    success:{bg:"#f0fdf4",border:"#86efac",text:"#166534",icon:"✅"}
  }[type] || {bg:"#f1f5f9",border:"#cbd5e1",text:"#475569",icon:"ℹ️"};
  return <div style={{background:cfg.bg,border:`1px solid ${cfg.border}`,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
    {title && <div style={{fontWeight:700,color:cfg.text,fontSize:13,marginBottom:4}}>{cfg.icon} {title}</div>}
    <div style={{fontSize:12,color:cfg.text}}>{children}</div>
  </div>;
}

// ─── SVG CHARTS ──────────────────────────────────────────────────────────────
function LineChart({ data, color, height = 100 }: { data: Monthly[]; color?: string; height?: number }) {
  const C = useContext(ThemeCtx);
  if (!data?.length) return null;
  const col = color || "#1a56db";
  const vals = data.map(d => d.ca || 0);
  const mx = Math.max(...vals, 1);
  const mn = Math.min(...vals, 0);
  const rng = mx - mn || 1;
  const w = 280;
  const pts = vals.map((v, i) => [(i / (vals.length - 1 || 1)) * w, height - ((v - mn) / rng) * (height - 20) - 4] as [number, number]);
  const dPath = pts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(" ");
  const fill = `${dPath} L${w},${height} L0,${height} Z`;
  const gid = `g${col.replace("#", "")}`;
  return <svg viewBox={`0 0 ${w} ${height}`} style={{width:"100%",height,overflow:"visible"}}>
    <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity="0.2"/><stop offset="100%" stopColor={col} stopOpacity="0"/></linearGradient></defs>
    <path d={fill} fill={`url(#${gid})`}/>
    <path d={dPath} fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    {pts.map((pt, i) => <circle key={i} cx={pt[0]} cy={pt[1]} r="3" fill={col} stroke="white" strokeWidth="1.5"/>)}
  </svg>;
}

function HBarChart({ data, color }: { data: {label:string;value:number}[]; color?: string }) {
  const C = useContext(ThemeCtx);
  if (!data?.length) return null;
  const mx = Math.max(...data.map(d => d.value || 0), 1);
  const bh = 22; const lw = 90;
  return <svg viewBox={`0 0 280 ${data.length * (bh + 6)}`} style={{width:"100%"}}>
    {data.map((d, i) => {
      const bw = ((d.value || 0) / mx) * 170;
      const y = i * (bh + 6);
      const bc = d.value >= 40 ? (color || "#10b981") : d.value >= 30 ? "#f59e0b" : "#ef4444";
      return <g key={i}>
        <text x={0} y={y + bh * 0.72} fontSize="10" fill={C.neutral} fontFamily="DM Sans">{(d.label || "").substring(0, 12)}</text>
        <rect x={lw} y={y + 2} width={Math.max(bw, 2)} height={bh - 4} rx="4" fill={bc} opacity="0.85"/>
        <text x={lw + bw + 4} y={y + bh * 0.72} fontSize="10" fontWeight="600" fill={bc}>{d.value.toFixed(1)}%</text>
      </g>;
    })}
  </svg>;
}

// ─── PRICE SIMULATOR ─────────────────────────────────────────────────────────
function PriceSim({ baseCa, baseMarge, baseTx }: { baseCa: number; baseMarge: number; baseTx: number }) {
  const C = useContext(ThemeCtx);
  const [delta, setDelta] = useState(0);
  const vol = 1 + (delta / 100) * (-0.5);
  const nCa = baseCa * (1 + delta / 100) * vol;
  const nMg = baseMarge * (1 + delta / 100) * vol + (nCa - baseCa) * ((baseTx || 0) / 100);
  const nTx = nCa > 0 ? (nMg / nCa) * 100 : 0;
  const diff = nMg - baseMarge;
  return <div style={{background:C.muted,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
    <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:10}}>💡 Simulateur de prix</div>
    <input type="range" min={-10} max={20} step={1} value={delta} onChange={e => setDelta(Number(e.target.value))} style={{width:"100%",marginBottom:6}}/>
    <div style={{textAlign:"center",fontSize:13,fontWeight:700,color:delta>=0?C.success:C.danger,marginBottom:10}}>{delta >= 0 ? "+" : ""}{delta}% de variation de prix</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
      {[["CA simulé",fmt(baseCa),fmt(nCa)],["Marge simulée",fmt(baseMarge),fmt(nMg)],["Taux simulé",pct(baseTx),pct(nTx)]].map((k,i) =>
        <div key={i} style={{background:C.card,borderRadius:8,padding:"8px 10px",border:`1px solid ${C.border}`}}>
          <div style={{fontSize:10,color:C.neutral,marginBottom:3}}>{k[0]}</div>
          <div style={{fontSize:10,color:C.neutral,textDecoration:"line-through"}}>{k[1]}</div>
          <div style={{fontSize:13,fontWeight:700,color:diff>=0?C.success:C.danger}}>{k[2]}</div>
        </div>
      )}
    </div>
    <div style={{marginTop:8,fontSize:12,textAlign:"center",fontWeight:600,color:diff>=0?C.success:C.danger}}>
      {diff >= 0 ? "✅" : "⚠️"} {delta >= 0 ? "Hausse" : "Baisse"} de {Math.abs(delta)}% → {diff >= 0 ? "+" : ""}{fmt(diff)} de marge
    </div>
  </div>;
}

// ─── SEARCH BAR ──────────────────────────────────────────────────────────────
function SearchBar({ brandsData, labsData, onOpen, autoFocus }: any) {
  const C = useContext(ThemeCtx);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const iRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autoFocus && iRef.current) iRef.current.focus(); }, [autoFocus]);
  function search(v: string) {
    setQ(v);
    if (v.length < 2) { setResults([]); setOpen(false); return; }
    const lv = v.toLowerCase();
    const r: any[] = [];
    Object.keys(brandsData || {}).forEach(k => { if (k.toLowerCase().includes(lv)) { const d = brandsData[k]; r.push({type:"brand",name:k,ca:d.ca,status:d.status,color:d.color}); }});
    Object.keys(labsData || {}).forEach(k => { if (k.toLowerCase().includes(lv)) { const d = labsData[k]; r.push({type:"lab",name:k,ca:d.ca,status:d.status,color:d.color}); }});
    setResults(r.slice(0, 8)); setOpen(true);
  }
  return <div style={{position:"relative",width:"100%"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,background:C.card,border:`1.5px solid ${open?C.primary:C.border}`,borderRadius:12,padding:"10px 14px",transition:"border-color 0.15s"}}>
      <span style={{fontSize:16,color:C.neutral}}>🔍</span>
      <input ref={iRef} value={q} onChange={e => search(e.target.value)} onFocus={() => { if (q.length >= 2) setOpen(true); }} placeholder="Rechercher une marque, un labo..." style={{flex:1,border:"none",outline:"none",background:"transparent",fontSize:14,color:C.text,fontFamily:"DM Sans,sans-serif"}}/>
      {q && <button onClick={() => { setQ(""); setResults([]); setOpen(false); }} style={{border:"none",background:"none",cursor:"pointer",color:C.neutral,fontSize:18,lineHeight:1,padding:0}}>×</button>}
    </div>
    {open && results.length > 0 && <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:300,background:C.card,borderRadius:12,border:`1px solid ${C.border}`,boxShadow:`0 8px 32px ${C.shadow}`,marginTop:4,overflow:"hidden"}}>
      {results.map((r, i) => <div key={i} onClick={() => { onOpen(r.name, r.type); setOpen(false); setQ(""); }} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",borderBottom:i<results.length-1?`1px solid ${C.border}`:"none"}}>
        <div style={{width:8,height:8,borderRadius:99,background:r.color||"#94a3b8",flexShrink:0}}/>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{r.name}</div><div style={{fontSize:11,color:C.neutral}}>{r.type==="brand"?"Marque":"Laboratoire"} · {fmt(r.ca)}</div></div>
        <Badge status={r.status}/>
      </div>)}
    </div>}
  </div>;
}

// ─── BRAND DETAIL ─────────────────────────────────────────────────────────────
function BrandDetail({ name, brandsData, labsData, onGoImport }: any) {
  const C = useContext(ThemeCtx);
  const [sub, setSub] = useState("kpis");
  const [done, setDone] = useState<number[]>([]);
  const brand = brandsData?.[name];
  if (!brand) return <div style={{padding:20,textAlign:"center",color:C.neutral}}><div style={{fontSize:32}}>💄</div><div style={{fontSize:14,marginTop:8}}>"{name}" non trouvé</div></div>;
  const color = brand.color || "#1a56db";
  const txOk = brand.tx >= (brand.objectifTx || 35);
  const SUBTABS = [{id:"kpis",label:"📊 KPIs"},{id:"prix",label:"💰 Prix"},{id:"concurrents",label:"⚔️ Concurrents"},{id:"reco",label:"💡 Reco."},{id:"merch",label:"🏪 Merch."},{id:"stock",label:"📦 Stock"},{id:"rfa",label:"🤝 RFA"},{id:"promos",label:"🎁 Promos"},{id:"flyers",label:"📋 Flyers"}];
  return <div className="fade">
    <div style={{background:`linear-gradient(135deg,${color}18 0%,${color}08 100%)`,border:`1px solid ${color}33`,borderRadius:14,padding:"14px 16px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <div style={{width:12,height:12,borderRadius:99,background:color}}/>
        <span style={{fontSize:17,fontWeight:800,color:C.text}}>{name}</span>
        <Badge status={brand.status}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {[{l:"CA",v:fmt(brand.ca)},{l:"Marge",v:fmt(brand.marge)},{l:"Taux",v:brand.tx.toFixed(1)+"%"},{l:"Évol.",v:pct(brand.evol)}].map((k,i) =>
          <div key={i}><div style={{fontSize:10,color:C.neutral}}>{k.l}</div><div style={{fontSize:14,fontWeight:700,color:i===3?(brand.evol>=0?C.success:C.danger):color}}>{k.v}</div></div>
        )}
      </div>
    </div>
    <div className="sc" style={{display:"flex",gap:4,overflowX:"auto",marginBottom:12,paddingBottom:4}}>
      {SUBTABS.map(t => <button key={t.id} onClick={() => setSub(t.id)} style={{flexShrink:0,padding:"6px 10px",borderRadius:8,border:"none",background:sub===t.id?color:"transparent",color:sub===t.id?"white":C.neutral,fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{t.label}</button>)}
    </div>
    {sub === "kpis" && <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        <KPI label="CA HT 12m" value={fmt(brand.ca)} sub={"N-1 : "+fmt(brand.ca_n1)} color={color}/>
        <KPI label="Marge HT" value={fmt(brand.marge)} sub={"N-1 : "+fmt(brand.marge_n1)} color={color}/>
        <KPI label="Taux de marque" value={brand.tx.toFixed(1)+"%"} sub={"Obj : "+(brand.objectifTx||35)+"%"} color={txOk?C.success:C.warning} alert={!txOk}/>
        <KPI label="Évolution CA" value={pct(brand.evol)} sub={"Qtés : "+fmtN(brand.qte)} color={brand.evol>=0?C.success:C.danger}/>
      </div>
      {!txOk && <AlertBox type="warning" title="Taux sous l'objectif">{brand.tx.toFixed(1)}% vs objectif {brand.objectifTx||35}% — écart de {((brand.objectifTx||35)-brand.tx).toFixed(1)} pts</AlertBox>}
      {brand.monthly?.length > 0 && <Card style={{marginBottom:12}}><SecTitle color={color}>Évolution mensuelle du CA</SecTitle><LineChart data={brand.monthly} color={color} height={100}/></Card>}
      <Card><SecTitle color={color}>Notes & suivi</SecTitle>{(brand.notes||[]).map((n:string,i:number) => <div key={i} style={{fontSize:12,color:C.text,padding:"4px 0",borderBottom:`1px solid ${C.border}`,display:"flex",gap:6}}><span>•</span><span>{n}</span></div>)}</Card>
    </div>}
    {sub === "prix" && <div>
      {!(brand.products||[]).length && <AlertBox type="info">Importez des données de vente pour voir l'analyse prix — <span style={{fontWeight:600,cursor:"pointer",color:C.primary}} onClick={onGoImport}>→ Importer</span></AlertBox>}
      {(brand.products||[]).length > 0 && <Card style={{marginBottom:12}}>
        <SecTitle color={color}>Analyse par produit</SecTitle>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead><tr>{["Produit","PVMP","PRMP","Qté","Tx%","Stock"].map(hd => <th key={hd} style={{padding:"6px 8px",textAlign:"left",color:C.neutral,borderBottom:`1px solid ${C.border}`,fontWeight:600,whiteSpace:"nowrap"}}>{hd}</th>)}</tr></thead>
            <tbody>{brand.products.map((pr:Product,i:number) => {
              const tc = pr.tx>=40?C.success:pr.tx>=30?C.warning:"#ef4444";
              return <tr key={i} style={{background:i%2===0?C.muted:"transparent"}}>
                <td style={{padding:"6px 8px",color:C.text,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pr.name}</td>
                <td style={{padding:"6px 8px",color:C.neutral}}>{pr.pvmp.toFixed(2)}€</td>
                <td style={{padding:"6px 8px",color:C.neutral}}>{pr.prmp.toFixed(2)}€</td>
                <td style={{padding:"6px 8px",color:C.text}}>{pr.qte}</td>
                <td style={{padding:"6px 8px",fontWeight:700,color:tc}}>{pr.tx.toFixed(1)}%</td>
                <td style={{padding:"6px 8px",color:pr.stock<15?"#ef4444":C.neutral}}>{pr.stock}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        <div style={{marginTop:12}}><HBarChart data={brand.products.map((pr:Product) => ({label:pr.name,value:pr.tx}))} color={color}/></div>
      </Card>}
      <PriceSim baseCa={brand.ca} baseMarge={brand.marge} baseTx={brand.tx}/>
    </div>}
    {sub === "concurrents" && <div>
      {!(brand.competitors||[]).length && <AlertBox type="info">Aucun concurrent enregistré.</AlertBox>}
      {(brand.competitors||[]).length > 0 && <Card style={{marginBottom:12}}>
        <SecTitle color={color}>Concurrents directs</SecTitle>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr>{["Concurrent","CA estimé","Taux","Notes"].map(hd => <th key={hd} style={{padding:"6px 8px",textAlign:"left",color:C.neutral,borderBottom:`1px solid ${C.border}`,fontWeight:600}}>{hd}</th>)}</tr></thead>
            <tbody>{(brand.competitors||[]).map((c:Competitor,i:number) => <tr key={i} style={{background:i%2===0?C.muted:"transparent"}}>
              <td style={{padding:"6px 8px",fontWeight:600,color:C.text}}>{c.name}</td>
              <td style={{padding:"6px 8px",color:C.neutral}}>{fmt(c.ca)}</td>
              <td style={{padding:"6px 8px",fontWeight:700,color:c.tx>=brand.tx?C.success:C.warning}}>{c.tx.toFixed(1)}%</td>
              <td style={{padding:"6px 8px",color:C.neutral,fontSize:11}}>{c.notes}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </Card>}
      <Card><SecTitle color={color}>Analyse</SecTitle><div style={{fontSize:12,color:C.text,lineHeight:1.7}}>{brand.info}</div></Card>
    </div>}
    {sub === "reco" && <div>
      <AlertBox type={brand.status==="boom"||brand.status==="good"?"success":brand.status==="warning"?"warning":"danger"} title={"Statut : "+(STC[brand.status]?.label||"")}>{brand.info}</AlertBox>
      <Card style={{marginBottom:12}}>
        <SecTitle color={color}>Actions recommandées</SecTitle>
        {(brand.actions||[]).map((a:string,i:number) => {
          const isDone = done.includes(i);
          return <div key={i} onClick={() => setDone(d => d.includes(i)?d.filter(x=>x!==i):[...d,i])} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer",opacity:isDone?0.5:1}}>
            <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${isDone?color:C.border}`,background:isDone?color:"transparent",flexShrink:0,marginTop:1,display:"flex",alignItems:"center",justifyContent:"center"}}>{isDone&&<span style={{color:"white",fontSize:11}}>✓</span>}</div>
            <span style={{fontSize:12,color:C.text,textDecoration:isDone?"line-through":"none"}}>{a}</span>
          </div>;
        })}
      </Card>
      <PriceSim baseCa={brand.ca} baseMarge={brand.marge} baseTx={brand.tx}/>
    </div>}
    {sub === "merch" && (() => {
      const m = brand.merchandising;
      if (!m) return <AlertBox type="info">Données merchandising non renseignées.</AlertBox>;
      return <div>
        <Card style={{marginBottom:12}}>
          <SecTitle color={color}>Plan de rayonnage</SecTitle>
          <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:C.neutral}}>📐 {m.totalEtageres} étagère(s)</span>
            <span style={{fontSize:11,color:C.neutral}}>🔄 {m.rotation}</span>
            <span style={{fontSize:11,color:C.neutral}}>📏 {m.facing}</span>
          </div>
          {(m.etageres||[]).map((e:any,i:number) => <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
            <div style={{width:28,height:28,borderRadius:6,background:color+"22",border:`1px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color,flexShrink:0}}>{e.etagere}</div>
            <div style={{fontSize:11,color:C.text,paddingTop:6}}>{(e.produits||[]).join(" · ")}</div>
          </div>)}
        </Card>
        <Card><SecTitle color={color}>💡 Conseils</SecTitle>{(m.tips||[]).map((t:string,i:number) => <div key={i} style={{fontSize:12,color:C.text,padding:"4px 0",borderBottom:`1px solid ${C.border}`,display:"flex",gap:6}}><span style={{color}}>›</span><span>{t}</span></div>)}</Card>
      </div>;
    })()}
    {sub === "stock" && (() => {
      const stk = brand.stock;
      if (!stk) return <AlertBox type="info">Données stock non disponibles.</AlertBox>;
      return <div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
          <KPI label="Valeur stock" value={fmt(stk.valeurStock)} color={color}/>
          <KPI label="Jours couverture" value={stk.joursStock+"j"} color={stk.joursStock>90?C.warning:C.success}/>
          <KPI label="Tx rupture" value={stk.tauxRupture+"%"} color={stk.tauxRupture>5?C.danger:C.success}/>
        </div>
        {stk.alertes?.length > 0 ? <Card><SecTitle color="#ef4444">Alertes stock</SecTitle>{stk.alertes.map((a:string,i:number) => <AlertBox key={i} type="warning">{a}</AlertBox>)}</Card> : <AlertBox type="success">Aucune alerte de stock ✅</AlertBox>}
      </div>;
    })()}
    {sub === "rfa" && (() => {
      const rfa = brand.rfa;
      if (!rfa) return <AlertBox type="info">Données RFA non renseignées.</AlertBox>;
      const prog = Math.min((rfa.tauxAtteint / rfa.tauxNegocié) * 100, 100);
      return <div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          <KPI label="Taux négocié" value={rfa.tauxNegocié+"%"} color={color}/>
          <KPI label="Taux atteint" value={rfa.tauxAtteint+"%"} color={rfa.tauxAtteint>=rfa.tauxNegocié?C.success:C.warning} alert={rfa.tauxAtteint<rfa.tauxNegocié}/>
          <KPI label="Montant estimé" value={fmt(rfa.montantEstimé)} color={color}/>
          <KPI label="Échéance" value={rfa.echeance||"—"} color={C.neutral}/>
        </div>
        <Card style={{marginBottom:12}}>
          <div style={{fontSize:12,color:C.neutral,marginBottom:6}}>Progression vers l'objectif</div>
          <div style={{background:C.border,borderRadius:99,height:10,overflow:"hidden"}}><div style={{width:prog+"%",height:"100%",background:prog>=100?C.success:C.warning,borderRadius:99,transition:"width 0.5s"}}/></div>
          <div style={{fontSize:11,color:C.neutral,marginTop:4}}>{rfa.tauxAtteint}% / {rfa.tauxNegocié}% ({prog.toFixed(0)}%)</div>
        </Card>
        <AlertBox type="info">{rfa.notes}</AlertBox>
      </div>;
    })()}
    {sub === "promos" && (!(brand.promos||[]).length ? <AlertBox type="info">Aucune promotion en cours.</AlertBox> :
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {(brand.promos||[]).map((pr:any,i:number) => <Card key={i}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <div><div style={{fontWeight:700,fontSize:13,color:C.text}}>{pr.nom}</div><div style={{fontSize:12,color:C.neutral,marginTop:2}}>{pr.remise}</div><div style={{fontSize:11,color:C.neutral,marginTop:3}}>{(pr.produits||[]).join(", ")}</div></div>
            <span style={{background:"#fef3c7",color:"#92400e",border:"1px solid #fcd34d",borderRadius:8,padding:"3px 8px",fontSize:11,fontWeight:600,flexShrink:0}}>Fin {pr.fin}</span>
          </div>
        </Card>)}
      </div>
    )}
    {sub === "flyers" && (!(brand.flyers||[]).length ? <AlertBox type="info">Aucune action flyer planifiée.</AlertBox> :
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {(brand.flyers||[]).map((fl:any,i:number) => {
          const sc: any = {confirmé:{bg:"#dcfce7",c:"#166534",bo:"#86efac"},planifié:{bg:"#eff6ff",c:"#1e40af",bo:"#93c5fd"}}[fl.statut] || {bg:"#f3f4f6",c:"#374151",bo:"#d1d5db"};
          return <Card key={i}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}><div><div style={{fontWeight:700,fontSize:13,color:C.text}}>{fl.mois} — {fl.theme}</div><div style={{fontSize:11,color:C.neutral,marginTop:3}}>{(fl.marques||[]).join(", ")}</div></div><span style={{background:sc.bg,color:sc.c,border:`1px solid ${sc.bo}`,borderRadius:8,padding:"3px 8px",fontSize:11,fontWeight:600,flexShrink:0}}>{fl.statut}</span></div></Card>;
        })}
      </div>
    )}
  </div>;
}

// ─── LAB DETAIL ──────────────────────────────────────────────────────────────
function LabDetail({ name, labsData, onGoImport }: any) {
  const C = useContext(ThemeCtx);
  const [sub, setSub] = useState("perf");
  const lab = labsData?.[name];
  if (!lab) return <div style={{padding:20,textAlign:"center",color:C.neutral}}><div style={{fontSize:32}}>🏭</div><div style={{fontSize:14,marginTop:8}}>"{name}" non trouvé</div></div>;
  const color = lab.color || "#1a56db";
  const tabs = [{id:"perf",label:"📊 Performance"},{id:"analyse",label:"🎯 Analyse"},{id:"reco",label:"💡 Recommandations"}];
  return <div className="fade">
    <div style={{background:`linear-gradient(135deg,${color}18 0%,${color}08 100%)`,border:`1px solid ${color}33`,borderRadius:14,padding:"14px 16px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><div style={{width:12,height:12,borderRadius:99,background:color}}/><span style={{fontSize:17,fontWeight:800,color:C.text}}>{name}</span></div>
      <div style={{display:"flex",gap:6,marginBottom:10}}><Badge status={lab.status}/><span style={{fontSize:11,color:C.neutral,background:C.muted,border:`1px solid ${C.border}`,borderRadius:8,padding:"2px 8px"}}>{lab.segment||"labo"}</span></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {[{l:"CA",v:fmt(lab.ca)},{l:"Marge",v:fmt(lab.marge)},{l:"Taux",v:lab.tx.toFixed(1)+"%"},{l:"Évol.",v:pct(lab.evol)}].map((k,i) =>
          <div key={i}><div style={{fontSize:10,color:C.neutral}}>{k.l}</div><div style={{fontSize:14,fontWeight:700,color:i===3?(lab.evol>=0?C.success:C.danger):color}}>{k.v}</div></div>
        )}
      </div>
    </div>
    <div className="sc" style={{display:"flex",gap:4,overflowX:"auto",marginBottom:12,paddingBottom:4}}>
      {tabs.map(t => <button key={t.id} onClick={() => setSub(t.id)} style={{flexShrink:0,padding:"6px 14px",borderRadius:8,border:"none",background:sub===t.id?color:"transparent",color:sub===t.id?"white":C.neutral,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.label}</button>)}
    </div>
    {sub === "perf" && <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        <KPI label="CA HT" value={fmt(lab.ca)} sub={"N-1 : "+fmt(lab.ca_n1)} color={color}/>
        <KPI label="Marge HT" value={fmt(lab.marge)} sub={"Taux : "+lab.tx.toFixed(1)+"%"} color={color}/>
      </div>
      {lab.monthly?.length > 0 && <Card style={{marginBottom:12}}><SecTitle color={color}>Évolution mensuelle</SecTitle><LineChart data={lab.monthly} color={color} height={100}/></Card>}
      {lab.topProduits?.length > 0 && <Card><SecTitle color={color}>Top produits</SecTitle>{lab.topProduits.map((pr:string,i:number) => <div key={i} style={{fontSize:12,color:C.text,padding:"4px 0",borderBottom:`1px solid ${C.border}`,display:"flex",gap:6}}><span style={{color,fontWeight:700}}>{i+1}.</span><span>{pr}</span></div>)}</Card>}
    </div>}
    {sub === "analyse" && <div>
      <AlertBox type={lab.status==="warning"?"warning":"info"} title={"Analyse — "+name}>{lab.info}</AlertBox>
      <Card><SecTitle color={color}>Notes</SecTitle>{(lab.notes||[]).map((n:string,i:number) => <div key={i} style={{fontSize:12,color:C.text,padding:"4px 0",borderBottom:`1px solid ${C.border}`,display:"flex",gap:6}}><span>•</span><span>{n}</span></div>)}</Card>
    </div>}
    {sub === "reco" && <div>
      <Card style={{marginBottom:12}}><SecTitle color={color}>Actions recommandées</SecTitle>{(lab.actions||[]).map((a:string,i:number) => <div key={i} style={{fontSize:12,color:C.text,padding:"6px 0",borderBottom:`1px solid ${C.border}`,display:"flex",gap:6}}><span style={{color}}>›</span><span>{a}</span></div>)}</Card>
      <PriceSim baseCa={lab.ca} baseMarge={lab.marge} baseTx={lab.tx}/>
    </div>}
  </div>;
}

// ─── IMPORT TAB ───────────────────────────────────────────────────────────────
const BPAT: Record<string,string[]> = {"La Rosée":["LA ROSEE","ROSEE"],"Pileje":["PILEJE","LACTIBIANE"],"SVR":["SVR","CLAIRIAL"],"Avène":["AVENE","AVÈNE","XERA"],"CeraVe":["CERAVE"],"La Roche Posay":["ROCHE POSAY","ANTHELIOS","CICAPLAST"],"Nuxe":["NUXE","PRODIG"],"Caudalie":["CAUDALIE","VINOSOURCE"],"Nutergia":["NUTERGIA","ERGY"],"Therascience":["THERASCIENCE","PHYSIOMANCE"],"Cooper":["COOPER"],"BIOGARAN":["BIOGARAN"]};
function detectBrand(name: string) { if (!name) return null; const up = name.toUpperCase(); let found: string | null = null; Object.keys(BPAT).forEach(brand => { if (BPAT[brand].some(p => up.includes(p))) found = brand; }); return found; }

function ImportTab({ onBrandsUpdate, onLabsUpdate }: any) {
  const C = useContext(ThemeCtx);
  const [files, setFiles] = useState<any[]>([]);
  const [dragging, setDragging] = useState(false);
  const [mForm, setMForm] = useState({name:"",ca:"",marge:"",qte:""});
  const [showManual, setShowManual] = useState(false);
  const fRef = useRef<HTMLInputElement>(null);

  function processCSV(text: string) {
    try {
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) return {ok:false,msg:"Fichier vide"};
      const sep = lines[0].includes(";") ? ";" : lines[0].includes("\t") ? "\t" : ",";
      let hIdx = 0;
      for (let i = 0; i < Math.min(5, lines.length); i++) { const row = lines[i].split(sep); if (row.some(c => /(designation|libelle|ca|marge|montant)/i.test(c))) { hIdx = i; break; } }
      const headers = lines[hIdx].split(sep).map(h => h.trim().toLowerCase().replace(/["']/g,""));
      const rows = lines.slice(hIdx+1).map(l => l.split(sep).map(c => c.trim().replace(/["']/g,"")));
      const fc = (...keys: string[]) => { for (const k of keys) { const idx = headers.findIndex(h => h.includes(k)); if (idx >= 0) return idx; } return -1; };
      const cN=fc("designation","libelle","nom","produit","article"); const cC=fc("ca ht","montant ht","ca","montant"); const cM=fc("marge ht","marge"); const cQ=fc("quantite","qte","boites"); const cL=fc("laboratoire","labo","fournisseur");
      const bMap: any = {}; const lMap: any = {}; let cnt = 0;
      rows.forEach(row => {
        if (!row.length || !row[0]) return;
        const name2 = cN >= 0 ? row[cN] : ""; const ca = cC >= 0 ? parseFloat((row[cC]||"0").replace(",",".")) || 0 : 0;
        const marge = cM >= 0 ? parseFloat((row[cM]||"0").replace(",",".")) || 0 : 0; const qte = cQ >= 0 ? parseInt(row[cQ]) || 0 : 0; const lab = cL >= 0 ? row[cL] : "";
        if (!name2 && !lab) return; cnt++;
        const brand2 = detectBrand(name2) || detectBrand(lab);
        if (brand2) { if (!bMap[brand2]) bMap[brand2]={ca:0,marge:0,qte:0}; bMap[brand2].ca+=ca; bMap[brand2].marge+=marge; bMap[brand2].qte+=qte; }
        if (lab) { const lk = lab.toUpperCase().substring(0, 20); if (!lMap[lk]) lMap[lk]={ca:0,marge:0,qte:0,name:lab}; lMap[lk].ca+=ca; lMap[lk].marge+=marge; lMap[lk].qte+=qte; }
      });
      if (Object.keys(bMap).length) onBrandsUpdate(bMap);
      if (Object.keys(lMap).length) onLabsUpdate(lMap);
      return {ok:true,msg:`${cnt} lignes · ${Object.keys(bMap).length} marques · ${Object.keys(lMap).length} labos`};
    } catch(e: any) { return {ok:false,msg:"Erreur : "+e.message}; }
  }

  function handleFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const id = Date.now()+"_"+file.name;
    setFiles(prev => [...prev, {id,name:file.name,status:"loading",msg:"Traitement..."}]);
    if (ext === "csv" || ext === "txt") {
      file.text().then(text => { const r = processCSV(text); setFiles(prev => prev.map(f => f.id===id?{...f,status:r.ok?"ok":"error",msg:r.msg}:f)); });
    } else if (ext === "pdf") {
      setFiles(prev => prev.map(f => f.id===id?{...f,status:"warning",msg:"PDF importé — vérifiez les données manuellement"}:f));
    } else {
      setFiles(prev => prev.map(f => f.id===id?{...f,status:"error",msg:"Format non supporté : "+ext}:f));
    }
  }

  return <div>
    <SecTitle color="#1a56db">📂 Import de documents</SecTitle>
    <AlertBox type="info">Formats : CSV, XLS, XLSX, PDF. Les données enrichissent automatiquement les fiches marques et labos.</AlertBox>
    <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);Array.from(e.dataTransfer.files).forEach(handleFile);}} onClick={()=>fRef.current?.click()} style={{border:`2px dashed ${dragging?"#1a56db":"#e2e8f0"}`,borderRadius:14,padding:32,textAlign:"center",cursor:"pointer",background:dragging?"#eff6ff":"#f8fafc",transition:"all 0.15s",marginBottom:16}}>
      <div style={{fontSize:32,marginBottom:8}}>📁</div>
      <div style={{fontSize:14,fontWeight:600,color:"#0f172a"}}>Glissez vos fichiers ici</div>
      <div style={{fontSize:12,color:"#64748b",marginTop:4}}>ou appuyez pour parcourir</div>
      <input ref={fRef} type="file" multiple accept=".csv,.xls,.xlsx,.pdf" style={{display:"none"}} onChange={e=>Array.from(e.target.files||[]).forEach(handleFile)}/>
    </div>
    {files.length > 0 && <div style={{marginBottom:16}}>
      {files.map(f => {
        const ic = f.status==="ok"?"✅":f.status==="error"?"❌":f.status==="warning"?"⚠️":"⏳";
        const bg = f.status==="ok"?"#f0fdf4":f.status==="error"?"#fef2f2":f.status==="warning"?"#fffbeb":"#f8fafc";
        const bo = f.status==="ok"?"#86efac":f.status==="error"?"#fca5a5":f.status==="warning"?"#fcd34d":"#e2e8f0";
        return <div key={f.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:bg,border:`1px solid ${bo}`,borderRadius:10,marginBottom:6}}>
          <span style={{fontSize:18}}>{ic}</span>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div><div style={{fontSize:11,color:"#64748b"}}>{f.msg}</div></div>
          <button onClick={()=>setFiles(p=>p.filter(x=>x.id!==f.id))} style={{border:"none",background:"none",cursor:"pointer",color:"#94a3b8",fontSize:16,padding:0,lineHeight:1}}>×</button>
        </div>;
      })}
    </div>}
    <button onClick={()=>setShowManual(v=>!v)} style={{width:"100%",padding:12,background:"#f8fafc",border:"1px dashed #e2e8f0",borderRadius:10,fontSize:13,fontWeight:600,color:"#64748b",cursor:"pointer",marginBottom:12}}>➕ Ajouter un labo manuellement</button>
    {showManual && <Card style={{marginBottom:12}}>
      <SecTitle color="#1a56db">Nouveau laboratoire</SecTitle>
      {[["Nom du labo *","name","text"],["CA HT (€)","ca","number"],["Marge HT (€)","marge","number"],["Quantités","qte","number"]].map(([label,key,type]) =>
        <div key={key} style={{marginBottom:8}}>
          <label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:3}}>{label}</label>
          <input type={type} value={(mForm as any)[key]} onChange={e=>{const val=e.target.value;setMForm(v=>({...v,[key]:val}));}} style={{width:"100%",padding:"8px 10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"DM Sans,sans-serif"}}/>
        </div>
      )}
      <button onClick={()=>{if(!mForm.name)return;const lm: any={};lm[mForm.name.toUpperCase()]={ca:parseFloat(mForm.ca)||0,marge:parseFloat(mForm.marge)||0,qte:parseInt(mForm.qte)||0,name:mForm.name,count:1};onLabsUpdate(lm);setMForm({name:"",ca:"",marge:"",qte:""});setShowManual(false);}} style={{width:"100%",padding:10,background:"#1a56db",color:"white",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>Ajouter</button>
    </Card>}
  </div>;
}

// ─── WEEKLY PRIORITIES ────────────────────────────────────────────────────────
function WeeklyPriorities({ brandsData, onOpen }: any) {
  const C = useContext(ThemeCtx);
  const prios = useMemo(() => Object.entries(brandsData || {}).map(([name, d]: any) => {
    let score = 0; let reason = "";
    if (d.tx < (d.objectifTx || 35)) { score += 3; reason = `Taux ${d.tx.toFixed(1)}% sous objectif (${d.objectifTx||35}%)`; }
    if (d.evol < -10) { score += 2; reason = reason || `Recul CA de ${pct(d.evol)}`; }
    if (d.status === "warning") { score += 1; reason = reason || "Statut en attention"; }
    if (d.status === "danger") { score += 3; reason = reason || "Statut critique"; }
    if (d.status === "boom") score -= 2;
    return {name, d, score, reason};
  }).sort((a,b) => b.score - a.score).filter(x => x.score > 0).slice(0, 3), [brandsData]);
  if (!prios.length) return <Card><AlertBox type="success">🎉 Toutes les marques sont en bonne forme !</AlertBox></Card>;
  return <Card>
    <SecTitle color="#d97706">🎯 Priorités de la semaine</SecTitle>
    {prios.map((pr, i) => <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<prios.length-1?`1px solid ${C.border}`:"none"}}>
      <div style={{width:28,height:28,borderRadius:8,background:i===0?"#fef3c7":i===1?"#fee2e2":"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{i===0?"🔥":i===1?"⚠️":"📌"}</div>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:700,color:C.text}}>{pr.name}</div><div style={{fontSize:11,color:C.neutral,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pr.reason}</div></div>
      <button onClick={()=>onOpen(pr.name,"brand")} style={{background:pr.d.color||C.primary,color:"white",border:"none",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>→</button>
    </div>)}
  </Card>;
}

// ─── SYNTHÈSE ─────────────────────────────────────────────────────────────────
function Synthese({ brandsData, onOpen }: any) {
  const C = useContext(ThemeCtx);
  const [sortK, setSortK] = useState("marge");
  const sorted = useMemo(() => Object.entries(brandsData || {}).map(([name, d]: any) => ({name,...d})).sort((a,b) => (b[sortK]||0)-(a[sortK]||0)), [brandsData, sortK]);
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
      <SecTitle color="#1a56db">💄 Synthèse marques</SecTitle>
      <div style={{display:"flex",gap:4}}>
        {["ca","marge","tx","evol"].map(k => <button key={k} onClick={()=>setSortK(k)} style={{padding:"4px 8px",borderRadius:6,border:"none",fontSize:11,fontWeight:600,cursor:"pointer",background:sortK===k?C.primary:C.muted,color:sortK===k?"white":C.neutral}}>{k.toUpperCase()}</button>)}
      </div>
    </div>
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr>{["Marque","CA HT","Marge","Taux","Évol.","Statut"].map(hd => <th key={hd} style={{padding:"6px 8px",textAlign:"left",color:C.neutral,borderBottom:`1px solid ${C.border}`,fontWeight:600,whiteSpace:"nowrap"}}>{hd}</th>)}</tr></thead>
        <tbody>{sorted.map((b:any,i:number) => <tr key={i} onClick={()=>onOpen(b.name,"brand")} style={{background:i%2===0?C.muted:"transparent",cursor:"pointer"}}>
          <td style={{padding:"8px 8px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:99,background:b.color||"#94a3b8",flexShrink:0}}/><span style={{fontWeight:600,color:C.text}}>{b.name}</span></div></td>
          <td style={{padding:"8px 8px",color:C.text}}>{fmt(b.ca)}</td>
          <td style={{padding:"8px 8px",color:C.text}}>{fmt(b.marge)}</td>
          <td style={{padding:"8px 8px",fontWeight:700,color:b.tx>=35?C.success:b.tx>=25?C.warning:"#ef4444"}}>{b.tx.toFixed(1)}%</td>
          <td style={{padding:"8px 8px",color:b.evol>=0?C.success:C.danger}}>{pct(b.evol)}</td>
          <td style={{padding:"8px 8px"}}><Badge status={b.status}/></td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}

function LabsSynthese({ labsData, onOpen }: any) {
  const C = useContext(ThemeCtx);
  const sorted = useMemo(() => Object.entries(labsData || {}).map(([name, d]: any) => ({name,...d})).sort((a,b) => (b.marge||0)-(a.marge||0)), [labsData]);
  return <div>
    <SecTitle color="#6366f1">🏭 Synthèse laboratoires</SecTitle>
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr>{["Labo","CA HT","Marge","Taux","Évol."].map(hd => <th key={hd} style={{padding:"6px 8px",textAlign:"left",color:C.neutral,borderBottom:`1px solid ${C.border}`,fontWeight:600,whiteSpace:"nowrap"}}>{hd}</th>)}</tr></thead>
        <tbody>{sorted.map((l:any,i:number) => <tr key={i} onClick={()=>onOpen(l.name,"lab")} style={{background:i%2===0?C.muted:"transparent",cursor:"pointer"}}>
          <td style={{padding:"8px 8px",fontWeight:600,color:l.color||C.primary}}>{l.name}</td>
          <td style={{padding:"8px 8px",color:C.text}}>{fmt(l.ca)}</td>
          <td style={{padding:"8px 8px",color:C.text}}>{fmt(l.marge)}</td>
          <td style={{padding:"8px 8px",fontWeight:700,color:l.tx>=35?C.success:l.tx>=25?C.warning:"#ef4444"}}>{l.tx.toFixed(1)}%</td>
          <td style={{padding:"8px 8px",color:l.evol>=0?C.success:C.danger}}>{pct(l.evol)}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}

// ─── UNIVERS ──────────────────────────────────────────────────────────────────
function UniversCard({ univers, onOpen }: any) {
  const C = useContext(ThemeCtx);
  const u = univers;
  const tc = ({boom:"↑↑ boom",up:"↑ progression",stable:"→ stable",down:"↓ recul"} as any)[u.trend] || "→";
  const tc2 = ({boom:"#10b981",up:"#22c55e",stable:"#94a3b8",down:"#ef4444"} as any)[u.trend] || "#94a3b8";
  return <div onClick={()=>onOpen(u.id,"univers")} style={{background:C.card,borderRadius:14,border:`1px solid ${C.border}`,padding:16,cursor:"pointer",boxShadow:`0 2px 8px ${C.shadow}`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
      <span style={{fontSize:28}}>{u.icon}</span>
      <span style={{fontSize:11,fontWeight:700,color:tc2,background:tc2+"22",borderRadius:8,padding:"2px 8px"}}>{tc}</span>
    </div>
    <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>{u.name}</div>
    <div style={{fontSize:11,color:C.neutral,marginBottom:6}}>{u.desc}</div>
    <div style={{fontSize:11,color:u.color,fontWeight:600}}>{(u.marques||[]).length} marques →</div>
  </div>;
}

function UniversDetail({ id, onOpen }: any) {
  const C = useContext(ThemeCtx);
  const [sub, setSub] = useState("overview");
  const u = UNIVERS.find(x => x.id === id);
  if (!u) return null;
  return <div className="fade">
    <div style={{background:`linear-gradient(135deg,${u.color}18 0%,${u.color}08 100%)`,border:`1px solid ${u.color}33`,borderRadius:14,padding:"14px 16px",marginBottom:12}}>
      <div style={{fontSize:28,marginBottom:4}}>{u.icon}</div>
      <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:4}}>{u.name}</div>
      <div style={{fontSize:12,color:C.neutral}}>{u.desc}</div>
    </div>
    <div className="sc" style={{display:"flex",gap:4,overflowX:"auto",marginBottom:12,paddingBottom:4}}>
      {[{id:"overview",label:"📊 Vue"},{id:"marques",label:"💄 Marques"},{id:"conseils",label:"💡 Conseils"}].map(t =>
        <button key={t.id} onClick={()=>setSub(t.id)} style={{flexShrink:0,padding:"6px 12px",borderRadius:8,border:"none",background:sub===t.id?u.color:"transparent",color:sub===t.id?"white":C.neutral,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.label}</button>
      )}
    </div>
    {sub === "overview" && <Card><SecTitle color={u.color}>Marques de cet univers</SecTitle><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(u.marques||[]).map((m,i) => <span key={i} onClick={()=>onOpen(m,"brand")} style={{background:u.color+"22",color:u.color,border:`1px solid ${u.color}44`,borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{m}</span>)}</div></Card>}
    {sub === "marques" && <Card><SecTitle color={u.color}>Explorer les marques</SecTitle>{(u.marques||[]).map((m,i) => <div key={i} onClick={()=>onOpen(m,"brand")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:i<u.marques.length-1?`1px solid ${C.border}`:"none",cursor:"pointer"}}><span style={{fontSize:13,fontWeight:600,color:C.text}}>{m}</span><span style={{fontSize:12,color:u.color}}>→</span></div>)}</Card>}
    {sub === "conseils" && <Card><SecTitle color={u.color}>Conseils terrain</SecTitle>{(u.tips||[]).map((t,i) => <div key={i} style={{fontSize:12,color:C.text,padding:"6px 0",borderBottom:`1px solid ${C.border}`,display:"flex",gap:8}}><span style={{color:u.color,fontWeight:700}}>›</span><span>{t}</span></div>)}</Card>}
  </div>;
}

// ─── MULTI COMPARATOR ────────────────────────────────────────────────────────
function MultiComp({ brandsData, labsData }: any) {
  const C = useContext(ThemeCtx);
  const all = useMemo(() => [
    ...Object.entries(brandsData||{}).map(([name,d]: any) => ({name,_type:"brand",...d})),
    ...Object.entries(labsData||{}).map(([name,d]: any) => ({name,_type:"lab",...d}))
  ], [brandsData, labsData]);
  const [sel, setSel] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const filtered = q.length > 1 ? all.filter(x => x.name.toLowerCase().includes(q.toLowerCase())) : all.slice(0, 8);
  const selItems = all.filter(x => sel.includes(x.name));
  const toggle = (name: string) => setSel(s => s.includes(name) ? s.filter(x => x !== name) : [...s.slice(-4), name]);
  return <Card>
    <SecTitle color="#6366f1">⚖️ Comparateur multi-marques</SecTitle>
    <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Chercher..." style={{width:"100%",padding:"8px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,background:C.bg,color:C.text,marginBottom:8,fontFamily:"DM Sans,sans-serif"}}/>
    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
      {filtered.map((x:any) => <button key={x.name} onClick={()=>toggle(x.name)} style={{padding:"4px 10px",borderRadius:99,fontSize:11,fontWeight:600,cursor:"pointer",border:"none",background:sel.includes(x.name)?(x.color||"#1a56db"):C.muted,color:sel.includes(x.name)?"white":C.neutral}}>{x.name}</button>)}
    </div>
    {selItems.length >= 2 ? <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
        <thead><tr>{["Marque","CA","Marge","Taux","Évol.","Statut"].map(hd => <th key={hd} style={{padding:"6px 8px",textAlign:"left",color:C.neutral,borderBottom:`1px solid ${C.border}`,fontWeight:600}}>{hd}</th>)}</tr></thead>
        <tbody>{selItems.map((x:any,i:number) => <tr key={i} style={{background:i%2===0?C.muted:"transparent"}}>
          <td style={{padding:"6px 8px",fontWeight:700,color:x.color||C.primary}}>{x.name}</td>
          <td style={{padding:"6px 8px"}}>{fmt(x.ca)}</td>
          <td style={{padding:"6px 8px"}}>{fmt(x.marge)}</td>
          <td style={{padding:"6px 8px",fontWeight:700,color:x.tx>=35?C.success:C.warning}}>{x.tx.toFixed(1)}%</td>
          <td style={{padding:"6px 8px",color:x.evol>=0?C.success:C.danger}}>{pct(x.evol)}</td>
          <td style={{padding:"6px 8px"}}><Badge status={x.status}/></td>
        </tr>)}</tbody>
      </table>
    </div> : <div style={{fontSize:12,color:C.neutral,textAlign:"center",padding:8}}>Sélectionnez 2 à 5 marques pour comparer</div>}
  </Card>;
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ brandsData, labsData, onOpen }: any) {
  const w = useWindowWidth();
  const isD = w >= 768;
  const C = useContext(ThemeCtx);
  const [showComp, setShowComp] = useState(false);
  const OTC_TVA = ["20","5.5","10"];
  const totalCA = useMemo(() => Object.values(brandsData).filter((d:any) => OTC_TVA.includes(d.tva)).reduce((s:number,d:any) => s+(d.ca||0), 0), [brandsData]);
  const totalMg = useMemo(() => Object.values(brandsData).filter((d:any) => OTC_TVA.includes(d.tva)).reduce((s:number,d:any) => s+(d.marge||0), 0), [brandsData]);
  const otcCount = useMemo(() => Object.values(brandsData).filter((d:any) => OTC_TVA.includes(d.tva)).length, [brandsData]);
  const shortcuts = ["Pileje","SVR","BIOGARAN","Avène","La Rosée","Cooper"];
  return <div style={{paddingBottom:24}}>
    <div style={{background:"linear-gradient(135deg,#0f3460 0%,#1a56db 60%,#06b6d4 100%)",borderRadius:isD?"16px":"0 0 24px 24px",padding:isD?"32px 32px":"24px 16px 28px",marginBottom:16,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.06)"}}/>
      <div style={{position:"relative"}}>
        <div style={{fontSize:20,fontWeight:800,color:"white",marginBottom:2}}>Bonjour 👋</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.7)",marginBottom:14}}>Analysez la performance de vos marques et labos</div>
        <SearchBar brandsData={brandsData} labsData={labsData} onOpen={onOpen}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:12}}>
          {shortcuts.map(s => <button key={s} onClick={()=>onOpen(s, brandsData[s]?"brand":"lab")} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:600,color:"white",cursor:"pointer"}}>{s}</button>)}
        </div>
      </div>
    </div>
    <div style={{padding:isD?"0 0":"0 12px"}}>
      <div style={{display:"grid",gridTemplateColumns:isD?"repeat(4,1fr)":"1fr 1fr",gap:8,marginBottom:12}}>
        <KPI label="CA OTC / Parapharmacie" value={fmt(totalCA)} color="#1a56db" sub={otcCount+" marques (hors médicaments)"}/>
        <KPI label="Marge totale" value={fmt(totalMg)} color="#10b981" sub={"Taux moy. "+(totalCA>0?((totalMg/totalCA)*100).toFixed(1):0)+"%"}/>
      </div>
      <div style={{marginBottom:12}}><WeeklyPriorities brandsData={brandsData} onOpen={onOpen}/></div>
      <button onClick={()=>setShowComp(v=>!v)} style={{width:"100%",padding:11,background:C.card,border:`1px solid ${C.border}`,borderRadius:10,fontSize:13,fontWeight:600,color:C.primary,cursor:"pointer",marginBottom:12}}>⚖️ {showComp?"Masquer":"Afficher"} le comparateur multi-marques</button>
      {showComp && <div style={{marginBottom:12}}><MultiComp brandsData={brandsData} labsData={labsData}/></div>}
      <div style={{marginBottom:12}}>
        <SecTitle color="#f59e0b">🌐 Univers produits</SecTitle>
        <div style={{display:"grid",gridTemplateColumns:isD?"repeat(4,1fr)":"1fr 1fr",gap:8}}>
          {UNIVERS.map(u => <UniversCard key={u.id} univers={u} onOpen={onOpen}/>)}
        </div>
      </div>
      <div style={{marginBottom:12}}><Card><Synthese brandsData={brandsData} onOpen={onOpen}/></Card></div>
      <Card><LabsSynthese labsData={labsData} onOpen={onOpen}/></Card>
    </div>
  </div>;
}

// ─── TABS STRIP ───────────────────────────────────────────────────────────────
function TabsStrip({ tabs, activeTab, onActivate, onClose }: any) {
  const C = useContext(ThemeCtx);
  if (!tabs.length) return null;
  return <div className="sc" style={{display:"flex",gap:4,overflowX:"auto",padding:"4px 12px",background:C.headerBg,borderBottom:`1px solid ${C.border}`}}>
    {tabs.map((t: any) => {
      const isActive = activeTab === t.id;
      return <div key={t.id} onClick={()=>onActivate(t.id)} style={{flexShrink:0,display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:8,cursor:"pointer",background:isActive?(t.color||C.primary)+"22":C.muted,border:`1px solid ${isActive?(t.color||C.primary)+"44":C.border}`,transition:"all 0.15s"}}>
        <span style={{fontSize:11,fontWeight:600,color:isActive?(t.color||C.primary):C.neutral,whiteSpace:"nowrap",maxWidth:80,overflow:"hidden",textOverflow:"ellipsis"}}>{t.type==="brand"?"💄":t.type==="lab"?"🏭":t.type==="univers"?"🌐":"📂"} {t.name}</span>
        <button onClick={e=>{e.stopPropagation();onClose(t.id);}} style={{border:"none",background:"none",cursor:"pointer",color:C.neutral,fontSize:13,padding:0,lineHeight:1,flexShrink:0,marginLeft:2}}>×</button>
      </div>;
    })}
  </div>;
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(false);
  const w = useWindowWidth();
  const isD = w >= 768;
  const C = dark ? TD : TL;
  const [view, setView] = useState("home");
  const [openTabs, setOpenTabs] = useState<any[]>([]);
  const [activeTabId, setActiveTabId] = useState<string|null>(null);
  const [brandsData, setBrandsData] = useState<Record<string,BrandData>>(BD);
  const [labsData, setLabsData] = useState<Record<string,LabData>>(LD);
  const [showSearch, setShowSearch] = useState(false);

  function openEntry(name: string, type: string) {
    if (type === "page" && name === "import") { setView("import"); setShowSearch(false); return; }
    const id = type+"_"+name;
    const d: any = brandsData[name] || labsData[name];
    const color = d?.color || "#1a56db";
    setOpenTabs(prev => { if (prev.find(t => t.id === id)) return prev; return [...prev, {id, name, type, color}]; });
    setActiveTabId(id); setView("tab"); setShowSearch(false);
  }

  function closeTab(id: string) {
    setOpenTabs(prev => {
      const next = prev.filter(t => t.id !== id);
      if (activeTabId === id) { if (next.length > 0) setActiveTabId(next[next.length-1].id); else { setActiveTabId(null); setView("home"); } }
      return next;
    });
  }

  function handleBrandsUpdate(map: any) {
    setBrandsData(prev => { const next = {...prev}; Object.keys(map).forEach(name => { if (next[name]) next[name] = {...next[name], ca:(next[name].ca||0)+map[name].ca, marge:(next[name].marge||0)+map[name].marge}; }); return next; });
  }
  function handleLabsUpdate(map: any) {
    setLabsData(prev => { const next = {...prev}; Object.keys(map).forEach(key => { const name = map[key].name || key; if (!next[name]) (next as any)[name] = {ca:map[key].ca,marge:map[key].marge,qte:map[key].qte||0,tx:map[key].ca>0?(map[key].marge/map[key].ca*100):0,evol:0,status:"stable",color:"#94a3b8",info:"",notes:[],actions:[],monthly:[],topProduits:[],segment:"autre",tva:"20",ca_n1:0,marge_n1:0}; }); return next; });
  }

  const activeTab = openTabs.find(t => t.id === activeTabId);

  return <ThemeCtx.Provider value={C}>
    <style>{`
      *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
      html,body{height:100%;background:${C.bg};font-family:'DM Sans',system-ui,sans-serif}
      :root{--safe-bottom:env(safe-area-inset-bottom,0px)}
      body{overscroll-behavior:none}
      .sc::-webkit-scrollbar{display:none}
      .sc{-ms-overflow-style:none;scrollbar-width:none}
      input,button{font-family:'DM Sans',system-ui,sans-serif}
      @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      .fade{animation:fadeIn 0.2s ease}
      input[type=range]{-webkit-appearance:none;width:100%;height:6px;border-radius:3px;background:#e2e8f0;outline:none;cursor:pointer}
      input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#1a56db;cursor:pointer;box-shadow:0 2px 6px rgba(26,86,219,0.4)}
    `}</style>
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"DM Sans,sans-serif",position:"relative"}}>
      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:100,background:C.headerBg,borderBottom:`1px solid ${C.border}`,boxShadow:`0 1px 8px ${C.shadow}`}}>
        <div style={{maxWidth:isD?960:600,margin:"0 auto",display:"flex",alignItems:"center",gap:8,padding:isD?"12px 24px":"10px 12px"}}>
          {view !== "home" && <button onClick={()=>{setView("home");setShowSearch(false);}} style={{border:"none",background:C.muted,borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:16,color:C.text,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>}
          <div style={{flex:1,display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:28,height:28,borderRadius:6,background:"linear-gradient(135deg,#10b981,#1a56db)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>💊</div>
            <span style={{fontSize:14,fontWeight:800,color:C.text}}>PharmaScope</span>
            <span style={{fontSize:10,color:C.primary,fontWeight:600,background:C.primary+"22",borderRadius:4,padding:"1px 5px",marginLeft:2}}>v3</span>
          </div>
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>setShowSearch(v=>!v)} style={{border:"none",background:C.muted,borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:15,color:C.text}}>🔍</button>
            <button onClick={()=>setView("import")} style={{border:"none",background:C.muted,borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:15,color:C.text}}>📂</button>
            <button onClick={()=>setDark(v=>!v)} style={{border:"none",background:C.muted,borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:15,color:C.text}}>{dark?"☀️":"🌙"}</button>
          </div>
        </div>
        {!isD && openTabs.length > 0 && <TabsStrip tabs={openTabs} activeTab={activeTabId} onActivate={(id:string)=>{setActiveTabId(id);setView("tab");}} onClose={closeTab}/>}
      </div>
      {/* Desktop top nav */}
      {isD && <div style={{background:C.headerBg,borderBottom:`1px solid ${C.border}`}}>
        <div style={{maxWidth:960,margin:"0 auto",display:"flex",alignItems:"center",gap:8,padding:"10px 24px"}}>
          {[{id:"home",icon:"🏠",label:"Accueil"},{id:"import",icon:"📂",label:"Importer"}].map(n => {
            const active = view === n.id;
            return <button key={n.id} onClick={()=>{setView(n.id);setShowSearch(false);}} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,border:"none",background:active?C.primary+"18":"transparent",cursor:"pointer",fontSize:13,fontWeight:active?700:500,color:active?C.primary:C.neutral}}><span>{n.icon}</span><span>{n.label}</span></button>;
          })}
          <div style={{flex:1}}/>
          {openTabs.length > 0 && <div className="sc" style={{display:"flex",gap:4,overflowX:"auto",maxWidth:400}}>
            {openTabs.map((t:any) => {
              const ia = activeTabId === t.id;
              return <div key={t.id} onClick={()=>{setActiveTabId(t.id);setView("tab");}} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:8,cursor:"pointer",background:ia?(t.color||C.primary)+"22":C.muted,border:`1px solid ${ia?(t.color||C.primary)+"44":C.border}`,flexShrink:0}}>
                <div style={{width:7,height:7,borderRadius:99,background:t.color||C.primary,flexShrink:0}}/>
                <span style={{fontSize:11,fontWeight:ia?700:400,color:ia?(t.color||C.primary):C.neutral,maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.type==="brand"?"💄 ":t.type==="lab"?"🏭 ":"🌐 "}{t.name}</span>
                <button onClick={e=>{e.stopPropagation();closeTab(t.id);}} style={{border:"none",background:"none",cursor:"pointer",color:C.neutral,fontSize:12,padding:0,lineHeight:1,flexShrink:0}}>×</button>
              </div>;
            })}
          </div>}
          <button onClick={()=>setShowSearch(v=>!v)} style={{border:"none",background:C.muted,borderRadius:8,padding:"7px 10px",cursor:"pointer",fontSize:14,color:C.text}}>🔍</button>
          <button onClick={()=>setDark(v=>!v)} style={{border:"none",background:C.muted,borderRadius:8,padding:"7px 10px",cursor:"pointer",fontSize:14}}>{dark?"☀️":"🌙"}</button>
        </div>
      </div>}
      {/* Search overlay */}
      {showSearch && <div onClick={()=>setShowSearch(false)} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(4px)"}}>
        <div onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:isD?12:"0 0 20px 20px",padding:isD?24:16,boxShadow:`0 8px 32px ${C.shadow}`,maxWidth:isD?520:"100%",margin:isD?"60px auto 0":0}}>
          <SearchBar brandsData={brandsData} labsData={labsData} onOpen={openEntry} autoFocus/>
        </div>
      </div>}
      {/* Main content */}
      <div style={{paddingBottom:isD?"24px":"calc(80px + var(--safe-bottom))",minHeight:"100vh"}}>
        <div style={{maxWidth:isD?960:600,margin:"0 auto",position:"relative"}}>
          {view === "home" && <HomePage brandsData={brandsData} labsData={labsData} onOpen={openEntry} dark={dark}/>}
          {view === "import" && <div style={{padding:isD?"0":12}}><ImportTab onBrandsUpdate={handleBrandsUpdate} onLabsUpdate={handleLabsUpdate}/></div>}
          {view === "tab" && activeTab && <div style={{padding:isD?"0":12}} className="fade">
            {activeTab.type === "brand" && <BrandDetail name={activeTab.name} brandsData={brandsData} labsData={labsData} onGoImport={()=>setView("import")} dark={dark}/>}
            {activeTab.type === "lab" && <LabDetail name={activeTab.name} labsData={labsData} onGoImport={()=>setView("import")} dark={dark}/>}
            {activeTab.type === "univers" && <UniversDetail id={activeTab.name} onOpen={openEntry}/>}
          </div>}
        </div>
      </div>
      {/* Bottom nav (mobile only) */}
      {!isD && <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:600,background:C.navBg,borderTop:`1px solid ${C.border}`,paddingBottom:"var(--safe-bottom)",boxShadow:`0 -2px 16px ${C.shadow}`,zIndex:100}}>
        <div style={{display:"flex",justifyContent:"space-around",padding:"8px 0"}}>
          {[{id:"home",icon:"🏠",label:"Accueil"},{id:"univers",icon:"🌐",label:"Univers"},{id:"import",icon:"📂",label:"Import"},{id:"search",icon:"🔍",label:"Recherche"}].map(n => {
            const isActive = (n.id==="search"&&showSearch)||(n.id!=="search"&&view===n.id);
            return <button key={n.id} onClick={()=>{if(n.id==="search")setShowSearch(v=>!v);else if(n.id==="home")setView("home");else if(n.id==="import")setView("import");else setView("home");}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,border:"none",background:"none",cursor:"pointer",padding:"4px 8px",minWidth:44,opacity:isActive?1:0.55,transition:"opacity 0.15s"}}>
              <span style={{fontSize:19}}>{n.icon}</span>
              <span style={{fontSize:9,fontWeight:600,color:isActive?C.primary:C.neutral}}>{n.label}</span>
            </button>;
          })}
        </div>
      </div>}
    </div>
  </ThemeCtx.Provider>;
}
