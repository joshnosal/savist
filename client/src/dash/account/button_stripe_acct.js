import { useState, useEffect, useContext, useReducer } from 'react'
import { Box, Button, CircularProgress } from "@mui/material"
import { AppContext } from '../../universal/AppContext'
import FormInstructions from '../../components/form_instructions'

const initialState = { 
  loadingUpdate: true, 
  loadingSetup: true,
  charges_enabled: false,
  payouts_enabled: false,
  stripe_error: false
}

function reducer(s, a) {
  switch (a.type) {
    case 'set': return { ...s, ...a.state} 
    default: return { ...s }
  }
}

export default function StripeAccountBtn(props) {
  const [ state, dispatch ] = useReducer(reducer, initialState)
  const { userToken, brand } = useContext(AppContext)

  useEffect( async () => {
    const resp = await fetch('/stripe/account_enabled_check', {
      method: 'GET',
      headers: { Authorization: `JWT ${userToken}` },
    })
    if (!resp.ok) return dispatch({ type: 'set', state: { loadingUpdate: false, loadingSetup: false, stripe_error: true } })
    let status = await resp.json()
    dispatch({ type: 'set', state: { 
      loadingUpdate: false, 
      loadingSetup: false,
      stripe_error: false, 
      charges_enabled: status.charges_enabled,
      payouts_enabled: status.payouts_enabled
    }})
  }, [dispatch])


  const openLink = (prop) =>  async () => {
    const resp = await fetch('/stripe/account_link', {
      method: 'POST',
      headers: { Authorization: `JWT ${userToken}`, "Content-Type": 'application/json' },
      body: JSON.stringify({ redirect: window.location.href, type: prop })
    })
    if (!resp.ok) return 
    let link = await resp.json()
    window.location.assign(link.url)
  }


  return (
    <Box sx={{display: 'flex', flexDirection: 'column'}}>
      <Box>
        <Button
          variant='contained'
          size='small'
          color='secondary'
          disabled={state.loadingSetup}
          onClick={openLink('account_onboarding')}
          disabled={state.stripe_error || state.loadingSetup || state.charges_enabled}
        >
          { state.loadingSetup ? <CircularProgress size={22}/> : 'Setup' }
        </Button>
        <Button
          variant='contained'
          size='small'
          color='secondary'
          disabled={state.loadingUpdate}
          onClick={openLink('account_update')}
          disabled={state.stripe_error || state.loadingUpdate}
          sx={{marginLeft: '20px'}}
        >
          { state.loadingUpdate ? <CircularProgress size={22}/> : 'Update' }
        </Button>
      </Box>
      <FormInstructions marginTop={10}>{`NOTE: Apart from your ${brand} credentials and billing address above, all of your personal and sensitive data is securely stored with Stripe and will not be shared.`}</FormInstructions>
      { state.stripe_error && (
        <Box sx={{
          color: 'error.main',
          marginLeft: '20px'
        }}>Connection error. Please try back later.</Box>
      )}
      
    </Box>
  )
}