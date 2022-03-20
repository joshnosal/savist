import React from 'react'
import { Box, CircularProgress } from '@mui/material'

export default function LoadingScreen(props){

  return(
    <Box sx={{
      backgroundColor: 'grey.900',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <CircularProgress size={80} sx={{color: 'primary.main'}}/>
    </Box>
  )
}