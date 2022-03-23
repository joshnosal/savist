const { response } = require('express')

const stripe = require('stripe')(process.env.STRIPE_SECRET),
      { Configuration, PlaidApi, PlaidEnvironments } = require('plaid'),
      express = require('express'),
      router = express.Router(),
      mongoose = require('mongoose'),
      passport = require('./passport'),
      userSchema = require('../schemas/user'),
      User = mongoose.model('User', userSchema),
      async = require('async')

router.get('/check_charges_enabled', passport.authenticate('check', {session: false}), (req, res, next)=>{
  async.waterfall([
    (done) => {
      User.findOne({_id: req.user._id}).select('+stripe_account_id').exec((err, user) => done(err, user))      
    },
    (user, done) => {
      user.stripe_account_id ? done(null, user) : done('No stripe account established')
    }, 
    (user, done) => {
      stripe.accounts.retrieve(user.stripe_account_id)
        .then(account => done(null, account))
        .catch(e => done(e))
    }
  ], (error, result) => {
    error || !result.charges_enabled ? res.sendStatus(400) :  res.send()
  })
})

router.get('/get_account_onboarding_link', passport.authenticate('check', {session: false}), (req, res, next)=>{
  async.waterfall([
    (done) => {
      User.findOne({_id: req.user._id}).select('+stripe_account_id').exec((err, user) => done(err, user))      
    },
    (user, done) => {
      user.stripe_account_id || user.validated ? done(null, user) : done('User not validated')
    }, 
    (user, done) => {
      stripe.accountLinks.create({
        account: user.stripe_account_id,
        refresh_url: process.env.LOCAL_DOMAIN+'/dash/my_account',
        return_url: process.env.LOCAL_DOMAIN+'/dash/my_account',
        type: 'account_onboarding'
      })
        .then(obj => done(null, obj))
        .catch(err => done(err))
    }
  ], (error, result) => {
    error ? res.sendStatus(400) : res.send(result.url)
  })
})

router.get('/get_account_update_link', passport.authenticate('check', {session: false}), (req, res, next)=>{
  async.waterfall([
    (done) => {
      User.findOne({_id: req.user._id}).select('+stripe_account_id').exec((err, user) => done(err, user))      
    },
    (user, done) => {
      user.stripe_account_id || user.validated ? done(null, user) : done('User not validated')
    }, 
    (user, done) => {
      stripe.accountLinks.create({
        account: user.stripe_account_id,
        refresh_url: process.env.LOCAL_DOMAIN+'/dash/my_account',
        return_url: process.env.LOCAL_DOMAIN+'/dash/my_account',
        type: 'account_update'
      })
        .then(obj => done(null, obj))
        .catch(err => done(err))
    }
  ], (error, result) => {
    error ? res.sendStatus(400) : res.send(result.url)
  })
})

////////////////////////////
//PLAID ROUTES//////////////
////////////////////////////
const PLAID_PRODUCTS = process.env.PLAID_PRODUCTS.split(',')
const PLAID_COUNTRY_CODES = process.env.PLAID_COUNTRY_CODES.split(',')
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID
const PLAID_SECRET = process.env.PLAID_SECRET
const PLAID_ENV = process.env.PLAID_ENV
const PLAID_REDIRECT_URI = null
const PLAID_ANDROID_PACKAGE_NAME = process.env.PLAID_ANDROID_PACKAGE_NAME || ''
let ACCESS_TOKEN = null
let PUBLIC_TOKEN = null
let ITEM_ID = null
let TRANSFER_ID = null

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

router.post('/get_plaid_info', passport.authenticate('check', {session: false}), (req, res, next)=>{
  res.send({
    item_id: ITEM_ID,
    access_token: ACCESS_TOKEN,
    products: PLAID_PRODUCTS
  })
})

router.post('/create_plaid_link_token', passport.authenticate('check', {session: false}), (req, res, next) => {
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

router.post('/set_plaid_access_token', passport.authenticate('check', {session: false}), (req, res, next) => {
  PUBLIC_TOKEN = request.body.public_token
  Promise.resolve()
  .then(async function () {
    const tokenResponse = await client.itemPublicTokenExchange({
      public_token: PUBLIC_TOKEN
    })
    ACCESS_TOKEN = tokenResponse.data.access_token
    ITEM_ID = tokenResponse.data.item_id
    response.json
  })
})

module.exports = router