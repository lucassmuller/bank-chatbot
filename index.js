require('dotenv').config()

const express = require('express')
const { conversation, Image } = require('@assistant/conversation')

// Create an app instance
const app = conversation({
  clientId: process.env.CLIENT_ID
})

// Register handlers for Actions SDK
app.handle('test', conv => {
  conv.add('Hi, how is it going?')
  conv.add(new Image({
    url: 'https://developers.google.com/web/fundamentals/accessibility/semantics-builtin/imgs/160204193356-01-cat-500.jpg',
    alt: 'A cat',
  }))
})

express()
  .use(express.json())
  .post('/', app)
  .listen(8080, () => console.log('Server started'))