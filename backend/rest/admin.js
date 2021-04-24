'use strict'

const express = require('express')
const router = express.Router()

const common = require('../common')
const server = require('../server')

router.get('/podcasts', async (req, res) => {
	const [podcasts] = await server.pool.query(
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

router.get('/podcasts/:id', async (req, res) => {
	const [podcasts] = await server.pool.query(
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

router.get('/podcasts/:id/episodes', async (req, res) => {
	const [podcasts] = await server.pool.query(
		'SELECT `id` \
		FROM `podcast`'
	)

	if (podcasts.length !== 1) {
		res.status(404).end()
		return
	}

	const podcast = podcasts[0]

	const [episodes] = await server.pool.query(
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

router.post('/podcasts/:id/episodes', async (req, res) => {
	const [podcasts] = await server.pool.query(
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

	const id = common.randomString()

	await server.pool.query(
		'INSERT INTO `podcastEpisode` (`id`, `podcast`, `title`, `isVisible`) \
		VALUES(?, ?, ?, ?)',
		[id, podcast.id, title, false]
	)

	res.status(201).json({
		id,
	})
})

module.exports = router