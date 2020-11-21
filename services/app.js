const { conversation } = require('@assistant/conversation')

// Create an app instance
module.exports = conversation({
  clientId: process.env.CLIENT_ID
})
