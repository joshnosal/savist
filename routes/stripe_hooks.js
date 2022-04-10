const stripe = require('stripe')(process.env.STRIPE_SECRET),
      express = require('express'),
      router = express.Router(),
      mongoose = require('mongoose'),
      passport = require('./passport'),
      userSchema = require('../schemas/user'),
      User = mongoose.model('User', userSchema)

router.post('/stripe_events', express.raw({type: 'application/json'}), (req, res, next) => {
  let event = req.body
  const endpointSecret = process.env.STRIPE_WH_SECRET

  if (endpointSecret) {
    const signature = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      // console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return res.sendStatus(400);
    }
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      // Then define and call a method to handle the successful payment intent.
      // handlePaymentIntentSucceeded(paymentIntent);
      break;
    case 'payout.created':
      const paymentMethod = event.data.object;
      console.log(event.data.object)
      // Then define and call a method to handle the successful attachment of a PaymentMethod.
      // handlePaymentMethodAttached(paymentMethod);
      break;
    default:
      // Unexpected event type
      // console.log(`Unhandled event type ${event.type}.`);
  }

  res.send()
})


module.exports = router
