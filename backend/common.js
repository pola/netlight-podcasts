module.exports.randomString = (length = 8) => {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const charactersLength = characters.length

  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }

  return result
}

module.exports.duration2itunes = duration => {
	const hours = Math.floor(duration / 3600).toString()
	const minutes = Math.floor((duration % 3600) / 60).toString()
	const seconds = Math.floor(((duration % 3600) % 60) / 60).toString()

	return hours.padStart(2, '0') + ':' + minutes.padStart(2, '0') + ':' + seconds.padStart(2, '0')
}

module.exports.getTimestamp = () => Math.floor(Date.now() / 1000)
