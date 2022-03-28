import { Box, Button, CircularProgress, InputBase, useTheme, alpha } from "@mui/material"
import { useEffect, useReducer, useContext, useState } from "react"
import { AppContext } from "../../universal/AppContext"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements, CardExpiryElement, CardCvcElement, CardNumberElement } from '@stripe/react-stripe-js'
import { useNavigate } from "react-router-dom"

const stripePromise = loadStripe('pk_test_51KfXHDKvgqo0azpYWnUODCrVSl8iwHKQ74oEza3wHhSSJYXGehCF2ZjDJCNKYOiFA7JHScdqwekcjxmLQwZ75i1m00YAfrdgVx')


const reducer = (s, a) => {
  switch (a.type) {
    case 'set': return { ...s, ...a.state }
    // case 'set_error': return { ...s, errors: {...s.errors, ...a.state} }
    default: return { ...s }
  }
}

export default function NewCardPage(props) {
  const { userToken, user } = useContext(AppContext)
  const initState = {
    loading: true,
    loading_error: null,
    processing: false,
    processing_error: null,
    client_secret: null,
    focusedElement: null,
    nickname: { value: null, error: null },
    name: { value: user.billing_address.first_name + ' ' + user.billing_address.last_name, error: null },
    address1: { value: user.billing_address.address_line1, error: null },
    address2: { value: user.billing_address.address_line2, error: null },
    postal_code: { value: user.billing_address.address_zip, error: null },
    cardExpiry: { value: null, error: null },
    cardNumber: { value: null, error: null },
    cardCvc: { value: null, error: null }
  }
  const [ state, dispatch ] = useReducer(reducer, initState)
  const theme = useTheme()

  useEffect( async () => {
    const response = await fetch('/stripe/create_setup_intent', { 
      method: 'GET', 
      headers: { Authorization: `JWT ${userToken}`, 'Content-Type': 'application/json'},
    })
    if (!response.ok) {
      dispatch({ type: 'set', state: { loading: false, client_secret: null}})
      return
    }
    const data = await response.json()
    dispatch({ type: 'set', state: { loading: false, client_secret: data.client_secret}})
  }, [])

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
          // appearance: appearance
        }}>
          <CardForm state={state} dispatch={dispatch} user={user} userToken={userToken}/>
        </Elements>
      ) : (
        <Box>An Unexpected error occured. Please try later.</Box>
      )}
    </Box>
  )
}

const createStyle = (theme) => ({
  container: {
    marginRight: '20px',
  },
  input_base: {
    border: '1px solid '+alpha(theme.palette.background.contrast, 0.5),
    borderRadius: '18px',
    paddingLeft: '18px',
  },
  input_focus: {
    backgroundColor: alpha(theme.palette.background.contrast, 0.1),
    borderColor: theme.palette.background.contrast
  },
  input_error: {
    borderColor: theme.palette.error.main
  },
  input_complete: {
    borderColor: alpha(theme.palette.background.contrast, 0.1)
  },
  input_text_field: {
    '& fieldset': { display: 'none' },
    '& input': { 
      padding: '0', 
      height: '36px',
      fontSize: '18px'
    },
  },
  card: {
    base: {
      color: 'white',
      lineHeight: '36px',
      fontSize: '18px',
      fontFamily: theme.typography.fontFamily
    },
    invalid: {
      color: theme.palette.error.main
    }
  }
})

const CardForm = (props) => {
  const { state, dispatch, user, userToken } = props
  const stripe = useStripe()
  const elements = useElements()
  const theme = useTheme()
  const style = createStyle(theme)
  const navigate = useNavigate()

  const handleSubmit = async () => {
    // Exit if these items aren't loaded
    if (!stripe || !elements) return
    dispatch({ type: 'set', state: { processing: true, processing_error: null }})
    // Check for errors and missing fields
    let newStates = {}
    let keys = [ 'nickname', 'name', 'address1', 'postal_code' ]
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
      address_line1: state.address1.value,
      address_line2: state.address2.value,
      address_zip: state.postal_code.value,
      address_country: user.billing_address.address_country,
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
      body: JSON.stringify({token: result.token.id, nickname: state.nickname.value})
    })
    if (!response.ok) {
      dispatch({ type: 'set', state: { processing: false, processing_error: 'Connectivity issue. Please try again later.'}})
      return
    } 
    // Check if card was valid
    const data = await response.json()
    if (data.error) {
      dispatch({ type: 'set', state: { processing: false, processing_error: data.error.message } })
    } else {
      dispatch({ type: 'set', state: { processing: false, processing_error: null } })
      navigate('/dash/deposit')
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
    let error = !e.target.value && prop !== 'address2' && {message: 'Required'}
    dispatch({ type: 'set', state: { [prop]: {value: e.target.value, error: error} } })
  }

  const textInputs = [
    {code: 'name', width: null, title: 'Name on Card'},
    {code: 'address1', width: '160px', title: 'Address Line 1'},
    {code: 'address2', width: '160px', title: 'Address Line 2'},
    {code: 'postal_code', width: '160px', title: 'Zip'},
  ]

  return (
    <Box sx={{display: 'flex', flexDirection: 'column', maxWidth: '360px'}}>
      <Box sx={{display: 'flex', flexWrap: 'wrap'}}>
        <InputContainer
          title='Card Nickname'
          error={state.nickname.error}
          focused={state.focusedElement === 'nickname'}
          width={null}
        >
          <InputBase
            placeholder='Card nickname...'
            fullWidth={true}
            margin='none'
            sx={style.input_text_field}
            onChange={changeInputChange('nickname')}
            value={state.nickname.value || ''}
            onFocus={() => handleFocus({elementType: 'nickname'})}
            onBlur={() => handleBlur({elementType: 'nickname'})}
          />
        </InputContainer>
        <InputContainer 
          width='340px' 
          focused={state.focusedElement === 'cardNumber'}
          error={state.cardNumber.error}
          title='Card Number'
        >
          <CardNumberElement
            options={{
              style: style.card
            }}
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
        >
          <CardExpiryElement
            options={{ style: style.card }}
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
        >
          <CardCvcElement
            options={{ style: style.card }}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </InputContainer>
        {textInputs.map((input, idx) => (
        <InputContainer
          key={idx}
          title={input.title}
          error={state[input.code].error}
          focused={state.focusedElement === input.code}
          width={input.width}
        >
          <InputBase
            placeholder={input.title + '...'}
            fullWidth={!input.width ? true : false}
            margin='none'
            sx={style.input_text_field}
            onChange={changeInputChange(input.code)}
            value={state[input.code].value || ''}
            onFocus={() => handleFocus({elementType: input.code})}
            onBlur={() => handleBlur({elementType: input.code})}
          />
        </InputContainer>
      ))}
      </Box>
      <Box sx={{display: 'flex', alignItems: 'flex-start'}}>
        <Button
          color='secondary'
          variant='contained'
          size='small'
          disabled={!stripe || !elements || !state.nickname}
          onClick={handleSubmit}
          sx={{minWidth: '100px'}}
        >{state.processing ? <CircularProgress size={24}/> : 'Save Card'}</Button>
        {state.processing_error && (
          <Box sx={{
            padding: '0 20px 0 10px', 
            justifySelf: 'center', 
            alignItems: 'center',
            color: theme.palette.error.main
          }}>{state.processing_error}</Box>
        )}
      </Box>
    </Box>
  )

}

function InputContainer(props){
  const theme = useTheme()
  const style = createStyle(theme)
  const { focused, error, title } = props
  return (
    <Box sx={{...style.container, minWidth: props.width, maxWidth: props.width, flexGrow: props.width ? null : 1, marginBottom: '20px'}}>
      <Box sx={{
        color: alpha(theme.palette.primary.main, 0.8),
        fontSize: '18px',
        fontWeight: '400',
        paddingLeft: '18px',
      }}>{title}</Box>
      <Box sx={{
        ...style.input_base, 
        ...(focused && style.input_focus), 
        ...(error && style.input_error),
      }}>
        {props.children}
      </Box>
      {error && (
        <Box sx={{
          color: theme.palette.error.main,
          fontSize: '12px',
          fontWeight: '500',
          padding: '0 10px'
        }}>{error.message}</Box>
      )}
    </Box>
  )
}