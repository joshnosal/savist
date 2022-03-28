import { useState, useEffect, useContext } from 'react'
import { Box, CircularProgress, Button } from "@mui/material"
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { AppContext } from '../../universal/AppContext'

const stripePromise = loadStripe('pk_test_51KfXHDKvgqo0azpYWnUODCrVSl8iwHKQ74oEza3wHhSSJYXGehCF2ZjDJCNKYOiFA7JHScdqwekcjxmLQwZ75i1m00YAfrdgVx')

const appearance = {
  theme: 'stripe'
}

export default function PaymentController(props) {
  const { state, dispatch } = props
  const [ loading, setLoading ] = useState(true)
  const [ error, setError ] = useState()
  const [ clientSecret, setClientSecret ] = useState()
  const { userToken } = useContext(AppContext)

  useEffect( async () => {
    
    const response = await fetch('/stripe/create_setup_intent', { 
      method: 'POST', 
      headers: { Authorization: `JWT ${userToken}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({description: props.state.cardNickname }) 
    })
    if (!response.ok) {
      setLoading(false)
      setError({ type: 'backend', message: 'Connectivity issue. Please try again later.' })
    }
    const data = await response.json()
    dispatch({ type: 'set', state: { clientSecret: data.client_secret}})
    setLoading(false)
    setError()
  }, [])
  
  return !loading && state.clientSecret ? (
    <Elements stripe={stripePromise} options={{
      clientSecret: state.clientSecret, 
      appearance: appearance
    }}>
      <PaymentForm clientSecret={state.clientSecret}/>
    </Elements>
  ) : loading ? (
    <Box sx={{display: 'flex', justifyContent: 'center'}}>
      <CircularProgress/>
    </Box>
  ) : (
    <Box>{error ? error.message : 'Waiting for client...'}</Box>
  )
}

function PaymentForm(props) {
  const [ loading, setLoading ] = useState(false)
  const [ message, setMessage ] = useState(null)
  const { clientSecret } = props
  const stripe = useStripe()
  const elements = useElements()

  useEffect(() => {
    if (!stripe) return
    if (!clientSecret) return

    // stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
    //   switch (paymentIntent.status) {
    //     case 'succeeded':
    //       setMessage('Payment succeeded!')
    //       break
    //     case 'processing':
    //       setMessage('Your payment is processing.')
    //       break
    //     case 'requires_payment_method':
    //       setMessage('Your payment was not successful, please try again.')
    //       break
    //     default:
    //       setMessage('Something went wrong.')
    //       break
    //   }
    // })
  }, [stripe])

  const handleSubmit1 = async () => {
    if (!stripe || !elements) return
    setLoading(true)
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href }
    })
    if(error) console.log(error)
    if (error.type === 'card_error' || error.type === 'validation_error') {
      setMessage(error.message)
    } else {
      setMessage('An unexpected error occured.')
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!stripe || !elements) return
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {}
    })

    console.log(elements.getElement('cardNumber'))
    // const { error } = await stripe.createToken()
  }

  return (
    <Box>
      <PaymentElement/>
      <Button 
        color='secondary'
        variant='contained'
        size='small'
        sx={{alignSelf: 'flex-end', marginRight: '10px'}}
        onClick={handleSubmit}
      >
        {loading ? <CircularProgress size={24}/> : 'Submit Deposit'}
      </Button>
    </Box>
  )
}