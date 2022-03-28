const { response } = require('express')

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
    console.log(account)
    res.json({charges_enabled: account.charges_enabled, payouts_enabled: account.payouts_enabled})
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

// Get onboarding link
router.post('/get_account_onboarding_link', (req, res, next)=>{
  async.waterfall([
    (done) => {
      User.findOne({_id: req.user._id}).select('+stripe').exec((err, user) => done(err, user))      
    },
    (user, done) => {
      user.stripe.account_id && user.validated ? done(null, user) : done('User not validated')
    }, 
    (user, done) => {
      stripe.accountLinks.create({
        account: user.stripe.account_id,
        refresh_url: process.env.LOCAL_DOMAIN+req.body.redirect,
        return_url: process.env.LOCAL_DOMAIN+req.body.redirect,
        type: 'account_onboarding'
      })
        .then(obj => done(null, obj))
        .catch(err => done(err))
    }
  ], (error, result) => {
    console.log(result)
    error ? res.sendStatus(400) : res.send({url: result.url})
  })
})

// Get account update link
router.post('/get_account_update_link', (req, res, next)=>{
  async.waterfall([
    (done) => {
      User.findOne({_id: req.user._id}).select('+stripe').exec((err, user) => done(err, user))      
    },
    (user, done) => {
      user.stripe.account_id || user.validated ? done(null, user) : done('User not validated')
    }, 
    (user, done) => {
      stripe.accountLinks.create({
        account: user.stripe.account_id,
        refresh_url: process.env.LOCAL_DOMAIN+req.body.redirect,
        return_url: process.env.LOCAL_DOMAIN+req.body.redirect,
        type: 'account_update'
      })
        .then(obj => done(null, obj))
        .catch(err => done(err))
    }
  ], (error, result) => {
    error ? res.sendStatus(400) : res.send({url: result.url})
  })
})

// Get list of customer's connected deposit accounts
router.get('/get_external_accounts', (req, res, next)=>{
  
  Promise.resolve()
  .then(async () => {
    const user = await User.findById(req.user._id).select('+stripe').exec()
    const accountBankAccounts = await stripe.accounts.listExternalAccounts(
      user.stripe.account_id,
      { object: 'bank_account' }
    )
    let acctList = accountBankAccounts.data.map((item) => ({
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
  console.log(req.body)
  Promise.resolve()
  .then(async () => {
    const user = await User.findById(req.user._id).select('+stripef').exec()
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
    const user = await User.findById(req.user._id).select('+stripe').exec()
    const updated = await stripe.accounts.updateExternalAccount(
      user.stripe.account_id,
      req.body.accountID,
      { default_for_currency: true }
    )
    res.json()
  })
  .catch(next)
})

// Create client secret
router.get('/create_setup_intent', (req, res, next)=>{
  Promise.resolve()
  .then(async () => {
    const user = await User.findById(req.user._id).select('+stripe').exec()
    if (!user.stripe.customer_id) return res.sendStatus(400)
    const oldIntent = await stripe.setupIntents.retrieve(user.stripe.setup_intent_id)
    if (oldIntent && oldIntent.status !== 'succeeded') {
      res.json({client_secret: oldIntent.client_secret})
    } else {
      const setupIntent = await stripe.setupIntents.create({
        email: {},
        customer: user.stripe.customer_id,
        payment_method_types: ['card'],
        usage: 'on_session',
      })
      await User.updateOne({_id: req.user._id}, {stripe: {...req.user.stripe, setup_intent_id: setupIntent.id} })
      res.json({client_secret: setupIntent.client_secret})
    }
  })
  .catch(e => {
    console.log(e)
    next()
  })
})

// Create a card from token
router.post('/create_card', (req, res, next)=>{
  let token = req.body.token
  Promise.resolve()
  .then( async () => {
    const user = await User.findById(req.user._id).select('+stripe').exec()
    const method = await stripe.paymentMethods.create({ 
      type: 'card',
      card: {
        token: token
      },
      billing_details: {
        email: user.email
      },
      metadata: {
        description: req.body.nickname,
        last_charged: null
      }
    })

    if (method.card.funding !== 'prepaid' || method.card.country !== 'US') {
      res.json({error: {message: 'Only US prepaid cards are permitted.'}})
    } else {
      await stripe.paymentMethods.attach(
        method.id,
        { customer: user.stripe.customer_id }
      )
      res.json({})
    }

  })
  .catch(next)
})

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

    const user = await User.findById(req.user._id).select('+stripe').exec()

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