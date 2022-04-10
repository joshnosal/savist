import { CircularProgress, Box, Button, useTheme } from '@mui/material'
import { useReducer, useEffect, useContext } from 'react'
import { AppContext } from '../../../universal/AppContext'
import FormHeader from "../../../components/form_header"

const reducer = (s, a) => ({ ...s, ...a})

export default function ConfirmationPage(props) {
  const { userToken } = useContext(AppContext)
  const { uniqueID, setUniqueID } = props
  const [ state, dispatch ] = useReducer(reducer, {
    loading: true,
    backend: false,
    paymentIntent: null,
    processing: false,
    processing_error: null
  })
  // const { state, dispatch, sx, userToken, user, resetState } = props

  useEffect( async () => {
    const response = await fetch('/stripe/get_payment_intent', {
      method: 'POST',
      headers: { Authorization: `JWT ${userToken}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({ uniqueID: uniqueID })
    })

    if(!response.ok) {
      dispatch({ loading: false, backend: false})
    }
    let data = await response.json()
    if (data.error) {
      setUniqueID()
    } else {
      dispatch({
        loading: false,
        backend: true,
        paymentIntent: data
      })
    }

  }, [])

  const handleSubmit = async () => {
    dispatch({ processing: true, processing_error: null })
    const response = await fetch('/stripe/confirm_payment_intent', {
      method: 'POST',
      headers: { Authorization: `JWT ${userToken}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({ uniqueID: uniqueID })
    })
    if (!response.ok) return dispatch({ processing: false, processing_error: 'An unexpected error occured. Please try again later.' })
    let data = await response.json()
    if (data.error) {
      dispatch({ processing: false, processing_error: data.error.message })
    } else {
      setUniqueID('success')
    }
  }

  const getDollars = (val) => {
    let text = ''+(val / 100)
    if (text.indexOf('.') === -1) text = text + '.00'
    if (text.indexOf('.') !== -1 && text.indexOf('.') === text.length - 2) text = text + '0'
    text = text.split('.')
    text[0] = text[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    text = text.join('.')
    return '$'+text
  }

  return state.loading ? (
    <Container maxWidth={props.maxWidth}>
      <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px'}}>
        <CircularProgress/>
      </Box>
    </Container>
  ) : !state.backend ? (
    <Container maxWidth={props.maxWidth}>
      <Box sx={{color: 'error.main'}}>An Unexpected error occured. Please try later.</Box>
    </Container>
  ) : (
    <Container maxWidth={props.maxWidth}>
      <FormHeader title='Confirm Details'/>
      <SummaryRow text='Name' val={state.paymentIntent.description}/>
      <SummaryRow text='Charge Amount' val={getDollars(state.paymentIntent.amount)}/>
      <SummaryRow text={'Fee ('+state.paymentIntent.fee_label+')'} val={'('+getDollars(state.paymentIntent.fee)+')'} negative={true}/>
      <SummaryRow text='Deposit Amount' val={getDollars(state.paymentIntent.amount - state.paymentIntent.fee)} result={true}/>
      <ErrorRow text={state.processing_error}/>
      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        paddingTop: '20px'
      }}>
        <Button
          color='secondary'
          // variant='contained'
          size='small'
          sx={{ marginRight: '20px' }}
          onClick={()=>setUniqueID()}
        >Back</Button>
        <Button
          color='secondary'
          variant='contained'
          size='small'
          onClick={handleSubmit}
          disabled={state.processing}
        >{state.processing ? <CircularProgress size={24}/> : 'Submit'}</Button>
      </Box>
    </Container>
  )
}

const ErrorRow = (props) => {
  const { text } = props
  const theme = useTheme()
  return (
    <Box sx={{
      color: theme.palette.error.main,
      display: 'flex',
      alignItems: 'center',
      minHeight: '40px'
    }}>{text}</Box>
  )
}

const SummaryRow = (props) => {
  const { text, val, negative, result } = props
  const theme = useTheme()
  return (
    <Box sx={{display: 'flex', padding: '5px 0'}}>
      <Box sx={{
        color: theme.palette.grey[200],
        fontSize: '14px',
        textTransform: 'uppercase',
        fontWeight: result ? '600' : 'default',
        // fontStyle: 'italic'
      }}>{text ? text : 'Text'}</Box>
      <Box sx={{
        flexGrow: '1',
      }}/>
      <Box sx={{
        fontSize: result ? '16px' : '14px',
        fontWeight: result ? '600' : 'default',
        color: negative ? theme.palette.error.main : 'default'
      }}>{val ? val : 'Value'}</Box>
    </Box>
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