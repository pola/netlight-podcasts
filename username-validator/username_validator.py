import config
import re
import requests
import mysql.connector
from mysql.connector import errors

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

try:
    accounts_db = mysql.connector.connect(
        host = config.mysql_host,
        user = config.mysql_username,
        password = config.mysql_password,
        database = config.mysql_database,
    )
    cursor = accounts_db.cursor()
    cursor.execute('SELECT username FROM accounts')

    myresult = cursor.fetchall()

    for (username, ) in myresult:
        short_username = username.split('@')[0]
        r = s.get('https://feedback.netlight.com/api/employees/' +  short_username)
        if r.status_code == 404:
            cursor.execute(
            "UPDATE accounts SET isRemoved = true WHERE username = %s",
            [username]
            )
            accounts_db.commit()  

except errors.PoolError as e:
    print(e)
    print('Closing accounts db  connection')

r = s.get('https://feedback.netlight.com/api/employees/' +  'erka')
print(r.json())

accounts_db.close()
