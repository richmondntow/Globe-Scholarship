"""Exercise real registration, cookies, login, authorization, and scholarship flows locally."""
import json,uuid,http.cookiejar,urllib.request,urllib.error,os
base=os.environ.get('VALIDATE_BASE_URL','http://127.0.0.1:5173')
checks=[]
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args):return None
class Client:
 def __init__(self,ip=None):
  self.jar=http.cookiejar.CookieJar();self.opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar),NoRedirect());self.ip=ip or '2001:db8:'+uuid.uuid4().hex[:4]+':'+uuid.uuid4().hex[:4]+'::1'
 def call(self,path,method='GET',body=None,origin=None,extra=None):
  h={'Content-Type':'application/json','x-nf-client-connection-ip':self.ip}
  if method!='GET':h['Origin']=origin or base
  h.update(extra or {})
  req=urllib.request.Request(base+path,data=None if body is None else json.dumps(body).encode(),headers=h,method=method)
  try:
   with self.opener.open(req,timeout=25) as r:status,headers,raw=r.status,r.headers,r.read()
  except urllib.error.HTTPError as e:status,headers,raw=e.code,e.headers,e.read()
  try:data=json.loads(raw)
  except (ValueError,UnicodeDecodeError):data=raw.decode(errors='replace')
  return status,data,headers
 def cookie(self):return '; '.join(c.name+'='+c.value for c in self.jar)
def test(name,condition):
 assert condition,(name,status,x.get('error') if isinstance(x,dict) else str(x)[:100])
 checks.append(name)

a=Client();b=Client();password='Fixture-only '+uuid.uuid4().hex
for c in (a,b):
 status,x,h=c.call('/api/auth/sign-up/email','POST',{'name':'Local fixture','email':uuid.uuid4().hex+'@example.test','password':password});test('local account registration',status==200)
status,x,h=a.call('/api/discover','POST',{'query':'Engineering undergraduate scholarships in Ghana','gpa':'3.5'});test('web search inserts catalog record',status==200 and x['catalogUpdate']['added']==1)
status,x,h=a.call('/api/discover','POST',{'query':'Engineering undergraduate scholarships in Ghana'});test('repeat search does not duplicate',status==200 and x['catalogUpdate']['added']==0 and x['catalogUpdate']['existing']==1)
status,x,h=b.call('/api/search','POST',{'query':'engineering in Ghana'});test('another account can search new scholarship',status==200 and len(x['results'])==1)
record=x['results'][0];identity=record['id'];test('exact badge and source persisted',record['provenance']=='AI discovered' and record['url']=='https://university.example/award' and bool(record['discoveredAt']))
test('private search fields excluded',not any(k in record for k in ['query','gpa','userId','preferences']))
status,x,h=b.call('/api/saved','POST',{'id':identity});test('new catalog scholarship is saveable',status==200)
status,x,h=b.call('/api/account');test('new saved entry persists',identity in x['saved'])
status,x,h=a.call('/api/account');test('shared catalog does not share personal saves',identity not in x['saved'])
status,x,h=b.call('/api/search','POST',{'query':''});test('original curated catalog preserved',len(x['results'])==15 and sum(s.get('provenance')=='AI discovered' for s in x['results'])==1)
status,x,h=b.call('/api/saved','DELETE',{'id':identity});test('new catalog scholarship can be unsaved',status==200)
print(json.dumps({'passed':len(checks),'checks':checks},indent=2))
