const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const saltRounds = 10
const stripe = require('stripe')(process.env.STRIPE_SECRET)
const async = require('async')

const userSchema = new mongoose.Schema({
  email: String,
  stripe_id: String,
  password: {type: String, select: false},
  validated: {type: Boolean, default: false},
}, {timestamps: true})

userSchema.pre('save', function(next){
  this.email = this.email.toLowerCase()
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