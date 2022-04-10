import { Box, Button, useTheme, CircularProgress } from "@mui/material"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import { useNavigate } from "react-router-dom"

export default function DepositConfirmation(props) {
  const { state, dispatch, sx, userToken, user, setUniqueID } = props
  const theme = useTheme()
  const elements = useElements()
  const stripe = useStripe()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    // Exit if these items aren't loaded
    if (!stripe || !elements) return
    dispatch({ type: 'set', state: { processing: true, processing_error: null }})

    // Check for errors and missing text fields
    let newStates = {}
    let keys = [ 'nickname', 'amount', 'name', 'line1', 'postal_code', 'cardExpiry', 'cardNumber', 'cardCvc' ]
    keys.map(key => {
      if (state[key].error) {
        newStates[key] = {value: state[key].value, error: state[key].error}
      } else if (!state[key].value) {
        newStates[key] = {value: null, error: {message: 'Required'}}
      }
    })

    // Exit if errors were found
    if (Object.keys(newStates).length) {
      dispatch({ type: 'set', state: {
        processing: false, 
        professing_error: 'See missing fields above',
        ...newStates
      }})
      return
    }
    
    // Create card token
    const element = elements.getElement('cardExpiry')
    const cardResult = await stripe.createToken( element, {
      name: state.name.value,
      address_line1: state.line1.value,
      address_line2: state.line2.value,
      address_zip: state.postal_code.value,
      address_country: user.billing_address.country,
      currency: 'usd'
    })
    if (cardResult.error) {
      return dispatch({ type: 'set', state: { processing: false, processing_error: cardResult.error.message } })
    } else if (!cardResult.token.id) {
      return dispatch({ type: 'set', state: { processing: false, processing_error: 'An unexpected error occured.' } })
    }

    // Submit the card token
    const response = await fetch('/stripe/create_payment_intent', {
      method: 'POST',
      headers: { Authorization: `JWT ${userToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardToken: cardResult.token.id,
        amount: state.amount.value,
        nickname: state.nickname.value
      })
    })
    if (!response.ok) {
      return dispatch({ type: 'set', state: { processing: false, processing_error: 'An unexpected error occured.' } })
    }
    const data = await response.json()
    if (data.error) {
      dispatch({ type: 'set', state: { processing: false, processing_error: data.error.message} })
    } else {
      dispatch({ type: 'set', state: { processing: false, processing_error: null} })
      setUniqueID(data.uniqueID)
    }
  }

  return (
    <Box sx={{
      display: 'flex', 
      flexWrap:'wrap',
      flexShrink: '0',
      flexDirection: 'column'
    }}>
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
      <Box sx={{display: 'flex', justifyContent: 'flex-end', marginTop: '10px', padding: '0 20px'}}>
        <Button
          color='secondary'
          variant='contained'
          size='small'
          disabled={!stripe || !elements || !state.nickname || state.processing}
          onClick={handleSubmit}
          sx={{minWidth: '100px'}}
        >{state.processing ? <CircularProgress size={24}/> : state.has_payment_method ? 'Update' : 'Confirm'}</Button>
        {state.has_payment_method && (
          <Button
            color='secondary'
            variant='contained'
            size='small'
            disabled={!state.has_payment_method}
            onClick={()=>navigate('../charge_details')}
            sx={{minWidth: '100px', marginLeft: '10px'}}
          >Confirm</Button>
        )}
      </Box>
    </Box>
  )
}