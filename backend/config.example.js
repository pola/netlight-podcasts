module.exports = {
	mysql: {
		host: '',
		username: '',
		password: '',
		database: ''
	},
	bind: {
		ip: '127.0.0.1',
		port: 8989,
	},
	creds: {
		identityMetadata: '<ADD VALUE HERE>',
		clientID: '<ADD VALUE HERE>',
		clientSecret: '<ADD VALUE HERE>',
		responseType: 'code id_token', 
		responseMode: 'form_post',
		redirectUrl: 'http://localhost:8080/auth', 
		allowHttpForRedirectUrl: true,
		validateIssuer: false,
		issuer: null,
		passReqToCallback: false,
		useCookieInsteadOfSession: true,
		cookieEncryptionKeys: [
		  { 'key': '', 'iv': '' },
		  { 'key': '', 'iv': '' }
		],
	 	scope: ['profile', 'offline_access', 'https://graph.microsoft.com/User.Read'],
		loggingLevel: 'info',
		nonceLifetime: null,
		nonceMaxAmount: 5,
		clockSkew: null,
	},
}
