import { Box, Button, useTheme, CircularProgress } from "@mui/material"
import { useEffect, useContext, useReducer, useCallback } from 'react'
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { AppContext } from "../../../universal/AppContext"
import { useNavigate } from "react-router-dom"
import NameForm from './name'
import AmountForm from './amount'
import CardForm from "./card"
import BillingForm from './billing'
import FormHeader from "../../../components/form_header"
import ConfirmDetails from './confirm'

const stripePromise = loadStripe('pk_test_51KfXHDKvgqo0azpYWnUODCrVSl8iwHKQ74oEza3wHhSSJYXGehCF2ZjDJCNKYOiFA7JHScdqwekcjxmLQwZ75i1m00YAfrdgVx')

const reducer = (s, a) => {
  switch (a.type) {
    case 'set': return { ...s, ...a.state }
    default: return { ...s }
  }
}

export default function DepositDetails(props) {
  const { userToken, user } = useContext(AppContext)
  const [ state, dispatch ] = useReducer(reducer, {
    checking: true,
    account_validated: false,
    backend: false,
    loading: true,
    loading_error: null,
    processing: false,
    processing_error: null,
    client_secret: null,
    focusedElement: null,
    nickname: { value: null, error: null },
    name: { value: user.billing_address.first_name + ' ' + user.billing_address.last_name, error: null },
    line1: { value: user.billing_address.line1, error: null },
    line2: { value: user.billing_address.line2, error: null },
    postal_code: { value: user.billing_address.postal_code, error: null },
    cardExpiry: { value: null, error: null },
    cardNumber: { value: null, error: null },
    cardCvc: { value: null, error: null },
    amount: {value: null, error: null},
    refresh_payment_intent: false
  })
  const navigate = useNavigate()
  const controller = new AbortController()
  const { signal } = controller

  useEffect( () => {
    const fetchData = async () => {
      const response = await fetch('/stripe/check_account_capabilities', {
        method: 'GET',
        headers: { Authorization: `JWT ${userToken}`},
        signal
      })
  
      if (!response.ok) {
        return dispatch({ type: 'set', state: { checking: false } })
      }
  
      const data = await response.json()
      if (data.error) {
        return dispatch({ type: 'set', state: { checking: false, backend: true } })
      } else {
        return dispatch({ type: 'set', state: { checking: false, backend: true, account_validated: true } })
      }
    }

    fetchData().catch(e=>{})   
    
    return () => controller.abort()
  }, [dispatch])

  return state.checking ? (
    <Container maxWidth={props.maxWidth}>
      <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px'}}>
        <CircularProgress/>
      </Box>
    </Container>
  ) : !state.backend ? (
    <Box sx={{color: 'error.main', alignItems: 'center', justifyContent: 'center', height: '200px'}}>
      An unexpected error occured. Please try back later.
    </Box>
  ) : state.account_validated ? (
    <Container maxWidth={props.maxWidth}>
      <Elements stripe={stripePromise} options={{
        fonts: [ { cssSrc: "https://fonts.googleapis.com/css2?family=Dosis:wght@200;300;400;500;600;700;800&display=swap" }],
      }}>
        <FormHeader title='Name'/>
        <NameForm {...props} state={state} dispatch={dispatch}/>
        <FormHeader title='Amount'/>
        <AmountForm {...props} state={state} dispatch={dispatch}/>
        <FormHeader title='Card Details'/>
        <CardForm {...props} state={state} dispatch={dispatch}/>
        <FormHeader title='Billing Address'/>
        <BillingForm {...props} state={state} dispatch={dispatch}/>
        <ConfirmDetails {...props} state={state} dispatch={dispatch} user={user} userToken={userToken}/>
      </Elements>
    </Container>
  ) : (
    <Container maxWidth={props.maxWidth}>
      <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Box sx={{
          fontSize: '18px',
          marginBottom: '20px',
          maxWidth: `${props.maxWidth || 200}px`,
          textAlign: 'center'
        }}>
          It appears there is some information missing in your account. Please 
          complete your billing address and stripe setup on your account page. 
          (Note that this may take a few minutes to process on our end)
        </Box>
        <Button
          color='secondary'
          size='small'
          variant='contained'
          onClick={() => navigate('../my_account')}
        >Finish Account Setup</Button>
      </Box>
    </Container>
    
  )
}

const Container = (props) => {
  const width = props.maxWidth || 200
  return (
  <Box sx={{
    display: 'flex', 
    flexDirection: 'column',
    maxWidth: `${width}px`,
    overflowY: 'auto',
    paddingBottom: '100px'
  }}>{props.children}</Box>
)}
