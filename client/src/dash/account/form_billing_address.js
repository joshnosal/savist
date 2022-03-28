import { Box, InputBase, Button, CircularProgress, useTheme, alpha } from '@mui/material'
import { useReducer, useContext, useEffect } from 'react'
import { AppContext } from '../../universal/AppContext'

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
    address_line1: user.billing_address.address_line1 || '',
    address_line2: user.billing_address.address_line2 || '',
    address_city: user.billing_address.address_city || '',
    address_state: user.billing_address.address_state || '',
    address_zip: user.billing_address.address_zip || '',
    address_country: user.billing_address.address_country || 'US',
    changed: false,
    loading: false,
    error_message: ''
  })

  const inputs = [
    {name: 'first_name', width: '230px', maxChar: 40, disabled: false, placeholder: 'First Name...'},
    {name: 'last_name', width: '230px', maxChar: 40, disabled: false, placeholder: 'Last Name...'},
    {name: 'address_line1', width: '230px', maxChar: 40, disabled: false, placeholder: 'Address Line 1...'},
    {name: 'address_line2', width: '230px', maxChar: 40, disabled: false, placeholder: 'Address Line 2...'},
    {name: 'address_city', width: '180px', maxChar: 40, disabled: false, placeholder: 'City...'},
    {name: 'address_state', width: '160px', maxChar: 40, disabled: false, placeholder: 'State...'},
    {name: 'address_zip', width: '100px', maxChar: 40, disabled: false, placeholder: 'Zip...'},
    {name: 'address_country', width: '60px', maxChar: 40, disabled: true, placeholder: 'Country...'},
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
    let keys = Object.keys(user.billing_address)
    let changed = false
    for (let i=0; i<keys.length; i++) {
      if (keys[i] === 'complete') continue
      if (user.billing_address[keys[i]] !== state[keys[i]]) changed = true
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
    let updates = {...state}
    let keys = Object.keys(user.billing_address)
    let stateKeys = Object.keys(updates)
    for (let j=0; j<stateKeys.length; j++) {
      let found = false
      for (let i=0; i<keys.length; i++) {
        if (stateKeys[j] === keys[i]) found = true
      }
      if (!found) delete updates[stateKeys[j]]
    }
    updateUser({billing_address: updates}, (errMsg) => {
      dispatch({ type: 'set', state: { error_message: errMsg, loading: false}})
    })
  }

  return (
    <Box>
      <Box sx={{maxWidth: '500px'}}>
        {inputs.map((input, idx) => (
          <InputBase
            key={idx}
            disabled={input.disabled}
            fullWidth={false}
            sx={{
              width: input.width,
              border: '1px solid '+alpha(theme.palette.background.contrast, 0.5),
              borderRadius: '18px',
              padding: '0 18px',
              marginRight: '20px',
              marginBottom: '20px',
              '&.Mui-focused': {
                backgroundColor: alpha(theme.palette.background.contrast, 0.1),
                borderColor: theme.palette.background.contrast
              }
            }}
            placeholder={input.placeholder}
            onChange={handleChange(input.name)}
            value={state[input.name]}
          />
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