import { Box, useTheme, alpha, Button, InputBase, InputAdornment } from '@mui/material'
import { Elements, CardExpiryElement, CardNumberElement, CardCvcElement, PaymentRequestButtonElement } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useReducer } from 'react'


const stripePromise = loadStripe('pk_test_51KfXHDKvgqo0azpYWnUODCrVSl8iwHKQ74oEza3wHhSSJYXGehCF2ZjDJCNKYOiFA7JHScdqwekcjxmLQwZ75i1m00YAfrdgVx')

const createStyle = (theme) => ({
  container: {
    marginRight: '20px',
  },
  input_base: {
    border: '1px solid '+alpha(theme.palette.background.contrast, 0.5),
    borderRadius: '14px',
    paddingLeft: '8px',
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
  input_amount: {
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

const initialState = {
  focusedElement: null,
  amount: 1,
  errors: {
    cardExpiry: null,
    cardNumber: null,
    cardCvc: null,
    amount: null
  },
}

const reducer = (state, action) => {
  switch (action.type) {
    case 'set': return { ...state, ...action.state}
    case 'set_error': return { ...state, errors: {...state.errors, ...action.state} }
    default: return { ...state }
  }
}

export default function PaymentForm(props) {
  const { clientSecret } = props
  const theme = useTheme()
  const style = createStyle(theme)
  const [ state, dispatch ] = useReducer(reducer, initialState)

  const handleChange = (e) => {
    console.log(e.error)
    dispatch({ type: 'set_error', state: { [e.elementType]: e.error } })
  }
  const handleFocus = (e) => {
    dispatch({ type: 'set', state: { focusedElement: e.elementType } })
  }
  const handleBlur = (e) => {
    dispatch({ type: 'set', state: { focusedElement: null } })
  }
  const handleAmountChange = (e) => {
    let number = Number(e.target.value)
    let value = e.target.value
    if (isNaN(number)){
      dispatch({ type: 'set_error', state: { amount: { code: 'not_a_number', type: 'amount_error', message: 'You must enter a valid number'}}})
    } else {
      let stringLength = value.length
      if (value.indexOf('.') < stringLength - 3 && value.indexOf('.') != -1) {
        value = value.slice(0,value.indexOf('.')+3)
      }
      
      if (number < 1) {
        dispatch({ type: 'set', state: {
          amount: value,
          errors: {
            ...state.errors,
            amount: { code: 'small_number', type: 'amount_error', message: 'Your amount is too small.' }
          }
        }})
      } else {
        dispatch({ type: 'set', state: {
          amount: value,
          errors: {
            ...state.errors,
            amount: null
          }
        }})
      }
      
    }
  }

  return (
    <Elements stripe={stripePromise} options={{
      clientSecret: clientSecret,
      fonts: [
        {cssSrc: "https://fonts.googleapis.com/css2?family=Dosis:wght@200;300;400;500;600;700;800&display=swap"}
      ]
    }}>
      <Box sx={{display: 'flex', flexDirection: 'column'}}>
        <Box sx={{display: 'flex', marginBottom: '20px'}}>
          <InputContainer
            width='340px'
            title='Charge Amount'
            error={state.errors.amount}
          >
            <InputBase
              placeholder={'0.00'}
              fullWidth={true}
              margin='none'
              sx={style.input_amount}
              onChange={handleAmountChange}
              startAdornment={<InputAdornment position='start'>$</InputAdornment>}
              value={state.amount || 1}
            />
          </InputContainer>
        </Box>
        <Box sx={{display: 'flex', marginBottom: '20px'}}>
          <InputContainer 
            width='340px' 
            focused={state.focusedElement === 'cardNumber'}
            error={state.errors.cardNumber}
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
        </Box>
        <Box sx={{display: 'flex', marginBottom: '20px'}}>
          <InputContainer 
            width='160px' 
            focused={state.focusedElement === 'cardExpiry'}
            error={state.errors.cardExpiry}
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
            error={state.errors.cardCvc}
            title='CVC'
          >
            <CardCvcElement
              options={{ style: style.card }}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </InputContainer>
        </Box>
        <Box sx={{display: 'flex', marginBottom: '20px', alignItems: 'flex-end'}}>
          {/* <PaymentRequestButtonElement /> */}
        </Box>
      </Box>
    </Elements>
  )
}

function InputContainer(props){
  const theme = useTheme()
  const style = createStyle(theme)
  const { focused, error, complete, title } = props
  return (
    <Box sx={{...style.container, width: props.width}}>
      <Box sx={{
        color: alpha(theme.palette.primary.main, 0.4),
        fontSize: '18px',
        fontWeight: '400',
        paddingLeft: '10px',
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