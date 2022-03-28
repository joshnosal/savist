const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const saltRounds = 10
const stripe = require('stripe')(process.env.STRIPE_SECRET)
const async = require('async')

const userSchema = new mongoose.Schema({
  email: String,
  billing_address: { type: Map, default: {
    first_name: '',
    last_name: '',
    address_line1: '',
    address_line2: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    address_country: 'US',
    complete: false
  }},
  stripe: {
    customer_id: {type: String, select: false},
    account_id: {type: String, select: false},
    setup_intent_id: {type: String, select: false},
    payment_intent_id: {type: String, select: false},
  },
  password: {type: String, select: false},
  validated: {type: Boolean, default: false},
}, {timestamps: true})

userSchema.pre('save', function(next){
  // Make email lowercase
  this.email = this.email.toLowerCase()

  // Check if billing address is complete
  let keys = Object.keys(this.billing_address)
  let complete = true
  for (let i=0; i<keys.length; i++) {
    if (keys[i] === 'complete') continue
    if (!this.billing_address[keys[i]]) complete = false
  }
  this.billing_address.complete = complete

  // Encrypt password
  if ((this.isNew && this.validated) || this.isModified('password')) {
    const doc = this
    bcrypt.hash(doc.password, saltRounds, function(err, hashedPassword){
      if (err) return next(err)
      doc.password = hashedPassword
      next()
    })
  } else {
    next()
  }
})

module.exports = userSchema