const { Simple } = require('@assistant/conversation')
const { FieldValue } = require('@google-cloud/firestore')
const moment = require('moment')

const app = require('../services/app')
const firebase = require('../services/firebase')
const { getBalance } = require('../services/balance')

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

  const timestamp = moment().toISOString()

  await accountsCollection.doc(uid).set({
    balance: balance - amount,
    transactions: FieldValue.arrayUnion({
      timestamp,
      value: -amount,
      type: 'expense'
    })
  })

  await receiversQuery.docs[0].ref.update({ 
    balance: FieldValue.increment(amount),
    transactions: FieldValue.arrayUnion({
      timestamp,
      value: amount,
      type: 'income'
    })
  })

  conv.add(new Simple(`Transferência efetuada com sucesso, seu saldo agora é de R$ ${(balance - amount).toFixed(2)}`))
})
