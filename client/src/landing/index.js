import React, { useContext } from 'react'
import { Box, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../universal/AppContext'

export default function LandingScreen(props){
  const navigate = useNavigate()
  const { signOut } = useContext(AppContext)

  return (
    <Box>
      <Box>Welcom to Savist!</Box>
      <Button
        onClick={() => navigate('/access')}
      >Sign In</Button>
      <Button
        onClick={() => navigate('/dash')}
      >Go to Dash</Button>
      <Button onClick={signOut}>Sign Out</Button>
    </Box>
  )
}