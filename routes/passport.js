const passport = require('passport'),
      mongoose = require('mongoose'),
      userSchema = require('../schemas/user'),
      JWTstrategy = require('passport-jwt').Strategy,
      ExtractJWT = require('passport-jwt').ExtractJwt,
      User = mongoose.model('User', userSchema),
      localStrategy = require('passport-local').Strategy,
      bcrypt = require('bcrypt'),
      jwt = require('jsonwebtoken'),
      async = require('async'),
      stripe = require('stripe')(process.env.STRIPE_SECRET)

passport.use('check', new JWTstrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderWithScheme('JWT'),
  secretOrKey: process.env.COOKIE_SECRET
}, function(token, done){
  User.findById(token.id, (err, user)=>{
    user ? done(null, user) : done(err, false)
  })
}))

passport.use('signup', new localStrategy({
  passReqToCallback: true,
  usernameField: 'email'
}, (req, em, pass, done) => {
  let email = req.body.email.toLowerCase(),
      password = req.body.password

  User.find({email: email}, (err, users)=>{
    
    if(err) {
      // console.log('Line 30: ',err)
      done("We're sorry, something went wrong. Please try again.")
    } else if (users.length) {
      done("This email is already taken.")
    } else {
      stripe.customers.create({email: email})
        .then(customer => {
          let user = new User({
            email: email,
            password: password,
            validated: true,
            stripe_id: customer.id
          })
          user.save((err, doc)=>done(err, doc))
        })
        .catch(e => done("We're sorry, something went wrong. Please try again."))

      // let user = new User({
      //   email: email,
      //   password: password,
      //   validated: true
      // })
      // user.save((err, doc)=>{
      //   console.log('Err: ', err)
      //   console.log('Doc: ', doc)
      // })
    }
  })
  
}))

passport.use('signin', new localStrategy({
  passReqToCallback: true,
  usernameField: 'email'
}, (req, username, password, done) => {
  
  User.findOne({email: username.toLowerCase()}).select('+password').exec((err, user) => {
    if (err) return done(null, null, "We're sorry, something went wrong. Please try again.")
    if (!user) return done(null, null, null)
    bcrypt.compare(password, user.password, function(err, same){
      if (err) { 
        done(null, null, "We're sorry, something went wrong. Please try again.")
      } else if (same) {
        let duration = req.body.remember ? '14d' : '1d'
        const token = jwt.sign({id: user._id}, process.env.COOKIE_SECRET, {expiresIn: duration})
        done(null, user, token)
      } else {
        done(null, null, null)
      }
    })
  })

}))

module.exports = passport