import React, { useState, useEffect, useContext } from 'react'
import { Box, useTheme, Button, CircularProgress } from '@mui/material'
import axios from 'axios'
import { AppContext } from '../../universal/AppContext'
import PlaidAcctBtn from './button_plaid_acct'
import StripeBtn from './button_stripe_acct'
import AcctsTable from './table_accounts'
import BillingAddressForm from './form_billing_address'
import FormHeader from '../../components/form_header'

export default function AccountPage(props){
  const theme = useTheme()
  
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      flexGrow: '1',
      overflowY: 'auto',
      paddingBottom: '100px'
    }}>
      <FormHeader title='Billing Address'/>
      {/* <Box sx={{
        color: theme.palette.grey[200],
        borderBottom: '1px solid '+theme.palette.grey[800],
        fontSize: '14px',
        paddingBottom: '5px'
      }}>Billing Address</Box> */}
      <Box sx={{margin: '20px 0 40px 0', minHeight: '260px', flexShrink: '0'}}>
        <BillingAddressForm/>
      </Box>
      <FormHeader title='Stripe'/>
      <Box sx={{margin: '20px 0 40px 0', minHeight: '60px', flexShrink: '0'}}>
        <StripeBtn/>
      </Box>
      <FormHeader title='Deposit Accounts'/>
      <Box sx={{margin: '20px 0', minHeight: '40px', flexShrink: '0'}}>
        <PlaidAcctBtn
          text={'Add Account'}
        />
      </Box>
      <Box sx={{display: 'flex', flexDirection: 'column'}}>
        <AcctsTable/>
      </Box>
      
      
    </Box>
  )
}