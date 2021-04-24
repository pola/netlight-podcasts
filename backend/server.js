'use strict'

const http = require('http')
const express = require('express')
const session = require('express-session')
const mysql = require('mysql2/promise')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const passport = require('passport')
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy

const config = require('./config')

const pool = mysql.createPool({
	host: config.mysql.host,
	user: config.mysql.username,
	password: config.mysql.password,
	database: config.mysql.database,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
})

passport.serializeUser((user, done) => {
	done(null, user.oid)
})
  
passport.deserializeUser((oid, done) => {
	const user = findByOid(oid)
	done(null, user)
})

// array to hold logged in users
const users = []

const findByOid = oid => {
	for (let i = 0, len = users.length; i < len; i++) {
		const user = users[i]

		if (user.oid === oid) {
			return user
		}
	}

	return null
}

const randomString = (length = 8) => {
  var result = ''
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  var charactersLength = characters.length

  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }

  return result
}

const duration2itunes = duration => {
	const hours = Math.floor(duration / 3600).toString()
	const minutes = Math.floor((duration % 3600) / 60).toString()
	const seconds = Math.floor(((duration % 3600) % 60) / 60).toString()

	return hours.padStart(2, '0') + ':' + minutes.padStart(2, '0') + ':' + seconds.padStart(2, '0')
}

const strategyConfig = {
	identityMetadata: config.creds.identityMetadata,
	clientID: config.creds.clientID,
	responseType: config.creds.responseType,
	responseMode: config.creds.responseMode,
	redirectUrl: config.creds.redirectUrl,
	allowHttpForRedirectUrl: config.creds.allowHttpForRedirectUrl,
	clientSecret: config.creds.clientSecret,
	validateIssuer: config.creds.validateIssuer,
	isB2C: config.creds.isB2C,
	issuer: config.creds.issuer,
	passReqToCallback: config.creds.passReqToCallback,
	scope: config.creds.scope,
	loggingLevel: config.creds.loggingLevel,
	nonceLifetime: config.creds.nonceLifetime,
	nonceMaxAmount: config.creds.nonceMaxAmount,
	useCookieInsteadOfSession: config.creds.useCookieInsteadOfSession,
	cookieEncryptionKeys: config.creds.cookieEncryptionKeys,
	clockSkew: config.creds.clockSkew,
}

passport.use(new OIDCStrategy(strategyConfig, (iss, sub, profile, accessToken, refreshToken, done) => {
    if (!profile.oid) {
		return done(new Error("No oid found"), null)
    }

    // asynchronous verification, for effect...
    process.nextTick(() => {
		const user = findByOid(profile.oid)

		if (user === null) {
			// "Auto-registration"
			users.push(profile)
			return done(null, profile)
		}

		return done(null, user)
	})
}))

const app = express()
const sessionConfiguration = session({
	secret: 'ssshhhhh',
	saveUninitialized: true,
	resave: true,
})

app.use(sessionConfiguration)

app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended : true }))

app.use(passport.initialize())
app.use(passport.session())

var httpServer = http.createServer(app)

const getTimestamp = () => Math.floor(Date.now() / 1000)

app.use(express.json())

app.get('/login', (req, res, next) => {
	passport.authenticate('azuread-openidconnect', {
		response: res,                      // required
		resourceURL: config.resourceURL,    // optional. Provide a value if you want to specify the resource.
		customState: req.query.target || '/',            // optional. Provide a value if you want to provide custom state value.
		failureRedirect: '/',
	})(req, res, next)
}, (req, res) => {
	res.redirect('/')
})

const handleReturn = (req, res, next) => {
	passport.authenticate('azuread-openidconnect', { 
		response: res,
		failureRedirect: '/failed',
	})(req, res, next)
}

const handleSuccessfulAuthentication = async (req, res) => {
	const timestamp = getTimestamp()

	await pool.query(
		'INSERT INTO `account` (`id`, `name`, `timestampRegistered`, `timestampSeen`, `isAdmin`, `isRemoved`) \
		VALUES(?, ?, ?, ?, ?, ?) \
		ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `timestampSeen` = VALUES(`timestampSeen`), `isRemoved` = VALUES(`isRemoved`)',
		[req.user._json.preferred_username, req.user.displayName, timestamp, timestamp, false, false]
	)

	res.redirect(req.body.state)
}

app.get('/auth', handleReturn, handleSuccessfulAuthentication)
app.post('/auth', handleReturn, handleSuccessfulAuthentication)

app.get('/logout', (req, res) => {
	req.session.destroy(err => {
		req.logOut()
		res.redirect(config.destroySessionUrl)
	})
})

app.get('/api/me', async (req, res) => {
	if (!req.isAuthenticated()) {
		res.json(null)
	} else {
		const account = (await pool.query(
			'SELECT * \
			FROM `account` \
			WHERE `id` = ?',
			[req.user._json.preferred_username]
		))[0][0]

		res.json({
			'name': req.user.displayName,
			'username': req.user._json.preferred_username,
			'isAdmin': account.isAdmin === 1,
		})
	}
})

app.delete('/api/me', (req, res) => {
	req.logOut()
	res.status(204).end()
})

app.get('/api/admin/podcasts', async (req, res) => {
	const [podcasts] = await pool.query(
		'SELECT \
			`id`, \
			`slug`, \
			`title`, \
			`description`, \
			`isVisible` \
		FROM `podcast`'
	)

	for (const podcast of podcasts) {
		podcast.isVisible = podcast.isVisible === 1
	}

	res.json(podcasts)
})

app.get('/api/admin/podcasts/:id', async (req, res) => {
	const [podcasts] = await pool.query(
		'SELECT \
			`id`, \
			`slug`, \
			`title`, \
			`description`, \
			`isVisible` \
		FROM `podcast`'
	)

	if (podcasts.length !== 1) {
		res.status(404).end()
		return
	}

	const podcast = podcasts[0]

	podcast.isVisible = podcast.isVisible === 1

	res.json(podcast)
})

app.get('/api/admin/podcasts/:id/episodes', async (req, res) => {
	const [podcasts] = await pool.query(
		'SELECT `id` \
		FROM `podcast`'
	)

	if (podcasts.length !== 1) {
		res.status(404).end()
		return
	}

	const podcast = podcasts[0]

	const [episodes] = await pool.query(
		'SELECT \
			`id`, \
			`slug`, \
			`title`, \
			`description`, \
			`duration`, \
			`fileName`, \
			`fileSize`, \
			`published`, \
			`isVisible` \
		FROM `podcastEpisode` \
		WHERE `podcast` = ?',
		[podcast.id]
	)

	for (const episode of episodes) {
		episode.isVisible = episode.isVisible === 1
	}

	res.json(episodes)
})

app.post('/api/admin/podcasts/:id/episodes', async (req, res) => {
	const [podcasts] = await pool.query(
		'SELECT `id` \
		FROM `podcast` \
		WHERE `id` = ?',
		[req.params.id]
	)

	if (podcasts.length !== 1) {
		res.status(404).end()
		return
	}

	const podcast = podcasts[0]

	let title = req.body.title

	if (typeof title !== 'string') {
		res.stauts(400).end()
		return
	}

	title = title.trim()

	if (title.length === 0 || title.length > 100) {
		res.status(400).json('The title is invalid')
		return
	}

	const id = randomString()

	await pool.query(
		'INSERT INTO `podcastEpisode` (`id`, `podcast`, `title`, `isVisible`) \
		VALUES(?, ?, ?, ?)',
		[id, podcast.id, title, false]
	)

	res.status(201).json({
		id,
	})
})

app.get('/api/podcasts', async (req, res) => {
	const [podcasts] = await pool.query(
		'SELECT \
			`slug`, \
			`title`, \
			`description` \
		FROM `podcast` \
		WHERE `isVisible` = ?',
		[true]
	)

	res.json(podcasts)
})

const getPodcastBySlug = async (slug, username, withEpisodes = true) => {
	const [podcasts] = await pool.query(
		'SELECT \
			`podcast`.`id`, \
			`podcast`.`slug`, \
			`podcast`.`title`, \
			`podcast`.`description`, \
			`podcastToken`.`token` \
		FROM `podcast` \
		LEFT JOIN `podcastToken` ON `podcastToken`.`account` = ? AND `podcastToken`.`podcast` = `podcast`.`id` AND `podcastToken`.`isRemoved` = ? \
		WHERE `slug` = ? AND `isVisible` = ?',
		[username, false, slug, true]
	)

	if (podcasts.length !== 1) {
		return null
	}

	const podcast = podcasts[0]

	if (podcast.token === null) {
		podcast.token = randomString(32)

		await pool.query(
			'INSERT INTO `podcastToken` (`token`, `account`, `podcast`, `isRemoved`) VALUES(?, ?, ?, ?)',
			[podcast.token, username, podcast.id, false]
		)
	}

	if (withEpisodes) {
		const [episodes] = await pool.query(
			'SELECT \
				`slug`, \
				`title`, \
				`description`, \
				`duration`, \
				`published` \
			FROM `podcastEpisode` \
			WHERE `podcast` = ? AND `published` IS NOT NULL AND `published` < ? AND `isVisible` = ?',
			[podcast.id, getTimestamp(), true]
		)

		podcast.episodes = episodes
	}
	
	return podcast
}

app.get('/api/podcasts/:slug', async (req, res) => {
	if (!req.user) {
		res.status(403).end()
		return
	}

	const slug = req.params.slug
	const username = req.user._json.preferred_username
	const podcast = await getPodcastBySlug(slug, username)

	if (podcast === null) {
		res.status(404).end()
		return
	}

	delete podcast.id
	
	res.json(podcast)
})

app.patch('/api/podcasts/:slug', async (req, res) => {
	if (!req.user) {
		res.status(403).end()
		return
	}

	const slug = req.params.slug
	const username = req.user._json.preferred_username
	const podcast = await getPodcastBySlug(slug, username)

	if (podcast === null) {
		res.status(404).end()
		return
	}

	if (req.body.token === null) {
		await pool.query(
			'UPDATE `podcastToken` \
			SET `isRemoved` = ? \
			WHERE `podcast` = ? AND `account` = ?',
			[true, podcast.id, username]
		)

		podcast.token = randomString(32)

		await pool.query(
			'INSERT INTO `podcastToken` (`token`, `account`, `podcast`, `isRemoved`) VALUES(?, ?, ?, ?)',
			[podcast.token, username, podcast.id, false]
		)
	}

	delete podcast.id

	res.json(podcast)
})

const getPodcastByToken = async token => {
	const [podcasts] = await pool.query(
		'SELECT \
			`podcast`.`id`, \
			`podcast`.`slug`, \
			`podcast`.`title`, \
			`podcast`.`description`, \
			`podcastToken`.`token` \
		FROM `podcast`, `podcastToken`, `account` \
		WHERE `podcastToken`.`token` = ? AND `podcastToken`.`podcast` = `podcast`.`id` AND `podcast`.`isVisible` = ? AND `account`.`id` = `podcastToken`.`account` AND `account`.`isRemoved` = ? AND `podcastToken`.`isRemoved` = ?',
		[token, true, false, false]
	)

	if (podcasts.length !== 1) {
		res.status(404).end()
		return
	}

	return podcasts[0]
}

app.get('/rss/:token.xml', async (req, res) => {
	const token = req.params.token
	const podcast = await getPodcastByToken(token)

	if (podcast === null) {
		res.status(404).end()
		return
	}

	const [episodes] = await pool.query(
		'SELECT \
			`slug`, \
			`title`, \
			`description`, \
			`duration`, \
			`fileName`, \
			`fileSize`, \
			`published` \
		FROM `podcastEpisode` \
		WHERE `podcast` = ? AND `published` IS NOT NULL AND `published` < ? AND `isVisible` = ?',
		[podcast.id, getTimestamp(), true]
	)

	podcast.episodes = episodes

	const rssLines = []

	rssLines.push('<?xml version="1.0" encoding="UTF-8"?>')
	rssLines.push('<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">')
	rssLines.push('<channel>')
	rssLines.push('<atom:link href="https://podcasts.netlight.com/rss/' + token + '.xml" rel="self" type="application/rss+xml" />')
	rssLines.push('<title>' + podcast.title + '</title>')
	rssLines.push('<link>https://podcasts.netlight.com/' + podcast.slug + '</link>')
	rssLines.push('<language>en-us</language>')
	rssLines.push('<itunes:author>Netlight</itunes:author>')
	rssLines.push('<itunes:summary>' + podcast.description + '</itunes:summary>')
	rssLines.push('<description>' + podcast.description + '</description>')
	rssLines.push('<itunes:owner>')
	rssLines.push('<itunes:name>Netlight Podcasts</itunes:name>')
	rssLines.push('<itunes:email>martin.pola@netlight.com</itunes:email>')
	rssLines.push('</itunes:owner>')
	rssLines.push('<itunes:explicit>no</itunes:explicit>')
	rssLines.push('<itunes:image href="https://podcasts.netlight.com/images/podcast-logo.png" />')
	rssLines.push('<itunes:category text="Business" />')

	for (const episode of episodes) {
		rssLines.push('<item>')
		rssLines.push('<title>' + episode.title + '</title>')
		rssLines.push('<itunes:summary>' + episode.description + '</itunes:summary>')
		rssLines.push('<description>' + episode.description + '</description>')
		rssLines.push('<link>https://podcasts.netlight.com/' + podcast.slug + '/' + episode.slug + '</link>')
		rssLines.push('<enclosure url="https://podcasts.netlight.com/audio/' + token + '/' + episode.slug + '" type="audio/mpeg" length="' + episode.fileSize + '"></enclosure>')
		rssLines.push('<pubDate>' + (new Date(episode.published * 1000)).toUTCString() + '</pubDate>')
		rssLines.push('<itunes:author>Netlight Podcasts</itunes:author>')
		rssLines.push('<itunes:duration>' + duration2itunes(episode.duration) + '</itunes:duration>')
		rssLines.push('<itunes:explicit>no</itunes:explicit>')
		rssLines.push('<guid>https://podcasts.netlight.com/' + podcast.slug + '/' + episode.slug + '</guid>')
		rssLines.push('</item> ')
	}

	rssLines.push('</channel>')
	rssLines.push('</rss>')
	
	res.set('content-type', 'text/xml')
	res.send(rssLines.join('\n'))
})

app.get('/audio/:token/:slug', async (req, res) => {
	const token = req.params.token
	const podcast = await getPodcastByToken(token)

	if (podcast === null) {
		res.status(404).end()
		return
	}

	const [episodes] = await pool.query(
		'SELECT \
			`title`, \
			`fileContent`, \
			`fileMimeType`, \
			`fileSize` \
		FROM`podcastEpisode` \
		WHERE `slug` = ? AND `podcast` = ? AND `isVisible` = ? AND `published` IS NOT NULL AND `published` < ?',
		[req.params.slug, podcast.id, true, getTimestamp()]
	)

	if (episodes.length !== 1) {
		res.status(404).end()
		return
	}

	const episode = episodes[0]

	res.writeHead(200, {
		'content-disposition': 'attachment; filename="episode"',
		'content-type': episode.fileMimeType,
		'content-length': episode.fileSize,
	})

	res.end(episode.fileContent)
})

const start = async () => {
	httpServer.listen(config.bind.port, config.bind.ip)
}

start()
