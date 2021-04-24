'use strict'

const fs = require('fs')
const http = require('http')
const https = require('https')
const express = require('express')
const session = require('express-session')
const mysql = require('mysql2/promise')
const axios = require('axios')
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
var io = null

const getTimestamp = () => Math.floor(Date.now() / 1000)

var isPlainObject = o => Object.prototype.toString.call(o) === '[object Object]'

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
		'INSERT INTO `accounts` (`username`, `name`, `timestampRegistered`, `timestampSeen`) VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `timestampSeen` = VALUES(`timestampSeen`)',
		[req.user._json.preferred_username, req.user.displayName, timestamp, timestamp]
	)

	res.redirect(req.body.state)
}

app.get('/auth', handleReturn, handleSuccessfulAuthentication)
app.post('/auth', handleReturn, handleSuccessfulAuthentication)

// 'logout' route, logout from passport, and destroy the session with AAD.
app.get('/logout', (req, res) => {
	req.session.destroy(err => {
		req.logOut()
		res.redirect(config.destroySessionUrl)
	})
})

app.get('/api/me', (req, res) => {
	if (!req.isAuthenticated()) {
		res.json(null)
	} else {
		res.json({
			'name': req.user.displayName,
			'username': req.user._json.preferred_username,
		})
	}
})

app.delete('/api/me', (req, res) => {
	req.logOut()
	res.status(204).end()
})

app.get('/api/streams', async (req, res) => {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	
	const [streams] = await pool.query(
		'SELECT * \
		FROM `streams` \
		WHERE `start` >= ? AND `isHidden` = 0',
		[today.getTime() / 1000]
	)
	
	res.json(streams.map(stream => ({
		slug: stream.slug,
		title: stream.title,
		start: stream.start,
		hasInteraction: stream.slackChannel !== null,
	})))
})

app.patch('/api/streams/:id', async (req, res) => {
	const [streams] = await pool.query(
		'SELECT * \
		FROM `streams` \
		WHERE `id` = ?',
		[req.params.id]
	)

	if (streams.length !== 1) {
		res.status(404).end()
		return
	}

	const stream = streams[0]
	const errors = {}
	const changesToEmit = {
		needs: {},
	}

	if (Object.prototype.hasOwnProperty.call(req.body, 'slug')) {
		const slug = req.body.slug

		if (slug !== null && typeof slug !== 'string') {
			errors.slug = 'Invalid type.'
		} else if (slug !== null) {
			if (!/^[a-z0-9\-]+$/.test(slug)) {
				errors.slug = 'Invalid format.'
			} else {
				const count = (await pool.query(
					'SELECT COUNT(*) AS `count` \
					FROM `streams` \
					WHERE `id` != ? AND `slug` = ?',
					[stream.id, slug]
				))[0][0].count

				if (count !== 0) {
					errors.slug = 'Already taken by another stream.'
				}
			}
		}

		stream.slug = slug
	}

	if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
		const title = req.body.title

		if (typeof title !== 'string') {
			errors.title = 'Invalid type.'
		}

		stream.title = title
		changesToEmit.title = title
	}

	if (Object.prototype.hasOwnProperty.call(req.body, 'type')) {
		const type = req.body.type

		if (type !== null && !['YOUTUBE', 'IFRAME', 'AZURE'].includes(type)) {
			errors.type = 'Invalid type.'
		}

		stream.type = type
		changesToEmit.type = type
	}

	if (Object.prototype.hasOwnProperty.call(req.body, 'data')) {
		const data = req.body.data

		stream.data = data
		changesToEmit.data = data
	}

	if (Object.prototype.hasOwnProperty.call(req.body, 'linkList')) {
		const linkList = req.body.linkList

		if (!Array.isArray(linkList)) {
			errors.linkList = 'Invalid type.'
		} else {
			for (const link of linkList) {
				if (!isPlainObject(link) || typeof link.caption !== 'string' || typeof link.url !== 'string' || Object.keys(link).length !== 2) {
					errors.linkList = 'Invalid link item.'
					break
				}
			}
		}

		stream.linkList = linkList
		changesToEmit.linkList = linkList
	}

	if (Object.prototype.hasOwnProperty.call(req.body, 'start')) {
		const start = req.body.start

		if (typeof start !== 'number') {
			stream.start = 'Invalid type.'
		} else if (start <= 0) {
			stream.start = 'Must be a positive integer.'
		}

		stream.start = start
		changesToEmit.start = start
	}

	if (Object.prototype.hasOwnProperty.call(req.body, 'password')) {
		const password = req.body.password

		if (password !== null && typeof password !== 'string') {
			errors.password = 'Invalid type.'
		}

		stream.password = password
		changesToEmit.needs.password = password !== null
	}

	if (Object.prototype.hasOwnProperty.call(req.body, 'slackChannel')) {
		const slackChannel = req.body.slackChannel

		if (slackChannel !== null && typeof slackChannel !== 'string') {
			errors.slackChannel = 'Invalid type.'
		} else if (slackChannel !== null && !/^#[a-z\-_0-9]+$/.test(slackChannel)) {
			errors.slackChannel = 'Invalid channel name.'
		}

		stream.slackChannel = slackChannel
		changesToEmit.hasInteraction = slackChannel !== null
		changesToEmit.needs.name = slackChannel !== null
	}

	if (Object.prototype.hasOwnProperty.call(req.body, 'isHidden')) {
		const isHidden = req.body.isHidden

		if (typeof isHidden !== 'boolean') {
			errors.isHidden = 'Invalid type.'
		}

		stream.isHidden = isHidden
	}

	if (Object.keys(errors).length > 0) {
		res.status(400).json(errors)
		return
	}

	if (stream.type === null) {
		if (stream.data !== null) {
			errors.data = 'No data can be provided when the stream type is not provided.'
		}
	}

	if (stream.type === 'YOUTUBE') {
		if (stream.data === null || !isPlainObject(stream.data)) {
			errors.data = 'Invalid type.'
		} else if (!Object.prototype.hasOwnProperty.call(stream.data, 'id')) {
			errors.data = 'Missing id field.'
		} else if (Object.keys(stream.data).length > 1) {
			errors.data = 'Unknown field found.'
		}
	}

	if (stream.type === 'IFRAME') {
		// TODO: validate this
	}

	if (stream.type === 'AZURE') {
		// TODO: validate this
	}

	if (Object.keys(errors).length > 0) {
		res.status(400).json(errors)
		return
	}

	await pool.query(
		'UPDATE `streams` \
		SET \
			`slug` = ?, \
			`title` = ?, \
			`type` = ?, \
			`data` = ?, \
			`linkList` = ?, \
			`start` = ?, \
			`password` = ?, \
			`slackChannel` = ?, \
			`isHidden` = ? \
		WHERE `id` = ?',
		[
			stream.slug,
			stream.title,
			stream.type,
			stream.data === null ? null : JSON.stringify(stream.data),
			JSON.stringify(stream.linkList),
			stream.start,
			stream.password,
			stream.slackChannel,
			stream.isHidden,
			stream.id,
		]
	)

	if (Object.keys(changesToEmit).length > 1 || Object.keys(changesToEmit.needs) > 0) {
		const needsName = stream.slackChannel !== null
		const needsPassword = stream.password !== null

		io.sockets.sockets.forEach(socket => {
			if (socket.our.streamId !== stream.id) {
				return
			}

			const r = {
				...changesToEmit,
				needs: {
					name: needsName,
					password: needsPassword,
				},
				lacks: {
					name: needsName && !socket.our.name,
					password: needsPassword && !socket.our.isAuthenticated,
				},
			}

			socket.emit('streamUpdate', r)
		})
	}
	
	res.status(204).end()
})

app.get('/api/podcasts', async (req, res) => {
	const [podcasts] = await pool.query(
		'SELECT \
			`slug`, \
			`title`, \
			`description` \
		FROM `podcast` \
		WHERE `isHidden` = ?',
		[false]
	)
	
	res.json(podcasts)
})

app.get('/api/podcasts/:slug', async (req, res) => {
	if (!req.user) {
		res.status(403).end()
		return
	}

	const username = req.user._json.preferred_username
	const slug = req.params.slug

	const [podcasts] = await pool.query(
		'SELECT \
			`podcast`.`id`, \
			`podcast`.`slug`, \
			`podcast`.`title`, \
			`podcast`.`description`, \
			`podcastToken`.`token` \
		FROM `podcast` \
		LEFT JOIN `podcastToken` ON `podcastToken`.`username` = ? AND `podcastToken`.`podcast` = `podcast`.`id` \
		WHERE `slug` = ? AND `isHidden` = ?',
		[username, slug, false]
	)

	if (podcasts.length !== 1) {
		res.status(404).end()
		return
	}

	const podcast = podcasts[0]

	if (podcast.token === null) {
		podcast.token = randomString(32)

		await pool.query(
			'INSERT INTO `podcastToken` (`token`, `username`, `podcast`) VALUES(?, ?, ?)',
			[podcast.token, username, podcast.id]
		)
	}

	const [episodes] = await pool.query(
		'SELECT \
			`slug`, \
			`title`, \
			`description`, \
			`duration`, \
			`published` \
		FROM `podcastEpisode` \
		WHERE `podcast` = ? AND `isHidden` = ?',
		[podcast.id, false]
	)

	podcast.episodes = episodes

	delete podcast.id
	
	res.json(podcast)
})

app.get('/rss/:token.xml', async (req, res) => {
	const token = req.params.token

	const [podcasts] = await pool.query(
		'SELECT \
			`podcast`.`id`, \
			`podcast`.`slug`, \
			`podcast`.`title`, \
			`podcast`.`description`, \
			`podcastToken`.`token` \
		FROM `podcast`, `podcastToken` \
		WHERE `podcastToken`.`token` = ? AND `podcastToken`.`podcast` = `podcast`.`id` AND `podcast`.`isHidden` = ?',
		[token, false]
	)

	if (podcasts.length !== 1) {
		res.status(404).end()
		return
	}

	const podcast = podcasts[0]

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
		WHERE `podcast` = ? AND `isHidden` = ?',
		[podcast.id, false]
	)

	podcast.episodes = episodes

	const rssLines = []

	rssLines.push('<?xml version="1.0" encoding="UTF-8"?>')
	rssLines.push('<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">')
	rssLines.push('<channel>')
	rssLines.push('<atom:link href="https://live.netlight.com/rss/' + token + '.xml" rel="self" type="application/rss+xml" />')
	rssLines.push('<title>' + podcast.title + '</title>')
	rssLines.push('<link>https://live.netlight.com/podcasts/' + podcast.slug + '</link>')
	rssLines.push('<language>en-us</language>')
	rssLines.push('<itunes:author>Netlight</itunes:author>')
	rssLines.push('<itunes:summary>' + podcast.description + '</itunes:summary>')
	rssLines.push('<description>' + podcast.description + '</description>')
	rssLines.push('<itunes:owner>')
	rssLines.push('<itunes:name>Netlight Live</itunes:name>')
	rssLines.push('<itunes:email>martin.pola@netlight.com</itunes:email>')
	rssLines.push('</itunes:owner>')
	rssLines.push('<itunes:explicit>no</itunes:explicit>')
	rssLines.push('<itunes:image href="https://live.netlight.com/images/podcast-logo.png" />')
	rssLines.push('<itunes:category text="Business" />')

	for (const episode of episodes) {
		rssLines.push('<item>')
		rssLines.push('<title>' + episode.title + '</title>')
		rssLines.push('<itunes:summary>' + episode.description + '</itunes:summary>')
		rssLines.push('<description>' + episode.description + '</description>')
		rssLines.push('<link>https://live.netlight.com/podcasts/' + podcast.slug + '/' + episode.slug + '</link>')
		rssLines.push('<enclosure url="' + episode.fileName + '" type="audio/mpeg" length="' + episode.fileSize + '"></enclosure>')
		rssLines.push('<pubDate>' + (new Date(episode.published * 1000)).toUTCString() + '</pubDate>')
		rssLines.push('<itunes:author>Netlight Live</itunes:author>')
		rssLines.push('<itunes:duration>' + duration2itunes(episode.duration) + '</itunes:duration>')
		rssLines.push('<itunes:explicit>no</itunes:explicit>')
		rssLines.push('<guid>https://live.netlight.com/podcasts/' + podcast.slug + '/' + episode.slug + '</guid>')
		rssLines.push('</item> ')
	}

	rssLines.push('</channel>')
	rssLines.push('</rss>')
	
	res.set('content-type', 'text/xml')
	res.send(rssLines.join('\n'))
})

const getStream = async (socket, data) => {
	const [streams] = await pool.query(
		'SELECT * \
		FROM `streams` \
		WHERE `slug` = ?',
		[data.slug]
	)
	
	if (streams.length !== 1) {
		socket.emit('streamNotFound')
		return
	}
	
	const stream = streams[0]

	const hasAccount = !!socket.our.user

	const needsName = stream.slackChannel !== null

	let name = null

	if (needsName) {
		if (hasAccount) {
			name = socket.our.user.displayName
		} else if (Object.prototype.hasOwnProperty.call(data, 'name') && typeof data.name === 'string' && !!data.name) {
			name = data.name
		}
	}

	let needsPassword = false
	let blockedByProtection = true

	if (stream.protection === 'OPEN') {
		blockedByProtection = false
	}

	if (stream.protection === 'REQUIRE_PASSWORD') {
		blockedByProtection = stream.password === null || stream.password !== data.password

		if (blockedByProtection) {
			needsPassword = true
		}
	}

	if (stream.protection === 'REQUIRE_ACCOUNT') {
		blockedByProtection = !hasAccount
	}

	if (stream.protection === 'REQUIRE_ACCOUNT_OR_PASSWORD') {
		blockedByProtection = !hasAccount && (stream.password !== null || stream.password !== data.password)

		if (blockedByProtection) {
			needsPassword = true
		}
	}

	const lacksName = needsName && name === null
	const readyForStream = !blockedByProtection && !lacksName

	const r = {
		slug: stream.slug,
		title: stream.title,
		start: stream.start,
		type: stream.type,
		hasInteraction: stream.slackChannel !== null,
		protection: stream.protection,
		blockedByProtection,
		readyForStream,
		needs: {
			name: needsName,
			password: needsPassword,
		},
		lacks: {
			name: lacksName,
			password: needsPassword && stream.password !== data.password,
		},
	}
	
	if (readyForStream) {
		r.data = stream.data
		r.linkList = stream.linkList
	}
	
	socket.emit('stream', r)

	if (readyForStream) {
		if (socket.our.sessionId) {
			await pool.query(
				'UPDATE `sessions` \
				SET `state` = ? \
				WHERE `id` = ?',
				['ENDED_CHANGE', socket.our.sessionId]
			)
		}

		socket.our.streamId = stream.id
		socket.our.isAuthenticated = !blockedByProtection
		socket.our.name = needsName ? name : null

		const timestamp = getTimestamp()
		const ip = socket.request.headers['x-real-ip'] || socket.request.connection.remoteAddress
		const userAgent = socket.request.headers['user-agent'] || null
		
		socket.our.sessionId = (await pool.query(
			'INSERT INTO `sessions` (`stream`, `username`, `ip`, `userAgent`, `name`, `dateStart`, `state`) VALUES(?, ?, ?, ?, ?, ?, ?)',
			[
				stream.id,
				hasAccount ? socket.our.user._json.preferred_username : null,
				ip,
				userAgent,
				name,
				timestamp,
				'ONGOING'
			]
		))[0].insertId
	}
}

const receiveInteractionMessage = async (socket, message) => {
	if (typeof message !== 'string' || !message || !socket.our.name || !socket.our.sessionId) {
		socket.emit('interactionMessageStatus', false)
		return
	}

	const [rows] = await pool.query(
		'SELECT `sessions`.`name`, `streams`.`slackChannel` \
		FROM `streams`, `sessions` \
		WHERE `streams`.`id` = `sessions`.`stream` AND `sessions`.`id` = ?',
		[socket.our.sessionId]
	)

	if (rows.length !== 1) {
		socket.emit('interactionMessageStatus', false)
		return
	}

	const row = rows[0]

	const params = new URLSearchParams()
	
	params.append('token', config.slackToken)
	params.append('channel', row.slackChannel)
	params.append('text', '*' + row.name + '*: ' + message)
	
	let ok

	try {
		const response = await axios.post('https://slack.com/api/chat.postMessage', params)

		ok = response.data.ok
	} catch {
		ok = false
	}

	socket.emit('interactionMessageStatus', ok)
}

const handleSocket = socket => {
	let user
	
	if (socket.request.session && socket.request.session.passport) {
		user = findByOid(socket.request.session.passport.user)
	} else {
		user = null
	}

	socket.emit('welcome', user)

	socket.our = {
		id: null,
		streamId: null,
		name: null,
		isAuthenticated: false,
		user,
	}

	socket.on('message', (type, data) => {
		switch (type) {
			case 'getStream':
				getStream(socket, data)
				break

			case 'interactionMessage':
				receiveInteractionMessage(socket, data)
				break
		}
	})

	socket.on('disconnect', async () => {
		if (socket.our.sessionId) {
			await pool.query(
				'UPDATE `sessions` \
				SET `dateEnd` = ?, `state` = ? \
				WHERE `id` = ?',
				[getTimestamp(), 'ENDED_OK', socket.our.sessionId]
			)
		}
	})
}

const start = async () => {
	await pool.query(
		'UPDATE `sessions` \
		SET `dateEnd` = ?, `state` = ? \
		WHERE `state` = ?',
		[getTimestamp(), 'ENDED_CRASH', 'ONGOING']
	)

	io = require('socket.io')(httpServer, {
		timeout: 5000,
		pingInterval: 5000,
		pingTimeout: 3000,
	}).use(function(socket, next){
        sessionConfiguration(socket.request, {}, next);
    })

	io.on('connection', handleSocket)
	
	httpServer.listen(config.bind.port, config.bind.ip)
}

start()
