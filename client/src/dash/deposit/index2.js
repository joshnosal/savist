import { Box, useTheme, InputBase, InputAdornment, Button } from '@mui/material'
import { useReducer, useState } from 'react'
import PaymentElement from './payment_element'

const initialState = {
  step: 0,
  cardNickname: '',
  amount: '',
  stepComplete: false,
  clientSecret: null,
  backLabel: 'Back',
  nextLabel: 'Next'
}

const reducer = (s, a) => {
  switch (a.type) {
    case 'set': return { ...s, ...a.state }
    default: return { ...s }
  }
}

const createStyles = (theme) => ({
  formRow: {
    display: 'flex',
    flexDirection: 'column',
  }
})

const steps = [
  {count: 0, title: 'Card Nickname', instructions: 'You can choose any name you want. The nickname will show up in your deposit history.' },
  {count: 1, title: 'Card Info', instructions: 'Insert your prepaid debit card information here.'},
  {count: 2, title: 'Deposit Amount', instructions: 'The card will be declined if this amount exceeds the current balance.'},
]


export default function DepositPage(props) {
  const [ state, dispatch ] = useReducer(reducer, initialState)
  const theme = useTheme()
  const sx = createStyles(theme)

  const handleNext = () => {

    dispatch({ 
      type: 'set', 
      state: { step: state.step + 1, stepComplete: false } 
    })
  }

  const handleBack = () => dispatch({
    type: 'set',
    state: { step: state.step - 1, stepComplete: true }
  })

  return (
    <Box sx={{display: 'flex', maxWidth: '600px'}}>
      <Box sx={{
        display: 'flex', 
        flexDirection: 'column', 
        width: '400px',
        paddingRight: '20px'
      }}>
          {state.step >= 0 && (
            <InputRow step={0} state={state} dispatch={dispatch}>
              <NicknameInput state={state} dispatch={dispatch}/>
            </InputRow>
          )}
          {state.step > 0 && (
            <InputRow step={1} state={state} dispatch={dispatch}>
              <PaymentElement state={state} dispatch={dispatch}/>
            </InputRow>
          )}
          {state.step > 1 && (
            <InputRow step={2} state={state} dispatch={dispatch}>
              <AmountInput state={state} dispatch={dispatch}/>
            </InputRow>
          )}
        <NavRow
          state={state}
          dispatch={dispatch}
          handleBack={handleBack}
          handleNext={handleNext}
        />
      </Box>
      <Box sx={{
        flexGrow: 1,
        borderLeft: '1px solid '+theme.palette.grey[800],
        padding: '0 20px'
      }}>
        {steps.map((step, idx) => (
          <Box sx={{
            color: state.step === step.count ? theme.palette.background.contrast : theme.palette.grey[500],
            fontWeight: '300'
          }} key={idx}>{step.title}</Box>
        ))}
      </Box>
    </Box>
  )
}

const NicknameInput = (props) => {
  const { state, dispatch} = props

  const handleChange = (prop) => (e) => {
    dispatch({ type: 'set', state: { [prop]: e.target.value, stepComplete: e.target.value ? true : false } })
  }

  return (
    <InputBase
      sx={{border: '1px solid white', alignSelf: 'flex-start', width: '300px' }}
      placeholder='Card Nickname'
      fullWidth={false}
      onChange={handleChange('cardNickname')}
      disabled={state.step !== 0}
      value={state.cardNickName}
    />
  )
}

const AmountInput = (props) => {
  const { state, dispatch } = props
  const [ error, setError ] = useState()
  const theme = useTheme()

  const handleChange = (prop) => (e) => {
    let text = e.target.value
    text = text.split(',').join('')
    let number = Number(text)
    console.log('Value: ', text)
    if (isNaN(number) || ( text.indexOf('.') !== -1 && text.length > text.indexOf('.') + 3)) return //Stop if not a number
    number < 1 ? setError('Number must be greater than $1.00') : setError()  //Set error if number is below 1
    
    if (text.indexOf('.') !== -1  ) {
      text = text.split('.')
      text[0] = text[0].split(',')
      text[0] = text[0].join('')
      text[0] = text[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      text = text.join('.')
      console.log(text)
    } else {
      text = text.split(',')
      text = text.join('')
      text = text.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }

    dispatch({
      type: 'set',
      state: {
        amount: text,
        stepComplete: number >= 1 ? true : false
      }
    })
  }

  return (
    <>
    <InputBase
      sx={{border: '1px solid white', alignSelf: 'flex-start', width: '200px' }}
      placeholder={'0.00'}
      fullWidth={false}
      onChange={handleChange('amount')}
      disabled={state.step !== 1}
      value={state.amount}
      startAdornment={<InputAdornment position='start'>$</InputAdornment>}
    />
    <Box sx={{fontSize: '14px', color: theme.palette.error.main, lineHeight: '30px' }}>{error}</Box>
    </>
  )
}

const InputRow = (props) => {
  const { step, state, dispatch } = props
  const theme = useTheme()
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      marginBottom: '20px',
      opacity: step === state.step ? 1 : 0.3
    }}>
      <Box sx={{
        fontSize: '18px',
        color: step === state.step ? theme.palette.primary.main : theme.palette.background.contrast,
        lineHeight: '36px'
      }}>{steps[step].title}</Box>
      <Box>{steps[step].instructions}</Box>
      {props.children}
    </Box>
  )
}

const NavRow = (props) => {
  const { state, handleNext, handleBack } = props

  return (
    <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
      {state.step > 0 && (
        <Button
          color='secondary'
          variant='contained'
          size='small'
          sx={{alignSelf: 'flex-end', marginRight: '10px'}}
          onClick={handleBack}
        >{state.backLabel}</Button>
      )}
      {state.step < 2 && (
        <Button
          color='secondary'
          variant='contained'
          size='small'
          sx={{alignSelf: 'flex-end'}}
          disabled={!state.stepComplete}
          onClick={handleNext}
        >{state.nextLabel}</Button>
      )}
      
    </Box>
  )
}