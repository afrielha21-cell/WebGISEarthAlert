#!/usr/bin/env python3
"""Fetch limited official BMKG earthquake snapshots for the static public site.
This is not a historical archive or an early-warning system.
Run by GitHub Actions on deployment and schedule; no API keys required.
"""
from datetime import datetime,timezone
from pathlib import Path
import json,urllib.request,time
ROOT=Path(__file__).resolve().parents[1]
TARGET=ROOT/'data'/'bmkg_snapshot.json'
URLS={
 'gempa_terbaru':'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json',
 'm5_plus':'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json',
 'dirasakan':'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json',
}
old={}
if TARGET.exists():
 try:old=json.loads(TARGET.read_text())
 except:old={}
feeds={};errs=[]
for name,url in URLS.items():
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'EarthAlert-educational/1.0 (BMKG attribution; scheduled public cache)','Accept':'application/json'})
  with urllib.request.urlopen(req, timeout=30) as r:
   response=json.load(r)
  if not isinstance(response.get('Infogempa',{}).get('gempa'),(dict,list)):raise ValueError('Unexpected BMKG schema')
  feeds[name]=response
 except Exception as exc:
  errs.append(f'{name}: {str(exc)[:160]}')
  if name in old.get('feeds',{}):feeds[name]=old['feeds'][name]
 time.sleep(1)
# Old record is reused if refresh fails; NEVER change its timestamp to now.
if feeds and not errs:
 stamp=datetime.now(timezone.utc).isoformat(timespec='seconds')
else:
 stamp=old.get('fetched_at_utc')
result={'fetched_at_utc':stamp,'feeds':feeds,'source':'Badan Meteorologi, Klimatologi, dan Geofisika (BMKG) - data.bmkg.go.id','refresh_ok':not errs,'errors':errs}
TARGET.write_text(json.dumps(result,ensure_ascii=False,indent=2),'utf-8')
print('feeds',len(feeds),'errors',errs)
