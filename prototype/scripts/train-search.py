"""Train a compact LSA retrieval model. Runtime uses only the exported vectors.
Reproduce with Python 3 + scikit-learn; no training dependencies are needed to host.
"""
import json,re
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import normalize
r=Path(__file__).resolve().parent.parent
rows=json.loads((r/'data/scholarships.json').read_text())
# The same normalisation is used in TypeScript at inference.
def tokens(s):
 return re.findall(r'[a-z0-9]+',s.lower().replace('’',"'"))
def doc(s):
 return ' '.join([s['title'],s['provider'],s['country'],*s['levels'],s['funding'],s['description'],*s['fields'],*s['eligibility'],*s['benefits']])
texts=[doc(x) for x in rows]
# Paired domain vocabulary teaches topical relationships independently of exact wording.
concepts=[
 'computer science computing programming software technology engineering stem',
 'master masters postgraduate graduate degree research university',
 'undergraduate bachelor bachelors college school leaver first degree',
 'phd doctoral doctorate research graduate thesis',
 'fully funded full funding tuition living stipend travel scholarship',
 'need based financial need low income hardship support',
 'international foreign overseas global student study abroad',
 'leadership community civic service public policy development',
 'business economics finance entrepreneurship management',
 'science engineering technology mathematics computing research',
]
corpus=texts+concepts*3
v=TfidfVectorizer(tokenizer=tokens,token_pattern=None,lowercase=False,stop_words='english',sublinear_tf=True)
x=v.fit_transform(corpus)
svd=TruncatedSVD(n_components=min(24,x.shape[0]-1),random_state=17)
svd.fit(x)
z=normalize(svd.transform(x[:len(rows)]))
model=dict(type='tfidf-lsa',dimensions=z.shape[1],vocabulary=v.vocabulary_,idf=v.idf_.round(7).tolist(),components=svd.components_.round(7).tolist(),vectors=z.round(7).tolist(),ids=[s['id'] for s in rows])
(r/'data/search-model.json').write_text(json.dumps(model,separators=(',',':')))
print('Trained LSA:',len(rows),'opportunities,',len(v.vocabulary_),'tokens,',z.shape[1],'latent dimensions')
