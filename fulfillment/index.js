const firebase = require('firebase-admin')
const { conversation, Simple } = require('@assistant/conversation')

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

const getBalance = async uid => {
  if (uid) {
    const account = await firebase.firestore().collection('accounts').doc(uid).get()
    const balance = account.get('balance').toFixed(2)
    return balance
  } else {
    throw 'Invalid UID'
  }
}

app.handle('checkBalance', async conv => {
  conv.session.params.balance = await getBalance(conv.user.params.uid)
})

app.handle('transferMoneyValidation', async conv => {
  let { email } = conv.session.params
  if (email) {
    email = email.toLowerCase().replaceAll(' ', '')
  }
})

app.handle('transferMoney', async conv => {
  const uid = conv.user.params.uid
  const balance = await getBalance(uid)
  const { amount, receiver } = conv.session.params

  if (!receiver && !amount) {
    conv.add(new Simple('Ocorreu um erro, tente novamente.'))
    return
  }

  if (amount > balance) {
    conv.add(new Simple(`Transação não efetuada. Seu saldo atual de R$ ${balance} não é suficiente.`))
    return
  }

  const accountsCollection = firebase.firestore().collection('accounts')
  const receiversQuery = await accountsCollection.where('email', '==', receiver).limit(1).get()

  if (receiversQuery.empty) {
    conv.add(new Simple(`O recebedor ${receiver} não foi encontrado, tente novamente.`))
    return
  }

  const receiverAccount = receiversQuery.docs[0]
  const receiverBalance = receiverAccount.get('balance')

  await accountsCollection.doc(uid).update({ 'balance': balance - amount })
  await receiverAccount.ref.update({ 'balance': receiverBalance + amount })

  conv.add(new Simple(`Transferência efetuada com sucesso, seu saldo agora é de R$ ${(balance - amount).toFixed(2)}`))
})

module.exports = app