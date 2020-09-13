require('dotenv').config()

const express = require('express')

express()
  .use(express.json())
  .post('/fulfillment', require('./fulfillment'))
  .listen(process.env.PORT || 8080, () => console.log('Server started'))