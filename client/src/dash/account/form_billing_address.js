import { Box, Button, CircularProgress, useTheme, alpha } from '@mui/material'
import { useReducer, useContext, useEffect } from 'react'
import { AppContext } from '../../universal/AppContext'
import InputContainer from '../../components/input_container'
import InputBase from '../../components/input_base'

const reducer = (s, a) => {
  switch (a.type) {
    case 'set': return { ...s, ...a.state}
    default: return { ...s }
  }
}

export default function BillingAddressForm(props) {
  const { user, updateUser } = useContext(AppContext)
  const theme = useTheme()
  const [ state, dispatch ] = useReducer(reducer, {
    first_name: user.billing_address.first_name || '',
    last_name: user.billing_address.last_name || '',
    line1: user.billing_address.line1 || '',
    line2: user.billing_address.line2 || '',
    city: user.billing_address.city || '',
    state: user.billing_address.state || '',
    postal_code: user.billing_address.postal_code || '',
    country: user.billing_address.country || 'US',
    focusedElement: null,
    changed: false,
    loading: false,
    error_message: ''
  })

  const inputs = [
    {name: 'first_name', width: '230px', maxChar: 40, disabled: false, title: 'First Name'},
    {name: 'last_name', width: '230px', maxChar: 40, disabled: false, title: 'Last Name'},
    {name: 'line1', width: '230px', maxChar: 40, disabled: false, title: 'Address Line 1'},
    {name: 'line2', width: '230px', maxChar: 40, disabled: false, title: 'Address Line 2'},
    {name: 'city', width: '140px', maxChar: 40, disabled: false, title: 'City'},
    {name: 'state', width: '120px', maxChar: 40, disabled: false, title: 'State'},
    {name: 'postal_code', width: '100px', maxChar: 40, disabled: false, title: 'Zip'},
    {name: 'country', width: '60px', maxChar: 40, disabled: true, title: 'Country'},
  ]

  const handleChange = (prop) => (e) => {
    for (let i=0; i<inputs.length; i++) {
      if (inputs[i].name !== prop) continue
      let input = inputs[i]
      if (e.target.value.length > input.maxChar) return
      dispatch({ type: 'set', state: { [prop]: e.target.value } })
    }
  }

  useEffect(() => {
    let vals = inputs.map((input) => (input.name))
    let keys = Object.keys(state).filter(item => vals.includes(item))
    // let keys = Object.keys(user.billing_address)
    let changed = false
    for (let i=0; i<keys.length; i++) {
      if (!user.billing_address[keys[i]]) {
        if (state[keys[i]]) changed = true
      } else {
        if (state[keys[i]] !== user.billing_address[keys[i]]) changed = true
      }
    }
    if (changed !== state.changed) dispatch({ type: 'set', state: { changed: changed } })
  }, [state, dispatch])

  useEffect(() => {
    let userKeys = Object.keys(user.billing_address)
    let stateKeys = Object.keys(state)
    let newState = {loading: false}
    for (let i=0; i<userKeys.length; i++) {
      for (let j=0; j<stateKeys.length; j++) {
        if (stateKeys[j] === userKeys[i]) {
          newState[userKeys[i]] = user.billing_address[userKeys[i]]
          j = stateKeys.length
        }
      }
    }
    dispatch({ type: 'set', state: newState})
  }, [user, dispatch])

  const saveChanges = () => {
    dispatch({ type: 'set', state: { loading: true } })
    let updates = {}
    inputs.map(input => {
      updates[input.name] = state[input.name]
    })
    updateUser({billing_address: updates}, (errMsg) => {
      dispatch({ type: 'set', state: { error_message: errMsg, loading: false}})
    })
  }

  const handleBlur = (prop) => (e) => dispatch({ type: 'set', state: {focusedElement: null}})
  const handleFocus = (prop) => (e) => dispatch({ type: 'set', state: {focusedElement: prop}})

  return (
    <Box>
      <Box sx={{maxWidth: '500px', display:'flex', flexWrap:'wrap'}}>
        {inputs.map((input, idx) => (
          <InputContainer
            key={idx}
            disabled={input.disable}
            width={input.width}
            focused={state.focusedElement === input.name}
            title={input.title}
          >
            <InputBase
              fullWidth={Boolean(input.width)}
              disabled={input.disabled}
              value={state[input.name]}
              onFocus={handleFocus(input.name)}
              onBlur={handleBlur(input.name)}
              onChange={handleChange(input.name)}
              // placeholder={input.placeholder}
            />
          </InputContainer>
          // <InputBase
          //   key={idx}
          //   disabled={input.disabled}
          //   fullWidth={false}
          //   sx={{
          //     width: input.width,
          //     border: '1px solid '+alpha(theme.palette.background.contrast, 0.5),
          //     borderRadius: '18px',
          //     padding: '0 18px',
          //     marginRight: '20px',
          //     marginBottom: '20px',
          //     '&.Mui-focused': {
          //       backgroundColor: alpha(theme.palette.background.contrast, 0.1),
          //       borderColor: theme.palette.background.contrast
          //     }
          //   }}
          //   placeholder={input.placeholder}
          //   onChange={handleChange(input.name)}
          //   value={state[input.name]}
          // />
        ))}
      </Box>
      <Box>
        <Button
          color='secondary'
          size='small'
          variant='contained'
          disabled={!state.changed || state.loading}
          onClick={saveChanges}
        >
          {state.loading ? <CircularProgress size={24}/> : 'Save'}
        </Button>
      </Box>
    </Box>
  )
}