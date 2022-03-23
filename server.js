// TESTING ENVIRONMENTAL VARIABLES
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

// SERVER RESOURCES
const express = require('express')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const userRouter = require('./routes/user')
const stripeRouter = require('./routes/stripe')
const path = require('path')

const PORT = process.env.PORT || 4001
const app = express()

app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(passport.initialize())

app.use('/user', userRouter)
app.use('/stripe', stripeRouter)

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.resolve(__dirname, "./client/build")))
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname,  "./client/build", "index.html"))
  })
}

const dbURL = process.env.NODE_ENV !== 'production' ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL
mongoose.connect(dbURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
let db = mongoose.connection
db.on('connected', ()=>{
  app.listen(PORT, ()=>{
    console.log(`Server listening at port ${PORT}.`)
  })
})