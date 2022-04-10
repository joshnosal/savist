const express = require('express'),
      passport = require('./passport'),
      mongoose = require('mongoose'),
      router = express.Router(),
      userSchema = require('../schemas/user'),
      User = mongoose.model('User', userSchema),
      async = require('async')

router.post('/signup', (req, res, next) => {
  passport.authenticate('signup', {session: false}, (err, user, info) => {
    if (err) {
      res.send({err: true, msg: err})
    } else {
      res.send({err: false, msg: ''})
    }
  }) (req, res)
})

router.post('/signin', (req, res, next) => {
  passport.authenticate('signin', {session: false}, (err, user, info) => {
    if (!user && info) {
      res.send({err: true, msg: info})
    } else if (user && info) {
      delete user.password
      res.send({err: false, msg: info, obj: {user: user}})
    } else {
      res.send({err: true, msg: "Incorrect username or password."})
    }
  }) (req, res)
})

router.get('/get_user', passport.authenticate('check', {session: false}), (req, res, next)=>{
  res.send({user: req.user, brand: process.env.BRAND})
})

router.get('/check', passport.authenticate('check', {session: false}), (req, res, next)=>{
  res.sendStatus(200)
})

router.post('/update', passport.authenticate('check', {session: false}), (req, res, next)=>{
  console.log(req.body.updates)
  Promise.resolve()
  .then( async () => {
    let user = await User.findById(req.user._id)
    let updateKeys = Object.keys(req.body.updates)
    updateKeys.map(key => {
      user[key] = req.body.updates[key]
    })
    user = await user.save()
    res.json({user: user})
  })
  .catch(next)  
})

router.post('/update_billing_address', passport.authenticate('check', {session: false}), (req, res, next)=>{
  Promise.resolve()
  .then( async() => {
    let user = await User.findById(req.user._id)
    user.billing_address = req.body.update
    await user.save()
  })
})


module.exports = router   