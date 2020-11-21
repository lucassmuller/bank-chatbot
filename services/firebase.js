const firebase = require('firebase-admin')

// Initialize Firebase app
module.exports = firebase.initializeApp({
  credential: firebase.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS)),
  databaseURL: process.env.FIREBASE_DATABASE_URL
})
