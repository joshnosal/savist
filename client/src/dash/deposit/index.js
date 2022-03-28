import { Box, Select, MenuItem, CircularProgress, Button, InputBase, alpha, InputAdornment, useTheme } from '@mui/material'
import { useEffect, useReducer, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../../universal/AppContext'

const initialState = {
  card: null,
  cards: [],
  focusedElement: null,
  amount: {value: null, error: null},
}

const reducer = (s, a) => {
  switch (a.type) {
    case 'set': return { ...s, ...a.state }
    default: return { ...s }
  }
}

const createStyle = (theme) => ({
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
  }
})

export default function DepositRouter(props) {
  const [ state, dispatch ] = useReducer(reducer, initialState)
  const { userToken } = useContext(AppContext)

  const handleFocus = (prop) => (e) => {
    dispatch({ type: 'set', state: { focusedElement: prop } })
  }
  const handleBlur = (prop) => (e) => {
    dispatch({ type: 'set', state: { focusedElement: null } })
  }

  return (
    <Box sx={{display: 'flex', flexDirection: 'column'}}>
      <Box sx={{display: 'flex', alignItems: 'center'}}>
        <CardSelection state={state} dispatch={dispatch} userToken={userToken}/>
      </Box>
      <InputContainer
        width='200px'
        focused={state.focusedElement === 'amount'}
        error={state.amount.error}
        title='Charge Amount'
      >
        <AmountInput 
          state={state} 
          dispatch={dispatch}
          onFocus={handleFocus('amount')}
          onBlur={handleBlur('amount')}
        />
      </InputContainer>
      <ChargeSummary state={state} dispatch={dispatch} userToken={userToken}/>
      <Box>This amount is non-refundable. You will need to add a bank account to deposit these funds once they are available.</Box>
    </Box>
  )
}

const AmountInput = (props) => {
  const { state, dispatch } = props
  const theme = useTheme()
  const sx = createStyle(theme)

  const handleChange = (e) => {
    let text = e.target.value
    text = text.split(',').join('')
    let number = Number(text)
    if (isNaN(number) || ( text.indexOf('.') !== -1 && text.length > text.indexOf('.') + 3)) return //Stop if not a number
    

    
    if (text.indexOf('.') !== -1  ) {
      text = text.split('.')
      text[0] = text[0].split(',')
      text[0] = text[0].join('')
      text[0] = text[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      text = text.join('.')
    } else {
      text = text.split(',')
      text = text.join('')
      text = text.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }
    if (number > 999.99) {
      dispatch({ type: 'set', state: { amount: {value: state.amount.value, error: {message: 'The max you can charge is $999.99'} } }})
    } else if (number < 1) {
      dispatch({ type: 'set', state: { amount: {value: text, error: {message: 'Amount must be greater than $1.00'}} } })
    } else {
      dispatch({ type: 'set', state: { amount: {value: text, error: null} } })
    }
  }

  return (
    <InputBase
      placeholder={'0.00'}
      fullWidth={false}
      onChange={handleChange}
      startAdornment={<InputAdornment position='start'>$</InputAdornment>}
      value={state.amount.value || ''}
      onBlur={props.handleBlur}
      onFocus={props.handleFocus}
      sx={sx.input_text_field}
    />
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

const CardSelection = (props) => {
  const { state, dispatch, userToken } = props
  const [ error, setError ] = useState()
  const [ loadingCards, setLoadingCards ] = useState(true)
  const navigate = useNavigate()

  useEffect(async () => {
    const response = await fetch('/stripe/get_available_cards', {
      method: 'GET',
      headers: { Authorization: `JWT ${userToken}`}
    })
    if(!response.ok) {
      setError('An unexpected error occured. Please try again later.')
      setLoadingCards(false)
      return
    }
    const data = await response.json()
    console.log(data)
    setError()
    setLoadingCards(false)
    dispatch({ type: 'set', state: { cards: data.cards, card: data.cards[0] }})
  }, [])


  const handleSelect = (e) => {
    for(let i=0; i<state.cards.length; i++) {
      if (state.cards[i].id === e.target.value.id) {
        dispatch({ type: 'set', state: { card: state.cards[i] } })
        console.log(state.cards[i])
      }
    }
  }

  return (
    <>
      <Select
        value={loadingCards ? 'loading': !state.cards.length ? 'none' : state.card}
        autoWidth={true}
        onChange={handleSelect}
        sx={{width: '300px'}}
        disabled={loadingCards || !state.cards.length}
        renderValue={(value) => {
          switch(value){
            case 'loading': return (
              <Box sx={{display: 'flex', justifyContent: 'center'}}>
                <CircularProgress size={24}/>
              </Box>
            )
            case 'none': return (
              <Box>No Cards Available</Box>
            )
            default: {
              return (
                <Box sx={{display: 'flex', fontWeight: '300'}}>
                  <Box sx={{marginRight: '5px'}}>{value.nickname ? value.nickname + ' ' : 'No Name'}</Box>
                  <Box sx={{textTransform: 'capitalize'}}>( {value.brand} ...{value.last4} )</Box>
                </Box>
              )
            }
          }
        }}
      >
        {loadingCards && (
          <MenuItem value='loading' sx={{display: 'flex', justifyContent: 'center'}} >
            <CircularProgress size={24}/>
          </MenuItem>
        )}
        {!state.cards.length && (
          <MenuItem value='none'>No Cards Available</MenuItem>
        )}
        {state.cards.map((card, idx) => (
          <MenuItem value={card} sx={{minWidth: '300px'}} key={idx}>
            <Box sx={{marginRight: '5px'}}>{card.nickname ? card.nickname + ' ' : 'No Name'}</Box>
            <Box sx={{textTransform: 'capitalize'}}>({card.brand} ...{card.last4})</Box>
          </MenuItem>
        ))}
      </Select>
      <Button
        color='secondary'
        variant='contained'
        size='small'
        sx={{marginLeft: '20px'}}
        onClick={() => navigate('/dash/new_card')}
      >New Card</Button>
    </>
  )
}

const ChargeSummary = (props) => {
  const { state, dispatch, userToken } = props
  const [ values, setValues ] = useState()

  useEffect( async () => {
    const response = await fetch('/stripe/check_account_activity', {
      method: 'GET',
      headers: { Authorization: `JWT ${userToken}`}
    })

  })

  useEffect(()=>{
    let amount = Number(state.amount)
    let stripeFee = amount * 0.029

  }, [state.amount])

  return (
    <Box sx={{display: 'flex', flexDirection: 'column'}}>
      <Box>ChargeSummary</Box>

    </Box>
  )
}