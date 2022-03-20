import React from 'react'
import { Box } from '@mui/material'
import { Route, Routes } from 'react-router-dom'

import ResetPWForm from './reset_pw'
import SignInForm from './signin'
import SignUpForm from './signup'
import { Theme } from '../../universal/CustomTheme'

export default function SigninRouter(props){
  const sx = {
    header: {
      color: 'white',
      fontWeight: '500',
      fontSize: '36px'
    },
    inputRow: {
      marginTop: '20px',
    },
    submitRow: {
      marginTop: '20px',
      display: 'flex',
      justifyContent:'end'
    },
    submitButton: {
      backgroundColor: 'white',
      '&:hover': {
        backgroundColor: Theme.palette.grey[400],
      }
    },
    navButton: {
      color: 'background.dark',
      marginRight: '10px',
      '&:hover': { backgroundColor: 'rgba(0,0,0,0.2)' },
    },
    resetRow: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '20px',
    },
    resetLink: {
      fontSize: '12px',
      fontWeight: '600',
      '&:hover': { 
        color: 'white',
        cursor: 'pointer',
      },
    }
  }
  

  return (
    <Box sx={{
      backgroundColor: 'background.dark',
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Box sx={{
        backgroundColor: 'primary.main',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        width: '350px'
      }}>
        <Routes>
          <Route 
            index 
            element={<SignInForm sx={sx}/>}
          />
          <Route 
            path="/signup" 
            element={<SignUpForm sx={sx}/>}
          />
          <Route 
            path="/reset"
            element={<ResetPWForm sx={sx}/>}
          />
        </Routes>
      </Box>
    </Box>
  )
}