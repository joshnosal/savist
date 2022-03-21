import React, { useState, useEffect, useContext } from 'react'
import { Box, useTheme, Button, CircularProgress } from '@mui/material'
import axios from 'axios'
import { AppContext } from '../../universal/AppContext'

export default function AccountPage(props){
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [authAccount, setAuthAccount] = useState(false)
  const source = axios.CancelToken.source()
  const { user, userToken } = useContext(AppContext)
  const [newAcctPopup, setNewAcctPopup] = useState(false)

  // Check if user's account has been fully validated
  useEffect(() => checkStripeAccountStatus(), [])
  const checkStripeAccountStatus = () => {
    axios.get('/stripe/check_account_status', {headers: {Authorization: `JWT ${userToken}`}, cancelToken: source.token})
    .then(res => {
      setAuthAccount(true)
      setLoading(false)
    })
    .catch(err => {
      setAuthAccount(false)
      setLoading(false)
    })
    return () => source.cancel()
  }

  // Send user to onboarding link
  const openStripeOnboardLink = () => {
    axios.get('/stripe/get_account_onboarding_link', {headers: {Authorization: `JWT ${userToken}`}, cancelToken: source.token})
    .then(res => {
      window.open(res.data, "_blank")
    })
    .catch(err => {})
  }

  const openStripeUpdateLink = () => {
    axios.get('/stripe/get_account_update_link', {headers: {Authorization: `JWT ${userToken}`}, cancelToken: source.token})
    .then(res => {
      window.open(res.data, "_blank")
    })
    .catch(err => {})
  }
  
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto',
    }}>
      <Box sx={{
        color: theme.palette.grey[600],
        borderBottom: '1px solid '+theme.palette.grey[800],
        fontSize: '14px',
      }}>Stripe Account Setup</Box>
      <Box sx={{margin: '20px 0'}}>
        <Button
          variant='contained'
          color={authAccount == 1 ? 'primary' : 'secondary'}
          onClick={authAccount ? openStripeOnboardLink : openStripeUpdateLink}
          disabled={authAccount == 1 ? true : false}
          size='small'
        >
          {loading ? <CircularProgress sx={{color: 'primary.main'}} size={24}/> 
            : authAccount  ? 'Update' 
            : 'Account Setup'}
        </Button>
      </Box>
      <Box sx={{
        color: theme.palette.grey[600],
        borderBottom: '1px solid '+theme.palette.grey[800],
        fontSize: '14px',
      }}>Deposit Accounts</Box>
      <Box sx={{margin: '20px 0'}}>
        <Button
          variant='contained'
          size='small'
          color='secondary'
          onClick={() => setNewAcctPopup(!newAcctPopup)}
        >
          New Account
        </Button>
      </Box>
      
    </Box>
  )
}