const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')

const app = express()
const PORT = 5000

app.use(bodyParser.json())

app.listen(PORT, () => {
  console.log('Server is running')
})
app.all('/crepes', (req, res) => {
  const ingredient = req.body.conversation.memory.garniture.value
  const url = `https://api.giphy.com/v1/gifs/search?api_key=PWUkVcwDtpUD9eLhxw19tt0bfjV6hMvm&q=${ingredient}`

  axios.get(url).then(giphyRes => {
    const body = giphyRes.data
    const gifs = body.data

    const rand = Math.floor(Math.random() * gifs.length);
    const gif = gifs[rand]
    const gifUrl = gif.images.original_still.url

    const response = {
      replies: [{
          type: 'picture',
            content: gifUrl
        }]
    }
    res.send(response)
  })
 })
