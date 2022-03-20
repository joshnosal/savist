import React from 'react'
import { Box, OutlinedInput, Button, FormControlLabel, Checkbox } from '@mui/material'
import { useNavigate } from 'react-router-dom'

export default function ResetPwDialog(props){
  const sx = props.sx
  const navigate = useNavigate()
  
  return (
    <>
      <Box sx={sx.header}>Reset Password</Box>
      <Box sx={sx.inputRow}>
        <OutlinedInput
          variant='light_bg'
          margin='dense'
          placeholder='Email...'
          type='email'
          fullWidth={true}
        />
      </Box>
      <Box sx={sx.inputRow}>
        <OutlinedInput
          variant='light_bg'
          placeholder='Password...'
          type='password'
          fullWidth={true}
        />
      </Box>
      <Box sx={sx.inputRow}>
        <FormControlLabel control={<Checkbox variant='white' />} label="Remember Me"/>
      </Box>
      <Box sx={sx.submitRow}>
        <Button
          sx={sx.navButton}
          onClick={() => navigate('../signup', {replace: true})}
        >Sign Up</Button>
        <Button
          variant='contained'
          sx={sx.submitButton}
          disableElevation={true}
        >Submit</Button>
      </Box>
      <Box sx={sx.resetRow}>
        <Box 
          sx={sx.resetLink}
          onClick={() => navigate('../reset', {replace: true})}
        >Reset Password</Box>
      </Box>
    </>
  )
}