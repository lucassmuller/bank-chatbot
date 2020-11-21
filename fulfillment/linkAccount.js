const app = require('../services/app')
const firebase = require('../services/firebase')

app.handle('linkAccount', async conv => {
  const payload = conv.user.params.tokenPayload

  if (payload) {
    // Get UID for Firebase auth user using the email of the user
    const { name, email, email_verified, picture } = payload

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
          emailVerified: email_verified,
          photoURL: picture,
          displayName: name
        })).uid

        conv.session.params.newUser = true
      }
    }
  }
})
