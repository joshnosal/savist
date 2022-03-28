import React, { useState, useEffect, useContext } from 'react'
import { Box, useTheme, Button, CircularProgress } from '@mui/material'
import axios from 'axios'
import { AppContext } from '../../universal/AppContext'
import PlaidAcctBtn from './button_plaid_acct'
import StripeBtn from './button_stripe_acct'
import AcctsTable from './table_accounts'
import BillingAddressForm from './form_billing_address'

export default function AccountPage(props){
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [authAccount, setAuthAccount] = useState(false)
  const source = axios.CancelToken.source()
  const { user, userToken } = useContext(AppContext)

  // Check if user's account has been fully validated
  // useEffect(() => checkStripeAccountStatus(), [])
  // const checkStripeAccountStatus = () => {
  //   axios.get('/stripe/check_charges_enabled', {headers: {Authorization: `JWT ${userToken}`}, cancelToken: source.token})
  //   .then(res => {
  //     setAuthAccount(true)
  //     setLoading(false)
  //   })
  //   .catch(err => {
  //     setAuthAccount(false)
  //     setLoading(false)
  //   })
  //   return () => source.cancel()
  // }
  
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      flexGrow: '1',
      overflow: 'auto',
    }}>
      <Box sx={{
        color: theme.palette.grey[200],
        borderBottom: '1px solid '+theme.palette.grey[800],
        fontSize: '14px',
        paddingBottom: '5px'
      }}>Billing Address</Box>
      <Box sx={{margin: '20px 0 40px 0', minHeight: '40px'}}>
        <BillingAddressForm/>
      </Box>
      <Box sx={{
        color: theme.palette.grey[200],
        borderBottom: '1px solid '+theme.palette.grey[800],
        fontSize: '14px',
        paddingBottom: '5px'
      }}>Stripe</Box>
      <Box sx={{margin: '20px 0 40px 0', minHeight: '40px'}}>
        <StripeBtn/>
      </Box>
      <Box sx={{
        color: theme.palette.grey[200],
        borderBottom: '1px solid '+theme.palette.grey[800],
        fontSize: '14px',
      }}>Deposit Accounts</Box>
      <Box sx={{margin: '20px 0', minHeight: '40px'}}>
        <PlaidAcctBtn
          text={'Add Account'}
        />
      </Box>
      <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <AcctsTable/>
      </Box>
      
      
    </Box>
  )
}