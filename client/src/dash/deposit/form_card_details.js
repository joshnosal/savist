import { Box, Button, CircularProgress,  useTheme, alpha } from "@mui/material"
import { useEffect, useReducer, useContext, useState } from "react"
import { AppContext } from "../../universal/AppContext"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements, CardExpiryElement, CardCvcElement, CardNumberElement } from '@stripe/react-stripe-js'
import { useNavigate } from "react-router-dom"
import InputBase from '../../components/input_base'
import InputContainer from '../../components/input_container'

const stripePromise = loadStripe('pk_test_51KfXHDKvgqo0azpYWnUODCrVSl8iwHKQ74oEza3wHhSSJYXGehCF2ZjDJCNKYOiFA7JHScdqwekcjxmLQwZ75i1m00YAfrdgVx')

export default function NewCardPage(props) {
  const { userToken, user } = useContext(AppContext)
  const { state, dispatch, sx } = props
  
  return (
    <Box sx={{display: 'flex', flexDirection: 'column'}}>
      {state.loading ? (
        <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px'}}>
          <CircularProgress/>
        </Box>
      ) : state.client_secret ? (
        <Elements stripe={stripePromise} options={{
          clientSecret: state.client_secret,
          fonts: [ { cssSrc: "https://fonts.googleapis.com/css2?family=Dosis:wght@200;300;400;500;600;700;800&display=swap" }],
        }}>
          <CardForm state={state} dispatch={dispatch} user={user} userToken={userToken} sx={sx}/>
        </Elements>
      ) : (
        <Box>An Unexpected error occured. Please try later.</Box>
      )}
    </Box>
  )
}


const CardForm = (props) => {
  const { state, dispatch, user, userToken, sx } = props
  const stripe = useStripe()
  const elements = useElements()
  const theme = useTheme()
  const navigate = useNavigate()
  console.log(state.method)

  const handleSubmit = async () => {
    // Exit if these items aren't loaded
    if (!stripe || !elements) return
    dispatch({ type: 'set', state: { processing: true, processing_error: null }})
    // Check for errors and missing fields
    let newStates = {}
    let keys = [ 'name', 'line1', 'postal_code' ]
    keys.map(key => {
      if (!state[key].value) newStates[key] = {value: null, error: {message: 'Required'}}
    })
    const element = elements.getElement('cardNumber')
    let stripeKeys = [ 'cardExpiry', 'cardNumber', 'cardCvc' ]
    for (let i=0; i<stripeKeys.length; i++) {
      const result = await stripe.createToken(element)
      if (result.error) newStates[stripeKeys[i]] = {value: null, error: result.error}
    }
    if (Object.keys(newStates).length) {
      dispatch({ type: 'set', state: {
        processing: false, 
        professing_error: 'See missing fields above',
        ...newStates
      }})
      return
    }
    // Create card token
    const result = await stripe.createToken( element, {
      name: state.name.value,
      address_line1: state.line1.value,
      address_line2: state.line2.value,
      address_zip: state.postal_code.value,
      address_country: user.billing_address.country,
      currency: 'usd'
    })
    if (result.error) {
      return dispatch({ type: 'set', state: { processing: false, processing_error: result.error.message } })
    } else if (!result.token.id) {
      return dispatch({ type: 'set', state: { processing: false, processing_error: 'An unexpected error occured.' } })
    }
    // Create the card
    const response = await fetch('/stripe/create_card', {
      method: 'POST',
      headers: { Authorization: `JWT ${userToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({token: result.token.id, client_secret: state.client_secret})
    })
    if (!response.ok) {
      dispatch({ type: 'set', state: { processing: false, processing_error: 'Connectivity issue. Please try again later.'}})
      return
    } 
    // Check if card was valid
    const data = await response.json()
    if (data.error) {
      dispatch({ type: 'set', state: { 
        processing: false, 
        processing_error: data.error.message 
      }})
    } else {
      dispatch({ type: 'set', state: { 
        processing: false, 
        processing_error: null,
      }})
      navigate('../charge_details', {replace: true})
    }
  }

  const handleFocus = (e) => {
    dispatch({ type: 'set', state: { focusedElement: e.elementType } })
  }
  const handleBlur = (e) => {
    dispatch({ type: 'set', state: { focusedElement: null } })
  }
  const handleChange = (e) => {
    dispatch({ type: 'set', state: { [e.elementType]: { ...[e.elementType].value, error: e.error } } })
  }
  const changeInputChange = (prop) => (e) => {
    let error = !e.target.value && prop !== 'line2' && {message: 'Required'}
    dispatch({ type: 'set', state: { [prop]: {value: e.target.value, error: error}, processing_error: null } })
  }

  const textInputs = [
    {code: 'name', width: null, title: 'Name on Card'},
    {code: 'line1', width: '160px', title: 'Address Line 1'},
    {code: 'line2', width: '160px', title: 'Address Line 2'},
    {code: 'postal_code', width: '160px', title: 'Zip'},
  ]

  return (
    <Box sx={{display: 'flex', flexDirection: 'column', maxWidth: '360px'}}>
      
      <Box sx={{
        color: theme.palette.grey[200],
        borderBottom: '1px solid '+theme.palette.grey[800],
        fontSize: '14px',
        paddingBottom: '5px',
        marginBottom: '5px'
      }}>Card Details</Box>
      {state.has_payment_method && <CardExpiration method_expiry={state.method_expiry} state={state} dispatch={dispatch}/>}
      <Box sx={{display: 'flex', flexWrap: 'wrap'}}>
        <InputContainer 
          width='340px' 
          focused={state.focusedElement === 'cardNumber'}
          error={state.cardNumber.error}
          title='Card Number'
          sx={sx}
        >
          <CardNumberElement
            options={{ style: sx.card }}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </InputContainer>
        <InputContainer 
          width='160px' 
          focused={state.focusedElement === 'cardExpiry'}
          error={state.cardExpiry.error}
          title='Expiration'
          sx={sx}
        >
          <CardExpiryElement
            options={{ style: sx.card }}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </InputContainer>
        <InputContainer 
          width='160px' 
          focused={state.focusedElement === 'cardCvc'}
          error={state.cardCvc.error}
          title='CVC'
          sx={sx}
        >
          <CardCvcElement
            options={{ style: sx.card }}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </InputContainer>
      </Box>
      <Box sx={{
          color: theme.palette.grey[200],
          borderBottom: '1px solid '+theme.palette.grey[800],
          fontSize: '14px',
          paddingBottom: '5px',
          marginBottom: '5px',
          marginTop: '20px'
        }}>Billing Address</Box>
      <Box sx={{display: 'flex', flexWrap: 'wrap'}}>
        {textInputs.map((input, idx) => (
        <InputContainer
          key={idx}
          title={input.title}
          error={state[input.code].error}
          focused={state.focusedElement === input.code}
          width={input.width}
          sx={sx}
        >
          <InputBase
            placeholder={input.title + '...'}
            fullWidth={!input.width ? true : false}
            margin='none'
            sx={sx.input_text_field}
            onChange={changeInputChange(input.code)}
            value={state[input.code].value || ''}
            onFocus={() => handleFocus({elementType: input.code})}
            onBlur={() => handleBlur({elementType: input.code})}
          />
        </InputContainer>
      ))}
      </Box>
      <Box sx={{display: 'flex', alignItems: 'flex-start', justifyContent:'flex-end', paddingRight: '20px'}}>
        {state.processing_error && (
          <Box sx={{
            padding: '0 20px 0 0', 
            justifySelf: 'center', 
            alignItems: 'flex-start',
            fontSize: '12px',
            flexGrow: 1,
            color: theme.palette.error.main
          }}>{state.processing_error}</Box>
        )}
        <Button
          color='secondary'
          variant='contained'
          size='small'
          disabled={!stripe || !elements || !state.nickname || state.processing}
          onClick={handleSubmit}
          sx={{minWidth: '100px'}}
        >{state.processing ? <CircularProgress size={24}/> : state.has_payment_method ? 'Update' : 'Confirmation'}</Button>
        {state.has_payment_method && (
          <Button
            color='secondary'
            variant='contained'
            size='small'
            disabled={!state.has_payment_method}
            onClick={()=>navigate('../charge_details')}
            sx={{minWidth: '100px', marginLeft: '10px'}}
          >Next</Button>
        )}
      </Box>
    </Box>
  )

}

function CardExpiration(props) {
  const { method_expiry, state, dispatch } = props
  const [ seconds, setSeconds ] = useState(Math.round(method_expiry * 60))
  const theme = useTheme()

  useEffect(() => {
    let interval = setInterval(() => {
      if (seconds === 1) dispatch({type: 'set', state: { refresh_payment_intent: !state.refresh_payment_intent}})
      setSeconds(seconds => seconds-1)
    }, 1000)
    return () => clearInterval(interval)
  }, [seconds])

  const getMinutes = (time) => {
    let mins = Math.floor(time / 60)
    let sec = time % 60

    return mins + ':' + ( sec < 10 ? '0' + sec : sec)
  }

  return (
    <Box sx={{
      color: 'success.main',
      backgroundColor: alpha(theme.palette.success.main, 0.1),
      border: '1px solid '+alpha(theme.palette.success.main, 0.4),
      borderRadius: '10px',
      padding: '2px 5px',
      marginBottom: '10px'
    }}>{'Card saved ( expires in '+getMinutes(seconds)+' minutes )'}</Box>
  )
}
