const firebase = require('../services/firebase')

const getBalance = async uid => {
  if (uid) {
    const account = await firebase.firestore().collection('accounts').doc(uid).get()
    return account.get('balance').toFixed(2)
  } else {
    throw 'Invalid UID'
  }
}

module.exports = { getBalance }