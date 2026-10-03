"""Integration validation against the supervised development preview only."""
import json,urllib.request,urllib.error
base='http://127.0.0.1:8788'
checks=[]
def call(path,method='GET',body=None,user=None,origin=None):
 headers={'Content-Type':'application/json'}
 if user:headers.update({'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.test'})
 if origin:headers['Origin']=origin
 req=urllib.request.Request(base+path,data=None if body is None else json.dumps(body).encode(),headers=headers,method=method)
 try:
  with urllib.request.urlopen(req,timeout=20) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
def test(name,condition):
 assert condition,name
 checks.append(name)
status,x=call('/api/search','POST',{'query':''});test('browse 14 curated scholarships',status==200 and len(x['results'])==14)
status,x=call('/api/search','POST',{'query':'fully funded masters in Germany'});test('natural language study/funding/country intent',status==200 and x['interpreted']=={'country':'Germany','level':'Master’s','funding':'Full funding'} and x['results'][0]['id']=='daad-epos')
status,x=call('/api/search','POST',{'query':'Engineering in Korea'});test('country alias Korea',status==200 and x['interpreted']['country']=='South Korea')
status,x=call('/api/search','POST',{'query':'undergraduate in Canada'});test('Canada undergraduate filtering',status==200 and len(x['results'])==3 and all('Undergraduate' in s['levels'] for s in x['results']))
status,x=call('/api/search','POST',{'query':'zzqvzzz'});test('unrecognised-query empty state',status==200 and len(x['results'])==0)
status,x=call('/api/search','POST',{'query':'','country':'Ghana'});test('unrepresented globe destination empty state',status==200 and len(x['results'])==0)
status,x=call('/api/search','POST',{'query':8});test('malformed query rejected',status==400)
status,x=call('/api/saved','POST',{'id':'chevening'});test('anonymous save rejected',status==401)
status,x=call('/api/account');test('anonymous profile rejected',status==401)
status,x=call('/api/saved','POST',{'id':'chevening'},'qa-user-a',origin='https://other.example');test('cross-origin write rejected',status==403)
status,x=call('/api/saved','POST',{'id':'unknown-id'},'qa-user-a');test('unknown scholarship rejected',status==404)
status,x=call('/api/saved','POST',{'id':'chevening'},'qa-user-a');test('authenticated save persists',status==200 and x['saved'])
status,x=call('/api/saved','POST',{'id':'chevening'},'qa-user-a');test('save is idempotent',status==200)
status,x=call('/api/account',user='qa-user-a');test('saved item survives fresh request',status==200 and x['saved']==['chevening'])
status,x=call('/api/account',user='qa-user-b');test('another account cannot see saved item',status==200 and x['saved']==[])
status,x=call('/api/saved','DELETE',{'id':'chevening'},'qa-user-b');test('another user cannot remove first user’s save',status==200)
status,x=call('/api/account',user='qa-user-a');test('first account save remains intact',x['saved']==['chevening'])
profile={'name':'Prototype QA','nationality':'Ghana','level':'Undergraduate','field':'Computer science'}
status,x=call('/api/account','PUT',profile,'qa-user-a');test('profile update',status==200 and x['profile']==profile)
status,x=call('/api/account',user='qa-user-a');test('profile survives fresh request',status==200 and x['profile']==profile)
status,x=call('/api/account',user='qa-user-b');test('profiles are isolated by user',status==200 and x['profile']['name']=='')
status,x=call('/api/saved','DELETE',{'id':'chevening'},'qa-user-a');test('authenticated unsave',status==200 and not x['saved'])
status,x=call('/api/account',user='qa-user-a');test('unsave survives fresh request',status==200 and x['saved']==[])
print(json.dumps({'passed':len(checks),'checks':checks},indent=2))
