const firebase = require('firebase-admin')
const { conversation } = require('@assistant/conversation')

// Create an app instance
const app = conversation({
  clientId: process.env.CLIENT_ID
})

// Initialize Firebase app
firebase.initializeApp({
  credential: firebase.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS)),
  databaseURL: process.env.FIREBASE_DATABASE_URL
})

app.handle('linkAccount', async conv => {
  const payload = conv.user.params.tokenPayload
  if (payload) {
  // Get UID for Firebase auth user using the email of the user
    const email = payload.email
    if (!conv.user.params.uid && email) {
      try {
        conv.user.params.uid = (await firebase.auth().getUserByEmail(email)).uid
      } catch (e) {
        if (e.code !== 'auth/user-not-found') {
          throw e
        }
        // If the user is not found, create a new Firebase auth user
        // using the email obtained from Google Assistant
        conv.user.params.uid = (await firebase.auth().createUser({
          email,
          emailVerified: payload.email_verified,
          photoURL: payload.picture,
          displayName: payload.name
        })).uid
        conv.session.params.newUser = true
      }
    }
  }
})

module.exports = app