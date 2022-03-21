const stripe = require('stripe')(process.env.STRIPE_SECRET),
      express = require('express'),
      router = express.Router(),
      mongoose = require('mongoose'),
      passport = require('./passport'),
      userSchema = require('../schemas/user'),
      User = mongoose.model('User', userSchema),
      async = require('async')

router.get('/check_account_status', passport.authenticate('check', {session: false}), (req, res, next)=>{
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
    
    console.log(result)
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
    console.log(error)
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
    console.log(error)
    error ? res.sendStatus(400) : res.send(result.url)
  })
})

module.exports = router