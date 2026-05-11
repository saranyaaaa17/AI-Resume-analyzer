import httpx

url = 'http://127.0.0.1:8000/analyze'
with open('app/../../sample-resume.pdf'.replace('/','\\'), 'rb') as f:
    files = {'file': ('sample-resume.pdf', f, 'application/pdf')}
    resp = httpx.post(url, files=files)
    print('status', resp.status_code)
    print(resp.json())
