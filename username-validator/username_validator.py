import config
import re
import requests

s = requests.session()

r = s.get('https://feedback.netlight.com/')
r = s.get('https://feedback.netlight.com/api/login')

m = re.search('method="post" action="(.*?)">', r.text)

http_post_action = m.group(1)

r = s.post(http_post_action, data={
    'UserName': config.username,
    'Password': config.password,
    'AuthMethod': 'FormsAuthentication',
})

action = re.search('action="(.*?)"', r.text).group(1)
saml_response = re.search('name="SAMLResponse" value="(.*?)"', r.text).group(1)
relay_state = re.search('name="RelayState" value="(.*?)"', r.text).group(1)

r = s.post(action, data={
    'SAMLResponse': saml_response,
    'RelayState': relay_state,
})

r = s.get('https://feedback.netlight.com/api/employees/kber')

print(r.json())
