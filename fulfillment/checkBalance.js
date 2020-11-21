const app = require('../services/app')
const { getBalance } = require('../services/balance')

app.handle('checkBalance', async conv => {
  conv.session.params.balance = await getBalance(conv.user.params.uid)
})
