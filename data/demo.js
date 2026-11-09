/* PharmaScope : DONNEES DE DEMONSTRATION (pharmacie fictive \u00ab Pharmacie des Tilleuls \u00bb).
   Tout est invente et calcule dans le navigateur a partir d'un tirage au hasard fixe (toujours les memes chiffres) :
   aucun chiffre, aucun produit, aucun nom de l'equipe d'une vraie pharmacie. Les noms de laboratoires sont des
   marques connues du grand public, pour que la demonstration soit parlante. Les dates suivent le jour d'ouverture. */
(function(){
"use strict";
var seed=20261109;
function rnd(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
function entre(a,b){return a+(b-a)*rnd()}
function ent(a,b){return Math.floor(entre(a,b+1))}
function choix(t){return t[Math.floor(rnd()*t.length)]}
function r1(x){return Math.round(x*10)/10}
function r2(x){return Math.round(x*100)/100}
function iso(d){return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)}
var auj=new Date();auj.setHours(12,0,0,0);
var hier=new Date(auj);hier.setDate(hier.getDate()-1);if(hier.getDay()===0)hier.setDate(hier.getDate()-1);
/* 13 mois : du meme mois l'an dernier au mois en cours (partiel) */
var M=[],moisCal=[];for(var i=12;i>=0;i--){var d=new Date(auj.getFullYear(),auj.getMonth()-i,1);M.push(d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2));moisCal.push(d.getMonth())}
function joursOuvres(y,m,jusqua){var n=0;var fin=new Date(y,m+1,0).getDate();for(var j=1;j<=fin;j++){var d=new Date(y,m,j);if(jusqua&&d>jusqua)break;if(d.getDay()!==0)n++}return n}
var JOURS=M.map(function(mm,i){var p=mm.split("-");return joursOuvres(+p[0],+p[1]-1,i===12?hier:null)});
var FRAC=JOURS.map(function(j,i){var p=M[i].split("-");return j/Math.max(1,joursOuvres(+p[0],+p[1]-1,null))});
var SAISONS={plat:[1,1,1,1,1,1,1,1,1,1,1,1],hiver:[1.6,1.5,1.2,0.9,0.7,0.55,0.5,0.6,0.9,1.3,1.6,1.8],ete:[0.3,0.3,0.6,0.9,1.4,2.1,2.5,2.0,0.8,0.4,0.3,0.4],printemps:[0.6,0.8,1.5,1.9,1.7,1.2,0.8,0.7,0.8,0.7,0.6,0.6],fetes:[0.8,0.8,0.9,0.9,1,0.9,0.8,0.9,1,1.1,1.5,2.2]};
/* Catalogue invente : [labo, univers, tva, nb produits, prix min, prix max, taux de marge, modeles de noms, saison] */
var GEN=["PARACETAMOL 1G CPR 8","AMOXICILLINE 1G CPR 6","ATORVASTATINE 20MG CPR 30","METFORMINE 850MG CPR 30","OMEPRAZOLE 20MG GELU 28","RAMIPRIL 5MG GELU 30","LEVOTHYROXINE 75UG CPR 30","AMLODIPINE 5MG GELU 30","IBUPROFENE 400MG CPR 30","PANTOPRAZOLE 40MG CPR 28","BISOPROLOL 5MG CPR 30","ESCITALOPRAM 10MG CPR 28","ROSUVASTATINE 10MG CPR 30","LOSARTAN 50MG CPR 30","TRAMADOL 50MG GELU 30","CETIRIZINE 10MG CPR 15","DESLORATADINE 5MG CPR 30","ZOLPIDEM 10MG CPR 14","FUROSEMIDE 40MG CPR 30","PREDNISOLONE 20MG CPR 20","AZITHROMYCINE 250MG CPR 6","SERTRALINE 50MG GELU 28","TAMSULOSINE 0,4MG GELU 30","ALLOPURINOL 100MG CPR 28","CLOPIDOGREL 75MG CPR 30","APIXABAN 5MG CPR 60","FOSFOMYCINE 3G SACHET","DOXYCYCLINE 100MG CPR 10","VALSARTAN 80MG CPR 30","LANSOPRAZOLE 30MG GELU 28"];
var PRINC=["ANTICOAGULANT 20MG CPR 28","INHALATEUR ASTHME 120 DOSES","STYLO INSULINE 100UI/ML X5","ANTIDIABETIQUE 100MG CPR 28","ANTIHYPERTENSEUR 10MG CPR 90","COLLYRE GLAUCOME 2,5ML","PATCH ANTALGIQUE X5","ANTIDEPRESSEUR 20MG CPR 28","TRAITEMENT THYROIDE 100UG CPR 90","ANTIHISTAMINIQUE SIROP 120ML"];
var CHER=["TRAITEMENT CIBLE 150MG CPR 56","BIOTHERAPIE 40MG STYLO X2","ANTIVIRAL 400MG CPR 28"];
var OTC_H=["SIROP TOUX SECHE 150ML","PASTILLES GORGE MIEL CITRON 24","SPRAY NASAL DECONGESTIONNANT 15ML","SOLUTION NASALE EAU DE MER 100ML","PARACETAMOL VITAMINE C SACHETS 8","COMPRIMES RHUME 16","SIROP TOUX GRASSE 200ML","PASTILLES EUCALYPTUS 32"];
var OTC=["GEL ANTIDOULEUR 100G","PANSEMENT GASTRIQUE SACHETS 20","ANTIDIARRHEIQUE GELU 12","LAXATIF DOUX SACHETS 20","CREME CICATRISANTE 50G","COLLYRE APAISANT UNIDOSES 10","BAUME ARNICA 50G","ANTIACIDE CPR A CROQUER 24"];
var DERMO=["CREME HYDRATANTE 40ML","GEL NETTOYANT 400ML","SERUM ANTI-AGE 30ML","BAUME LEVRES 15ML","EAU MICELLAIRE 400ML","CREME MAINS 50ML","LAIT CORPS 400ML","CREME RICHE NUIT 50ML","SOIN CONTOUR YEUX 15ML","HUILE LAVANTE 1L","BAUME RELIPIDANT 400ML","CREME APAISANTE 50ML","SOIN ANTI-IMPERFECTIONS 40ML","DEODORANT 48H 50ML","SHAMPOOING DOUX 400ML"];
var SOL=["ECRAN SPF50+ CREME 50ML","SPRAY SOLAIRE SPF50+ 200ML","FLUIDE INVISIBLE SPF50+ 50ML","APRES-SOLEIL 200ML","SPRAY ENFANT SPF50+ 200ML"];
var COMPL=["MAGNESIUM B6 60 CPR","PROBIOTIQUES 30 GELULES","VITAMINE D3 GOUTTES 20ML","OMEGA 3 60 CAPSULES","SOMMEIL MELATONINE 30 CPR","ARTICULATIONS 90 CPR","FER VITAMINE C 30 GELU","CHEVEUX ONGLES 90 GELU","MINCEUR DRAINAGE 20 AMP","DEFENSES IMMUNITAIRES 30 GELU","STRESS 60 GELULES","TRANSIT 30 GELULES"];
var BEBE=["LAIT 1ER AGE 800G","LAIT 2EME AGE 800G","LAIT CROISSANCE 900G","CREME CHANGE 100ML","EAU NETTOYANTE BEBE 500ML","GEL LAVANT BEBE 500ML","LINIMENT 400ML"];
var BUCCO=["DENTIFRICE SENSIBILITE 75ML","BAIN DE BOUCHE 300ML","BROSSETTES INTERDENTAIRES X8","BROSSE A DENTS SOUPLE","DENTIFRICE BLANCHEUR 75ML","FIL DENTAIRE 50M","GEL GENCIVES 15ML"];
var ORTHO=["CHAUSSETTES CONTENTION CL2","BAS CONTENTION CL2","ATTELLE POIGNET","GENOUILLERE LIGAMENTAIRE","CEINTURE LOMBAIRE","CHEVILLERE ELASTIQUE"];
var SOINS=["PANSEMENTS ASSORTIS X20","COMPRESSES STERILES X50","PANSEMENT HYDROCOLLOIDE X5","BANDE ELASTIQUE 10CM","SPRAY DESINFECTANT 100ML","STRIPS SUTURE X10"];
var MAT=["TENSIOMETRE POIGNET","THERMOMETRE FRONTAL","OXYMETRE DE POULS","TEST GROSSESSE X2","AUTOTEST COVID X5"];
var ANTIP=["SPRAY ANTI-MOUSTIQUES 100ML","LOTION ANTIPOUX 100ML","SPRAY ANTI-TIQUES 100ML","ROLL-ON APRES PIQURE 15ML"];
var CAT=[
["BIOGARAN","M\u00e9dicaments rembours\u00e9s","2.1",30,2,14,0.30,GEN,"plat"],["VIATRIS GENERIQUES","M\u00e9dicaments rembours\u00e9s","2.1",18,2,14,0.30,GEN,"plat"],["SANDOZ","M\u00e9dicaments rembours\u00e9s","2.1",14,2,14,0.28,GEN,"plat"],["ARROW GENERIQUES","M\u00e9dicaments rembours\u00e9s","2.1",12,2,14,0.28,GEN,"plat"],
["SANOFI","M\u00e9dicaments rembours\u00e9s","2.1",8,6,60,0.12,PRINC,"plat"],["PFIZER","M\u00e9dicaments rembours\u00e9s","2.1",6,8,80,0.11,PRINC,"plat"],["NOVARTIS PHARMA","M\u00e9dicaments rembours\u00e9s","2.1",6,8,90,0.10,PRINC,"plat"],["ASTRAZENECA","M\u00e9dicaments rembours\u00e9s","2.1",6,10,70,0.10,PRINC,"plat"],["BOEHRINGER INGELHEIM","M\u00e9dicaments rembours\u00e9s","2.1",5,10,70,0.10,PRINC,"plat"],["MSD FRANCE","M\u00e9dicaments rembours\u00e9s","2.1",3,900,2800,0.015,CHER,"plat"],
["OPELLA HEALTHCARE","M\u00e9dicaments conseil (OTC)","10.0",8,4,12,0.34,OTC_H,"hiver"],["UPSA","M\u00e9dicaments conseil (OTC)","10.0",6,3,9,0.32,OTC_H,"hiver"],["COOPER","M\u00e9dicaments conseil (OTC)","10.0",8,3,10,0.38,OTC,"plat"],["PIERRE FABRE MEDICAMENT","M\u00e9dicaments conseil (OTC)","10.0",6,4,12,0.33,OTC,"plat"],["BOIRON","M\u00e9dicaments conseil (OTC)","10.0",8,3,9,0.35,OTC_H,"hiver"],
["AVENE","Dermocosm\u00e9tique","20.0",14,8,32,0.40,DERMO,"plat"],["LA ROCHE POSAY","Dermocosm\u00e9tique","20.0",16,8,35,0.38,DERMO,"plat"],["BIODERMA","Dermocosm\u00e9tique","20.0",12,7,28,0.39,DERMO,"plat"],["VICHY","Dermocosm\u00e9tique","20.0",10,10,38,0.38,DERMO,"plat"],["NUXE","Dermocosm\u00e9tique","20.0",10,10,40,0.42,DERMO,"fetes"],["CAUDALIE","Dermocosm\u00e9tique","20.0",9,12,42,0.41,DERMO,"fetes"],["URIAGE","Dermocosm\u00e9tique","20.0",10,7,26,0.40,DERMO,"plat"],["CERAVE","Dermocosm\u00e9tique","20.0",8,9,22,0.33,DERMO,"plat"],["SVR","Dermocosm\u00e9tique","20.0",8,8,28,0.41,DERMO,"plat"],
["SOLAIRES LABO DU SOLEIL","Solaires","20.0",5,12,24,0.42,SOL,"ete"],
["ARKOPHARMA","Compl\u00e9ments alimentaires","5.5",12,8,25,0.45,COMPL,"plat"],["PILEJE","Compl\u00e9ments alimentaires","5.5",10,12,35,0.43,COMPL,"plat"],["NUTERGIA","Compl\u00e9ments alimentaires","5.5",8,12,30,0.44,COMPL,"plat"],["GRANIONS","Compl\u00e9ments alimentaires","5.5",8,9,24,0.42,COMPL,"plat"],["FORTE PHARMA","Compl\u00e9ments alimentaires","5.5",8,8,22,0.40,COMPL,"plat"],
["GALLIA","B\u00e9b\u00e9 & Pu\u00e9riculture","5.5",5,14,28,0.18,BEBE,"plat"],["MUSTELA","B\u00e9b\u00e9 & Pu\u00e9riculture","20.0",6,6,16,0.40,BEBE,"plat"],
["ELGYDIUM","Hygi\u00e8ne bucco-dentaire","20.0",6,3,9,0.40,BUCCO,"plat"],["GUM SUNSTAR","Hygi\u00e8ne bucco-dentaire","20.0",6,3,8,0.42,BUCCO,"plat"],["PARODONTAX","Hygi\u00e8ne bucco-dentaire","20.0",4,4,7,0.33,BUCCO,"plat"],
["THUASNE","Orthop\u00e9die & contention","20.0",6,20,60,0.45,ORTHO,"plat"],["SIGVARIS","Orthop\u00e9die & contention","5.5",5,25,55,0.50,ORTHO,"ete"],
["URGO","Pansements & soin des plaies","20.0",6,3,12,0.38,SOINS,"plat"],["HARTMANN","Pansements & soin des plaies","20.0",5,3,10,0.35,SOINS,"plat"],
["OMRON","Mat\u00e9riel m\u00e9dical & autodiagnostic","20.0",4,10,70,0.30,MAT,"plat"],["CINQ SUR CINQ","Antiparasitaires & r\u00e9pulsifs","20.0",4,6,14,0.40,ANTIP,"ete"]];
var ICONES={"Dermocosm\u00e9tique":"sparkles","Solaires":"sun","Compl\u00e9ments alimentaires":"pill","B\u00e9b\u00e9 & Pu\u00e9riculture":"baby","Hygi\u00e8ne bucco-dentaire":"smile","Orthop\u00e9die & contention":"bone","Pansements & soin des plaies":"bandage","Mat\u00e9riel m\u00e9dical & autodiagnostic":"activity","Antiparasitaires & r\u00e9pulsifs":"bug","M\u00e9dicaments conseil (OTC)":"heart"};
var VENDEURS=["Claire","Thomas","Julie","Marc","Sophie","Lucas","Emma"];
var POIDS_V=[0.20,0.16,0.18,0.14,0.13,0.11,0.08];
var P={},L={},MAP={},U={},TVA={"2.1":{},"5.5":{},"10.0":{},"20.0":{}},V={},STKU={},STKV={},LD={},STOCK={},RX_SUP=[];
var G=M.map(function(){return[0,0]});
var code=2000000000000;
M.forEach(function(mm){Object.keys(TVA).forEach(function(t){TVA[t][mm]=0})});
VENDEURS.forEach(function(v){V[v]={}});
CAT.forEach(function(c){var lab=c[0],univ=c[1],tva=c[2],n=c[3],pmin=c[4],pmax=c[5],tx=c[6],noms=c[7],sais=SAISONS[c[8]];
var prods=[],noms2={};
for(var k=0;k<n;k++){var base=noms[(k+ent(0,noms.length-1))%noms.length];var nom=(lab.split(" ")[0]+" "+base).slice(0,48);if(noms2[nom])nom=nom+" X"+(k+2);noms2[nom]=1;
var prix=r2(entre(pmin,pmax));var vol=Math.max(0.3,Math.exp(entre(-0.5,2.6))*(prix>500?0.08:(prix>40?0.5:1))*(univ==="M\u00e9dicaments rembours\u00e9s"?(prix>500?6:16):2.6));
var tend=entre(-0.25,0.35);var txp=Math.max(0.01,tx+entre(-0.06,0.06));
var qm=[],caM=[],mM=[];
for(var i=0;i<13;i++){var f=sais[moisCal[i]]*(1+tend*(i-6)/12)*entre(0.75,1.25)*FRAC[i];var q=Math.max(0,Math.round(vol*f*entre(0.8,1.2)));qm.push(q);caM.push(r1(q*prix));mM.push(r1(q*prix*txp))}
code++;var cs=String(code);var q=0,ca=0,m=0;for(var j=0;j<13;j++){q+=qm[j];ca+=caM[j];m+=mM[j];G[j][0]+=caM[j];G[j][1]+=mM[j];TVA[tva][M[j]]+=caM[j]}
prods.push({c:cs,n:nom,ca:r1(ca),m:r1(m),q:q,qm:qm,caM:caM,mM:mM,tva:+tva});
var stk=Math.max(0,Math.round(vol*entre(0.4,3)));if(rnd()<0.08)stk+=ent(6,20);STKU[cs]=stk;STKV[cs]=r2(stk*prix*(1-txp))}
prods.sort(function(a,b){return b.ca-a.ca});P[lab]=prods;MAP[lab]=[lab];
var Lm=[];for(var i2=0;i2<13;i2++){var a=0,b=0,cq=0;prods.forEach(function(p){a+=p.caM[i2];b+=p.mM[i2];cq+=p.qm[i2]});Lm.push([r1(a),r1(b),cq])}L[lab]=Lm;
if(univ==="M\u00e9dicaments rembours\u00e9s")RX_SUP.push(lab);
else{if(!U[univ])U[univ]={obj:ent(30,45),icon:ICONES[univ]||"sparkles",labs:[]};U[univ].labs.push(lab)}
VENDEURS.forEach(function(v,iv){var o={};M.forEach(function(mm,j){o[mm]=Math.round(Lm[j][2]*POIDS_V[iv]*entre(0.7,1.3))});V[v][lab]=o});
var ca12=0,m12=0,q12=0;for(var x=1;x<13;x++){ca12+=Lm[x][0];m12+=Lm[x][1];q12+=Lm[x][2]}
var caN1=ca12*entre(0.82,1.12),mN1=m12*entre(0.82,1.12),qN1=Math.round(q12*entre(0.85,1.1));
var sv=0,sq=0;prods.forEach(function(p){sv+=STKV[p.c];sq+=STKU[p.c]});
LD[lab]={ca:r2(ca12),ca_n1:r2(caN1),marge:r2(m12),marge_n1:r2(mN1),qte:q12,qte_n1:qN1,tx:ca12?r2(m12/ca12):0,evol_ca:caN1?r1((ca12/caN1-1)*100):0,evol_qte:qN1?r1((q12/qN1-1)*100):0,stock:r2(sv),status:ca12>caN1*1.05?"croissance":(ca12<caN1*0.95?"declin":"stable")};
STOCK[lab]={total_ht:r2(sv),total_qty:sq,nb_refs:prods.length}});
/* honoraires et prestations (codes internes) */
var HON=[["-18","HONORAIRE MEDICAMENTS SPECIFIQUES",3.5,900],["-16","HONORAIRE ORDONNANCE",0.6,2600],["-17","HONORAIRE AGE",1.6,700],["1","INJECTION VACCIN",7.5,60]];
P["HONORAIRES"]=HON.map(function(h){var qm=[],caM=[];for(var i=0;i<13;i++){var q=Math.round(h[3]*entre(0.85,1.15)*FRAC[i]*(h[0]==="1"?SAISONS.hiver[moisCal[i]]:1));qm.push(q);caM.push(r1(q*h[2]))}
var q=0,ca=0;qm.forEach(function(x,i){q+=x;ca+=caM[i];G[i][0]+=caM[i];G[i][1]+=caM[i];TVA[h[0]==="1"?"20.0":"2.1"][M[i]]+=caM[i]});
return{c:h[0],n:h[1],ca:r1(ca),m:r1(ca),q:q,qm:qm,caM:caM,mM:caM.slice(),tva:h[0]==="1"?0:2.1}});
L["HONORAIRES"]=M.map(function(mm,i){var a=0,q=0;P["HONORAIRES"].forEach(function(p){a+=p.caM[i];q+=p.qm[i]});return[r1(a),r1(a),q]});MAP["HONORAIRES"]=["HONORAIRES"];
G=G.map(function(g){return[r1(g[0]),r1(g[1])]});
Object.keys(TVA).forEach(function(t){M.forEach(function(mm){TVA[t][mm]=r1(TVA[t][mm])})});
var FREQ=[],F={};
M.forEach(function(mm,i){var t=Math.round(G[i][0]/entre(38,46));FREQ.push([t,JOURS[i]]);F[mm]={ventes:t,ca:G[i][0],marge:G[i][1],moy_jour:JOURS[i]?r1(G[i][0]/JOURS[i]):0,panier:t?r2(G[i][0]/t):0,jours:JOURS[i]}});
/* activite heure par heure des 70 derniers jours (accueil, Aujourd'hui, Ma semaine) */
var HEAT={};var caJour=G[11][0]/Math.max(1,JOURS[11]);var txJ=G[11][1]/Math.max(1,G[11][0]);
var FORME=[0,0,0,0,0,0,0,0,0.04,0.08,0.10,0.10,0.07,0.05,0.07,0.09,0.10,0.10,0.09,0.07,0.04,0,0,0];
for(var dj=70;dj>=1;dj--){var d=new Date(auj);d.setDate(d.getDate()-dj);if(d.getDay()===0)continue;var sam=d.getDay()===6;
var tot=caJour*entre(0.75,1.3)*(sam?0.75:1);var c=[],tk=[],mg=[];
for(var h=0;h<24;h++){var part=FORME[h]*(sam&&h>=18?0.3:1)*entre(0.7,1.3);var x=tot*part;c.push(r1(x));var nt=Math.round(x/entre(36,48));tk.push(nt);mg.push(r1(x*txJ*entre(0.85,1.15)))}
HEAT[iso(d)]={c:c,t:tk,m:mg,v:3}}
var PROMO=[{start:M[10]+"-01",end:M[11]+"-15",label:"Promo hiver",count:6,products:P["OPELLA HEALTHCARE"].slice(0,3).concat(P["ARKOPHARMA"].slice(0,3)).map(function(p,i){return{p:p.n,l:i<3?"OPELLA HEALTHCARE":"ARKOPHARMA",u:"PROMO",pt:r2(p.ca/Math.max(1,p.q)*1.2),pr:r2(p.ca/Math.max(1,p.q)),r:ent(15,30),ean:p.c}})}];
var TIPS=[{cat:"marge",tip:"La dermocosm\u00e9tique p\u00e8se 38 % de votre marge parapharmacie : une t\u00eate de gondole Nuxe avant les f\u00eates rapporte en moyenne +25 % de ventes sur la gamme.",action:"Voir Nuxe",saison:null},{cat:"stock",tip:"12 r\u00e9f\u00e9rences de compl\u00e9ments n'ont pas boug\u00e9 depuis 90 jours : un retour labo ou une mise en avant lib\u00e9rerait environ 900 \u20ac de stock.",action:"Stock dormant",saison:null},{cat:"saison",tip:"Pic de rhumes attendu dans 3 semaines : v\u00e9rifiez le stock des sirops et des solutions nasales.",action:"M\u00e9t\u00e9o de la demande",saison:"hiver"}];
var PD={M:M,G:G,FREQ:FREQ,F:F,TVA:TVA,P:P,L:L,V:V,RX:[],D:[],MAP:MAP,U:U,REF:[],RX_SUP:RX_SUP,TIPS:TIPS,CAL:[],PROMO:PROMO,S:{},SD:{},CMD:{},HEAT:HEAT,STKU:STKU,STKV:STKV};
/* donnees \u00ab cloud \u00bb de la demonstration (restent dans le navigateur, jamais envoyees) */
function jPlus(n){var d=new Date(auj);d.setDate(d.getDate()+n);return iso(d)}
var tache=function(id,t,qui,ech,prio){return{id:"demo-"+id,title:t,desc:"",done:false,created:jPlus(-3),creePar:"Claire",assignee:qui,priority:prio||"normale",echeance:ech}};
var CLOUD={
team:[{id:1,name:"Claire",fn:"Pharmacien titulaire"},{id:2,name:"Thomas",fn:"Pharmacien titulaire"},{id:3,name:"Julie",fn:"Pharmacien adjoint"},{id:4,name:"Marc",fn:"Pr\u00e9parateur"},{id:5,name:"Sophie",fn:"Pr\u00e9paratrice"},{id:6,name:"Lucas",fn:"Pr\u00e9parateur"},{id:7,name:"Emma",fn:"Apprentie"}],
tasks:[tache(1,"Contr\u00f4le des p\u00e9remptions : rayon solaires","Marc",jPlus(0),"haute"),tache(2,"Mettre en place la t\u00eate de gondole Nuxe","Sophie",jPlus(1)),tache(3,"Balance des stup\u00e9fiants","Julie",jPlus(0)),tache(4,"Commander les lots de f\u00eates Caudalie","Claire",jPlus(2)),tache(5,"Relancer le grossiste pour les ruptures","Lucas",jPlus(-1),"haute")],
challenges:[{id:1,lab:"ARKOPHARMA",eans:P["ARKOPHARMA"].slice(0,4).map(function(p){return p.c}),produit:"4 produit(s) cible(s)",debut:M[12]+"-01",fin:jPlus(18),objectif:120,progres:46,active:true,assignee:"Julie",created:jPlus(-8)},{id:2,lab:"NUXE",eans:P["NUXE"].slice(0,3).map(function(p){return p.c}),produit:"3 produit(s) cible(s)",debut:jPlus(-10),fin:jPlus(30),objectif:80,progres:21,active:true,assignee:"Sophie",created:jPlus(-10)}],
tdgs:[{id:1,lab:"NUXE",debut:jPlus(-6),fin:jPlus(15),statut:"en_cours",notes:"Coffrets de f\u00eates",produits:P["NUXE"].slice(0,4).map(function(p){return{c:p.c,n:p.n,lab:"NUXE"}}),checks:[{done:true,label:"ILV en place"},{done:true,label:"Balisage prix"},{done:false,label:"Facing correct"}],facing:0,produit:""},{id:2,lab:"OPELLA HEALTHCARE",debut:jPlus(-20),fin:jPlus(-1),statut:"termine",notes:"Hiver ORL",produits:P["OPELLA HEALTHCARE"].slice(0,3).map(function(p){return{c:p.c,n:p.n,lab:"OPELLA HEALTHCARE"}}),checks:[],facing:0,produit:""}],
ca_objectif:(function(){var o={};var mm=M[12];o[mm]=Math.round(G[11][0]*1.05/1000)*1000;o["marge:"+mm]=Math.round(G[11][1]*1.05/100)*100;return o})(),
widgets_config:["ca_mois","ca_n1","marge_jour","marge_n1","nb_ventes","objectif_marge"]};
var jh=PD.HEAT[iso(hier)]||{c:[],m:[],t:[]};var sm=function(t){return t.reduce(function(x,y){return x+y},0)};
var RESUME={v:1,jour:iso(auj),cree:new Date(auj.getTime()-4*3600e3).toISOString(),redige:true,mails:"ok",
titre:"Matin\u00e9e charg\u00e9e c\u00f4t\u00e9 labos, apr\u00e8s-midi plus calme pour avancer sur les commandes de f\u00eates",journee:["Semaine de la t\u00eate de gondole Nuxe"],
moments:[{quand:"Matin",plage:"9h30-11h",texte:"RDV avec la d\u00e9l\u00e9gu\u00e9e Nuxe \u00e0 9h30, puis point coffrets de f\u00eates avec Sophie."},{quand:"Milieu de journ\u00e9e",plage:"12h30-13h30",texte:"D\u00e9jeuner formation \u00e9quipe : nouveaux compl\u00e9ments sommeil."},{quand:"Fin de journ\u00e9e",plage:"",texte:"Rien de pr\u00e9vu \u00e0 l'agenda."}],
attend:[{titre:"Commande Caudalie : franco presque atteint",texte:"La d\u00e9l\u00e9gu\u00e9e Caudalie (hier, 17h) : il manque 45 \u20ac pour le franco de 300 \u20ac ; elle propose d'ajouter deux coffrets.",fil:null},{titre:"Facture grossiste \u00e0 v\u00e9rifier",texte:"Le grossiste (ce matin) : une remise de fin de mois semble manquer sur la facture d'octobre.",fil:null},{titre:"Sans r\u00e9ponse : retour produits Arkopharma",texte:"Demande envoy\u00e9e jeudi au service client pour un retour de 6 bo\u00eetes p\u00e9rim\u00e9es, pas encore de r\u00e9ponse.",fil:null}],
regle:[{titre:"Livraison Pileje re\u00e7ue",texte:"Le colis attendu est arriv\u00e9 hier apr\u00e8s-midi, complet.",fil:null},{titre:"Planning de d\u00e9cembre valid\u00e9",texte:"Julie a confirm\u00e9 ses gardes du mois.",fil:null}],
pharmacie:[{ic:"\ud83d\udcb6",t:"Marge d'hier : "+Math.round(sm(jh.m))+" \u20ac",d:"CA "+Math.round(sm(jh.c))+" \u20ac \u00b7 "+sm(jh.t)+" clients",page:"home"},{ic:"\ud83d\udce6",t:"3 labos \u00e0 commander",d:"BIOGARAN, PILEJE, URGO",page:"commandes"},{ic:"\u2705",t:"2 t\u00e2ches \u00e0 faire aujourd'hui",d:"Contr\u00f4le des p\u00e9remptions : rayon solaires \u00b7 Balance des stup\u00e9fiants",page:"tasks"}]};
window.DEMO_DATA={PD_GZ:PD,LD_GZ:LD,STOCK_GZ:STOCK,cloud:CLOUD,resume:RESUME,nom:"Pharmacie des Tilleuls"};
})();
