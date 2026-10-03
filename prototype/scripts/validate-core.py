"""Exercise real registration, cookies, login, authorization, and scholarship flows locally."""
import json,uuid,http.cookiejar,urllib.request,urllib.error
base='http://127.0.0.1:8788'
checks=[]
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args):return None
class Client:
 def __init__(self,ip=None):
  self.jar=http.cookiejar.CookieJar();self.opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar),NoRedirect());self.ip=ip or '2001:db8:'+uuid.uuid4().hex[:4]+':'+uuid.uuid4().hex[:4]+'::1'
 def call(self,path,method='GET',body=None,origin=None,extra=None):
  h={'Content-Type':'application/json','cf-connecting-ip':self.ip}
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
 assert condition,name
 checks.append(name)
anon=Client();a=Client();b=Client()
run=uuid.uuid4().hex[:12];email_a='qa-a-'+run+'@example.test';email_b='qa-b-'+run+'@example.test';password='Local-only '+uuid.uuid4().hex
status,x,h=anon.call('/');test('anonymous home redirects to login',status in (302,303,307,308) and h.get('Location')=='/login')
status,x,h=anon.call('/login');test('login page is public',status==200 and 'Your next chapter awaits.' in x)
status,x,h=anon.call('/signup');test('new-user page is public',status==200 and 'Create your account.' in x)
status,x,h=anon.call('/api/search','POST',{'query':''});test('anonymous search rejected',status==401)
status,x,h=anon.call('/api/saved','POST',{'id':'chevening'});test('anonymous save rejected',status==401)
status,x,h=anon.call('/api/account');test('anonymous profile rejected',status==401)
status,x,h=anon.call('/api/account',extra={'oai-authenticated-user-id':'forged','oai-authenticated-user-email':email_a});test('forged platform identity cannot bypass account login',status==401)
status,x,h=a.call('/api/auth/sign-up/email','POST',{'name':'QA A','email':email_a,'password':'short'});test('weak password rejected',status==400)
status,x,h=a.call('/api/auth/sign-up/email','POST',{'name':'QA A','email':'invalid','password':password});test('invalid email rejected',status==400)
status,x,h=a.call('/api/auth/sign-up/email','POST',{'name':'QA A','email':email_a,'password':password},origin='https://other.example');test('cross-origin registration rejected',status==403)
status,x,h=a.call('/api/auth/sign-up/email','POST',{'name':'QA A','email':email_a,'password':password});test('open registration creates a real account',status==200 and x.get('user',{}).get('email')==email_a)
set_cookie='; '.join(h.get_all('Set-Cookie',[]));test('session is HttpOnly and SameSite', 'HttpOnly' in set_cookie and 'samesite=lax' in set_cookie.lower())
status,x,h=b.call('/api/auth/sign-up/email','POST',{'name':'QA B','email':email_b,'password':password});test('another user can register without creator approval',status==200 and x.get('user',{}).get('email')==email_b)
status,x,h=anon.call('/api/auth/sign-up/email','POST',{'name':'QA impostor','email':email_a,'password':'Unrelated-password-999'});test('duplicate email cannot create a second account',status==422 and not anon.cookie())
status,x,h=anon.call('/api/auth/sign-in/email','POST',{'email':email_a,'password':'incorrect-password-999'});test('incorrect login rejected',status==401 and not anon.cookie())
status,x,h=a.call('/');test('registered user can access the globe workspace',status==200 and 'Where will you go next?' in x)
status,x,h=a.call('/api/search','POST',{'query':''});test('authenticated browse contains 14 scholarships',status==200 and len(x['results'])==14)
status,x,h=a.call('/api/search','POST',{'query':'fully funded masters in Germany'});test('natural language intent and country filtering',status==200 and x['interpreted']=={'country':'Germany','level':'Master’s','funding':'Full funding'} and x['results'][0]['id']=='daad-epos')
status,x,h=a.call('/api/search','POST',{'query':'Engineering in Korea'});test('country alias Korea',status==200 and x['interpreted']['country']=='South Korea')
status,x,h=a.call('/api/search','POST',{'query':'undergraduate in Canada'});test('Canada undergraduate filtering',status==200 and len(x['results'])==3 and all('Undergraduate' in s['levels'] for s in x['results']))
status,x,h=a.call('/api/search','POST',{'query':'zzqvzzz'});test('unknown query shows empty results',status==200 and len(x['results'])==0)
status,x,h=a.call('/api/search','POST',{'query':'','country':'Ghana'});test('unrepresented destination shows empty results',status==200 and len(x['results'])==0)
status,x,h=a.call('/api/search','POST',{'query':8});test('malformed search rejected',status==400)
status,x,h=a.call('/api/saved','POST',{'id':'chevening'},origin='https://other.example');test('cross-origin save rejected',status==403)
status,x,h=a.call('/api/saved','POST',{'id':'unknown-id'});test('unknown scholarship rejected',status==404)
status,x,h=a.call('/api/saved','POST',{'id':'chevening'});test('authenticated save persists',status==200 and x['saved'])
status,x,h=a.call('/api/saved','POST',{'id':'chevening'});test('save is idempotent',status==200)
status,x,h=a.call('/api/account');test('saved item survives a fresh request',status==200 and x['saved']==['chevening'])
status,x,h=b.call('/api/account');test('saved lists are isolated by account',status==200 and x['saved']==[])
status,x,h=b.call('/api/saved','DELETE',{'id':'chevening'});test('another account cannot remove first account save',status==200)
status,x,h=a.call('/api/account');test('first account save remains intact',x['saved']==['chevening'])
profile={'name':'Prototype QA','nationality':'Ghana','level':'Undergraduate','field':'Computer science'}
status,x,h=a.call('/api/account','PUT',profile);test('profile can be updated',status==200 and x['profile']==profile)
status,x,h=a.call('/api/account');test('profile survives a fresh request',status==200 and x['profile']==profile)
status,x,h=b.call('/api/account');test('profiles are isolated by account',status==200 and x['profile']['name']=='QA B')
stale=a.cookie();status,x,h=a.call('/api/auth/sign-out','POST',{},origin='https://other.example');test('cross-origin logout rejected',status==403)
status,x,h=a.call('/api/auth/sign-out','POST',{});test('logout succeeds',status==200)
status,x,h=a.call('/api/account');test('logged-out account access rejected',status==401)
status,x,h=anon.call('/api/account',extra={'Cookie':stale});test('revoked session cannot be replayed',status==401)
status,x,h=anon.call('/api/account',extra={'Cookie':stale+'tampered'});test('tampered session rejected',status==401)
status,x,h=a.call('/api/auth/sign-in/email','POST',{'email':email_a.upper(),'password':password});test('existing account can log back in',status==200 and x.get('user',{}).get('email')==email_a)
status,x,h=a.call('/api/account');test('saved scholarships and profile survive logout/login',status==200 and x['saved']==['chevening'] and x['profile']==profile)
status,x,h=a.call('/api/saved','DELETE',{'id':'chevening'});test('authenticated unsave persists',status==200 and not x['saved'])
status,x,h=a.call('/api/account');test('unsave survives a fresh request',status==200 and x['saved']==[])
status,x,h=a.call('/api/auth/delete-user','POST',{});test('unconfigured account-management endpoint is blocked',status==404)
throttled=Client()
statuses=[throttled.call('/api/auth/sign-in/email','POST',{'email':email_a,'password':'incorrect-password-999'})[0] for _ in range(11)]
test('persistent login rate limiting blocks excessive attempts',statuses[-1]==429)
print(json.dumps({'passed':len(checks),'checks':checks},indent=2))
