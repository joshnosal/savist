const stripe = require('stripe')(process.env.STRIPE_SECRET),
      express = require('express'),
      router = express.Router(),
      mongoose = require('mongoose'),
      passport = require('./passport'),
      userSchema = require('../schemas/user'),
      User = mongoose.model('User', userSchema)

router.get('/check', (req, res, next) => {
  res.send(200)
})


module.exports = router