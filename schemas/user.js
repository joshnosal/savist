const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const saltRounds = 10
const stripe = require('stripe')(process.env.STRIPE_SECRET)
const async = require('async')

const userSchema = new mongoose.Schema({
  email: String,
  admin: {type: Boolean, default: false},
  billing_address: {
    first_name: String,
    last_name: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postal_code: String,
    country: {type: String, default: 'US'},
    complete: {type: Boolean, default: false}
  },
  stripe: {
    customer_id: {type: String, select: false},
    account_id: {type: String, select: false},
    last_payment_date: {type: Date, select: false},
    payment_intent_id: {type: String, select: false},
  },
  password: {type: String, select: false},
  validated: {type: Boolean, default: false},
}, {timestamps: true})

userSchema.pre('save', function(next){
  // Make email lowercase
  this.email = this.email.toLowerCase()
  this.billing_address.country = 'US'

  // Reject admin change
  if (this.isModified('admin')) this.admin = false

  // Check if billing address is complete
  let complete = true
  let keys = [ 'first_name', 'last_name', 'line1', 'city', 'state', 'postal_code', 'country' ]
  keys.map(key => {
    if (!this.billing_address[key]) complete = false
  })
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