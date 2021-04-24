'use strict'

const common = require('./common')
const server = require('./server')

const getClientDetails = req => {
  const ip = req.headers['x-real-ip'] || req.ip
  const userAgent = req.headers['user-agent'] || null
  
  return { ip, userAgent }
}

module.exports.savePodcastVisit = async (req, podcastId) => {
  const username = req.user._json.preferred_username
  const { ip, userAgent } = getClientDetails(req)

  await server.pool.query(
    'INSERT INTO `logPodcastVisit` (`timestamp`, `ip`, `userAgent`, `account`, `podcast`) \
    VALUES(?, ?, ?, ?, ?)',
    [common.getTimestamp(), ip, userAgent, username, podcastId]
  )
}

module.exports.savePodcastTokenRss = async (req, token) => {
  const { ip, userAgent } = getClientDetails(req)

  await server.pool.query(
    'INSERT INTO `logPodcastTokenRss` (`timestamp`, `ip`, `userAgent`, `token`) \
    VALUES(?, ?, ?, ?)',
    [common.getTimestamp(), ip, userAgent, token]
  )
}

module.exports.savePodcastTokenAudio = async (req, token, episodeId) => {
  const { ip, userAgent } = getClientDetails(req)

  await server.pool.query(
    'INSERT INTO `logPodcastTokenAudio` (`timestamp`, `ip`, `userAgent`, `token`, `episode`) \
    VALUES(?, ?, ?, ?, ?)',
    [common.getTimestamp(), ip, userAgent, token, episodeId]
  )
}