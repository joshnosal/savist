const stripe = require('stripe')(process.env.STRIPE_SECRET),
      { Configuration, PlaidApi, PlaidEnvironments, ProcessorStripeBankAccountTokenCreateRequest } = require('plaid'),
      express = require('express'),
      router = express.Router(),
      mongoose = require('mongoose'),
      passport = require('./passport'),
      userSchema = require('../schemas/user'),
      User = mongoose.model('User', userSchema),
      async = require('async')


// Check if payouts and charges are enabled
router.get('/account_enabled_check', (req, res, next) => {
  Promise.resolve()
  .then( async () => {
    const user = await User.findById(req.user._id).select('+stripe.account_id')
    const account = await stripe.accounts.retrieve(user.stripe.account_id)
    res.json({charges_enabled: account.charges_enabled, payouts_enabled: account.payouts_enabled})
  })
  .catch()
})

router.get('/check_account_capabilities', (req, res, next) => {
  Promise.resolve()
  .then(async () => {
    const user = await User.findById(req.user._id).select('+stripe.account_id')
    const account = await stripe.accounts.retrieve(user.stripe.account_id)
    if (!user.billing_address.complete || !account.charges_enabled || account.capabilities.card_payments !== 'active' || account.capabilities.transfers !== 'active') {
      return res.json({error: true})
    }
    res.json({})
  })
  .catch()
})

// Get Account Link
router.post('/account_link', (req, res, next) => {
  Promise.resolve()
  .then(async () => {
    const user = await User.findById(req.user._id).select('+stripe.account_id')
    const link = await stripe.accountLinks.create({
      account: user.stripe.account_id,
      refresh_url: req.body.redirect,
      return_url: req.body.redirect,
      type: req.body.type
    })
    res.json(link)
  })
  .catch(next)
})

// Get list of customer's connected deposit accounts
router.get('/get_external_accounts', (req, res, next)=>{
  Promise.resolve()
  .then(async () => {
    const user = await User.findById(req.user._id).select('+stripe.account_id').exec()
    const bankAccounts = await stripe.accounts.listExternalAccounts(
      user.stripe.account_id,
      { object: 'bank_account' }
    )
    let acctList = bankAccounts.data.map((item) => ({
      id: item.id,
      last4: item.last4,
      bank_name: item.metadata.institution_name,
      account_name: item.metadata.name,
      subtype: item.metadata.subtype,
      default: item.default_for_currency
    }))
    res.json(acctList)
  })
  .catch(next)
})

// Get customer's cards on file
router.get('/get_available_cards', (req, res, next)=>{
  Promise.resolve()
  .then(async () => {
    const user = await User.findById(req.user._id).select('+stripe').exec()
    const methodsData = await stripe.customers.listPaymentMethods(
      user.stripe.customer_id,
      {type: 'card', limit: 20 }
    )
    const cards = []
    methodsData.data.map(method => {
      let checkKeys = Object.keys(method.card.checks)
      for (let i=0; i<checkKeys.length; i++) {
        if (method.card.checks[checkKeys[i]] === 'fail') return 
      }
      if (method.card.funding !== 'prepaid') return
      if (method.card.country !== 'US') return
      cards.push({
        id: method.id,
        nickname: method.metadata.nickname,
        last4: method.card.last4,
        exp_month: method.card.exp_month,
        exp_year: method.card.exp_year,
        brand: method.card.brand
      })
    })
    res.json({cards: cards})
  })
  .catch(next)
})

// Delete a specific external account 
router.post('/remove_external_account', (req, res, next)=>{
  Promise.resolve()
  .then(async () => {
    const user = await User.findById(req.user._id).select('+stripe.account_id')
    const deleted = await stripe.accounts.deleteExternalAccount(
      user.stripe.account_id,
      req.body.accountID
    )
    res.json(deleted)
  })
  .catch(e => {
    if (e.type == 'StripeInvalidRequestError') {
      res.json({error: true, message: "You can't delete your default account. If you wan't to remove all of your banking information, you must delete your " + process.env.BRAND + " account which cannot be undone."})
    } else {
      next()
    }
  })
})

// Set selected external account as default
router.post('/set_default_external_account', (req, res, next)=>{
  Promise.resolve()
  .then(async () => {
    const user = await User.findById(req.user._id).select('+stripe.account_id')
    const updated = await stripe.accounts.updateExternalAccount(
      user.stripe.account_id,
      req.body.accountID,
      { default_for_currency: true }
    )
    res.json()
  })
  .catch(next)
})

// Create a new payment intent
router.post('/create_payment_intent', (req, res, next) => {
  const amount = Number(req.body.amount) * 100
  const cardToken = req.body.cardToken
  const nickname = req.body.nickname

  Promise.resolve()
  .then( async () => {
    const user = await User.findById(req.user._id).select([
      '+stripe.payment_intent_id', 
      '+stripe.customer_id', 
      '+stripe.account_id'
    ])

    // Clear old payment intent
    if (user.stripe.payment_intent_id) {
      const oldIntent = await stripe.paymentIntents.retrieve(user.stripe.payment_intent_id)
      if ( ['requires_payment_method', 'requires_confirmation'].includes(oldIntent.status) ) {
        await stripe.paymentIntents.cancel(oldIntent.id)
      }
    }

    // Validate inputs
    if (isNaN(amount)) return res.json({error: {message: 'This is not a valid amount'}})
    if (amount > 50000) return res.json({error: {message: 'Amount must be less than $500.'}})
    if (!nickname) return res.json({error: {message: 'Charge name not valid.'}})
    if (!cardToken) return res.json({error: {message: 'Card not valid.'}})

    // Create payment method
    const method = await stripe.paymentMethods.create({
      type: 'card',
      card: { token: req.body.cardToken },
      billing_details: { email: user.email },
    })

    if (method.card.funding !== 'prepaid' || method.card.country !== 'US') {
      return res.json({error: {message: 'Only US prepaid debit cards are permitted.'}})
    }

    // Determine application fee
    // Stripe Charge: 2.9% + $0.30 per charge
    // Stripe Connect: $2/active_acct/month
    // Stripe Payouts: 0.25%/payout + $0.25/payout
    // Stripe Total: 3.15% + $0.55 per charge + $2 / active account
    // Application Fee: Greater of $3+3.15% or 15%
    let minFee =  Math.ceil(( amount * 0.0315 ) + 290)
    let feeRate = Number(process.env.APP_FEE)
    let fee = Math.round(amount * feeRate)
    let fee_label = feeRate * 100 + '%'
    if (fee < minFee) {
      fee = minFee
      fee_label = '$2.90 + 3.15%'
    }
    let uniqueID = new mongoose.Types.ObjectId().toString()
    
    if (amount < 300) {
      return res.json({error: {message: 'Amount must be more than $3.00'}})
    }
    
    // Create new payment intent
    const newIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      customer: user.stripe.customer_id,
      description: nickname,
      payment_method: method.id,
      application_fee_amount: fee,
      transfer_data: { destination: user.stripe.account_id },
      on_behalf_of: user.stripe.account_id,
      metadata: { 
        fee_label: fee_label,
        unique_id: uniqueID
      }
    })

    // Save new payment intent to user
    await User.findByIdAndUpdate(req.user._id, {$set: {'stripe.payment_intent_id': newIntent.id} })
    res.json({uniqueID: uniqueID})
  })
  .catch(next)
})

// Retrive payment intent details
router.post('/get_payment_intent', (req, res, next) => {
  
  Promise.resolve()
  .then( async () => {
    const user = await User.findById(req.user._id).select([
      '+stripe.payment_intent_id', 
    ])
    const paymentIntent = await stripe.paymentIntents.retrieve(user.stripe.payment_intent_id)
    if (paymentIntent.metadata.unique_id !== req.body.uniqueID) {
      return res.json({error: 'old'})
    }
    res.json({
      amount: paymentIntent.amount,
      fee: paymentIntent.application_fee_amount,
      description: paymentIntent.description,
      fee_label: paymentIntent.metadata.fee_label
    })
  })
  .catch(next)
})

// Confirm an existing payment intent
router.post('/confirm_payment_intent', (req, res, next) => {
  Promise.resolve()
  .then( async () => {
    const user = await User.findById(req.user._id).select(['+stripe.payment_intent_id'])
    const paymentIntent = await stripe.paymentIntents.retrieve(user.stripe.payment_intent_id)
    if (paymentIntent.metadata.unique_id !== req.body.uniqueID) {
      return res.json({error: {message: 'An error occured with your charge. Please try re-entering your charge information.'}})
    }
    const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntent.id)
    if (confirmedIntent.status !== 'succeeded') {
      await stripe.paymentIntents.cancel(paymentIntent.id)
      await User.findByIdAndUpdate(req.user._id, {$set: {'stripe.payment_intent_id': null} })
      return res.json({error: {message: 'An error occured with your charge. Please try re-entering your charge information.'}})
    }
    res.json({})
  })
  .catch(next)
})

// Get account balance
router.get('/get_balance', (req, res, next) => {
  Promise.resolve()
  .then( async () => {
    const user = await User.findById(req.user._id).select(['+stripe.account_id'])
    const balance = await stripe.balance.retrieve({ stripeAccount: user.stripe.account_id })
    let data = {}
    for (let i=0; i<balance.available.length; i++) {
      if (balance.available[i].currency === 'usd') data.available = balance.available[i].amount || 0
    }
    for (let i=0; i<balance.pending.length; i++) {
      if (balance.pending[i].currency === 'usd') data.pending = balance.pending[i].amount || 0
    }
    res.json(data)
  })
  .catch(next)
})

// Get account history
router.post('/get_history', (req, res, next) => {
  let duration = req.body.days
  Promise.resolve()
  .then( async () => {
    const user = await User.findById(req.user._id).select(['+stripe.customer_id'])
    let today = new Date()
    today = Math.floor((today.getTime() / 1000) + 1)
    console.log(today)
    let start
    if (duration === '30') start = today - (30 * 24 * 60 * 60) - 2
    if (duration === '90') start = today - (90 * 24 * 60 * 60) - 2
    let query
    if (start) {
      query = `customer:${user.stripe.customer_id} AND created<${today} AND created>${start}`
    } else {
      query = `customer:${user.stripe.customer_id}`
    }
    let finished = false
    let nextPage = null
    let paymentIntents = []
    while(finished === false) {
      let search_param = nextPage ? { query: query, limit: 1, page: nextPage } : { query: query, limit: 1 }
      const results = await stripe.paymentIntents.search(search_param)
      for (let i=0; i<results.data; i++) {
        let result = results.data[i]
        paymentIntents.push({
          amount: result.amount,
          fee: result.application_fee_amount,
          created: result.created,
          description: result.description,
          status: result.status
        })
      }
      if (results.has_more) {
        nextPage = results.next_page
      } else {
        finished = true
      }
    }

    finished = false
    let startingAfter = null
    while(finished === false) {
      // let search_param = startingAfter ? { }
    }

    const balance = await stripe.balance.retrieve({ stripeAccount: user.stripe.account_id })
    let data = {}
    for (let i=0; i<balance.available.length; i++) {
      if (balance.available[i].currency === 'usd') data.available = balance.available[i].amount || 0
    }
    for (let i=0; i<balance.pending.length; i++) {
      if (balance.pending[i].currency === 'usd') data.pending = balance.pending[i].amount || 0
    }
    res.json(data)
  })
  .catch(next)
})


// Get Payment Intent
// May be able to delete
// router.get('/new_payment_intent', (req, res, next) => {
//   Promise.resolve()
//   .then( async () => {
//     const user = await User.findById(req.user._id).select(['+stripe.payment_intent_id', '+stripe.customer_id'])
//     let oldIntent = null
//     if (user.stripe.payment_intent_id) {
//       oldIntent = await stripe.paymentIntents.retrieve(user.stripe.payment_intent_id)
//       if ( ['requires_payment_method', 'requires_confirmation'].includes(oldIntent.status) ) {
//         await stripe.paymentIntents.cancel(oldIntent.id)
//       }
//     }

//     const newIntent = await stripe.paymentIntents.create({
//       amount: 100,
//       currency: 'usd',
//       customer: user.stripe.customer_id,
//     })
//     await User.findByIdAndUpdate(req.user._id, {$set: {'stripe.payment_intent_id': newIntent.id} })
//     res.json({ client_secret: newIntent.client_secret })
//   })
//   .catch(next)
// })

// // Update Payment Intent
// // May be able to delete
// router.post('/update_payment_intent', (req, res, next) => {
//   Promise.resolve()
//   .then( async () => {
//     const user = await User.findById(req.user._id).select(['+stripe.payment_intent_id'])
//     let method
//     if (req.body.cardToken) {
//       method = await stripe.paymentMethods.create({
//         type: 'card',
//         card: { token: req.body.cardToken },
//         billing_details: { email: user.email}
//       })
//       if (method.card.funding !== 'prepaid' || method.card.country !== 'US') {
//         res.json({error: {message: 'Only US prepaid cards are permitted.'}})
//       }
//     }

//   })
//   .catch(next)
// })


// Create a card from token
// May be able to delete
// router.post('/create_card', (req, res, next)=>{
//   let token = req.body.token
//   Promise.resolve()
//   .then( async () => {
//     const user = await User.findById(req.user._id).select('+stripe.payment_intent_id').exec()
//     const method = await stripe.paymentMethods.create({ 
//       type: 'card',
//       card: {
//         token: token
//       },
//       billing_details: {
//         email: user.email
//       }
//     })

//     if (method.card.funding !== 'prepaid' || method.card.country !== 'US') {
//       res.json({error: {message: 'Only US prepaid cards are permitted.'}})
//     } else {
//       const updatedIntent = await stripe.paymentIntents.update(
//         user.stripe.payment_intent_id,
//         {payment_method: method.id}
//       )
//       res.json({has_payment_method: true})
//     }

//   })
//   .catch(next)
// })

////////////////////////////
//PLAID ROUTES//////////////
////////////////////////////
const PLAID_PRODUCTS = process.env.PLAID_PRODUCTS.split(',')
const PLAID_COUNTRY_CODES = process.env.PLAID_COUNTRY_CODES.split(',')
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID
const PLAID_SECRET = process.env.PLAID_SECRET
const PLAID_ENV = process.env.PLAID_ENV
const PLAID_REDIRECT_URI = process.env.PLAID_REDIRECT_URI || null
const PLAID_ANDROID_PACKAGE_NAME = process.env.PLAID_ANDROID_PACKAGE_NAME || ''


const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
      'PLAID-VERSION': '2020-09-14'
    }
  }
})

const client = new PlaidApi(configuration)

router.post('/get_plaid_info', (req, res, next)=>{
  res.send({
    item_id: null,
    access_token: null,
    products: PLAID_PRODUCTS
  })
})

router.post('/create_plaid_link_token', (req, res, next) => {
  Promise.resolve()
  .then(async () => {
    const configs = {
      user: { client_user_id: req.user._id},
      client_name: 'Savist',
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language: 'en'
    }

    if (PLAID_REDIRECT_URI !== '') {
      configs.redirect_uri = PLAID_REDIRECT_URI
    }

    if (PLAID_ANDROID_PACKAGE_NAME !== '') {
      configs.android_package_name = PLAID_ANDROID_PACKAGE_NAME
    }

    const createTokenResponse = await client.linkTokenCreate(configs)
    return res.send(createTokenResponse.data)
  })
  .catch(next)
})

router.post('/set_plaid_access_token', (req, res, next) => {
  Promise.resolve()
  .then(async function () {
    let account = req.body.accounts[0]
    let institution = req.body.institution
    let public_token = req.body.public_token

    const user = await User.findById(req.user._id).select('+stripe.account_id').exec()

    if (account.type !== 'depository') {
      if (account.subtype !== 'savings' && account.subtype !== 'checking') {
        res.json({err: true, msg: "You must link a checking or savings account"})
      }
    }

    const tokenResponse = await client.itemPublicTokenExchange({
      public_token: public_token
    })
    let accessToken = tokenResponse.data.access_token
    
    const stripeTokenResponse = await client.processorStripeBankAccountTokenCreate({
      access_token: accessToken,
      account_id: account.id
    })
    const bankAccountToken = stripeTokenResponse.data.stripe_bank_account_token

    const bankAccount = await stripe.accounts.createExternalAccount(
      user.stripe.account_id,
      {
        external_account: bankAccountToken,
        metadata: {
          ...account,
          institution_name: institution.name,
          institution_id: institution.id
        }
      }
    )

    res.json({err: false, msg: ''})
  })
  .catch(next)
})

module.exports = router