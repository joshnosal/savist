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
  res.send({user: req.user})
})

router.post('/save_user', passport.authenticate('check', {session: false}), (req, res, next)=>{
  User.findById(req.user._id, (err, user) => {
    for (let key in req.body.user) {
      if (req.body.user[key] !== user[key]) {
        user[key] = req.body.user[key]
      }
    }
    user.save((err, doc) => {
      err ? res.sendStatus(400) : res.send(doc)
    })
  })
})

// router.post('/update_user', passport.authenticate('check', {session: false}), (req, res, next)=>{
//   User.findOneAndUpdate({_id: req.user._id}, req.body.update, {new: true}).exec((err, result)=>{
//     if (err) { return res.sendStatus(400) }
//     Household.findById(result.default_household, (err, doc)=>{
//       res.send({
//         user: result,
//         default_household: doc
//       })
//     })
//   })
// })

module.exports = router   