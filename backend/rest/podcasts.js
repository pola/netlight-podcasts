'use strict'

const express = require('express')
const router = express.Router()

const common = require('../common')
const server = require('../server')

router.get('/', async (req, res) => {
	const [podcasts] = await server.pool.query(
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
	const [podcasts] = await server.pool.query(
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
		podcast.token = common.randomString(32)

		await server.pool.query(
			'INSERT INTO `podcastToken` (`token`, `account`, `podcast`, `isRemoved`) VALUES(?, ?, ?, ?)',
			[podcast.token, username, podcast.id, false]
		)
	}

	if (withEpisodes) {
		const [episodes] = await server.pool.query(
			'SELECT \
				`slug`, \
				`title`, \
				`description`, \
				`duration`, \
				`published` \
			FROM `podcastEpisode` \
			WHERE `podcast` = ? AND `published` IS NOT NULL AND `published` < ? AND `isVisible` = ?',
			[podcast.id, common.getTimestamp(), true]
		)

		podcast.episodes = episodes
	}
	
	return podcast
}

router.get('/:slug', async (req, res) => {
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

router.patch('/:slug', async (req, res) => {
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
		await server.pool.query(
			'UPDATE `podcastToken` \
			SET `isRemoved` = ? \
			WHERE `podcast` = ? AND `account` = ?',
			[true, podcast.id, username]
		)

		podcast.token = common.randomString(32)

		await server.pool.query(
			'INSERT INTO `podcastToken` (`token`, `account`, `podcast`, `isRemoved`) VALUES(?, ?, ?, ?)',
			[podcast.token, username, podcast.id, false]
		)
	}

	delete podcast.id

	res.json(podcast)
})

module.exports = router