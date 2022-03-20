import React, { useState, useContext } from 'react'
import { Box, OutlinedInput, Button, CircularProgress } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../../universal/AppContext'

export default function SignUpDialog(props){
  const sx = props.sx
  const navigate = useNavigate()
  const empty = { email: '', password: '', confirm: ''}
  const [error, setError] = useState('')
  const [values, setValues] = useState(empty)
  const [loading, setLoading] = useState(false)
  const { signUp } = useContext(AppContext)

  const handleChange = (prop) => (e) => {
    setValues({...values, [prop]: e.target.value})
    setError('')
  }

  const submitForm = () => {
    if (!values.email) return setError('Please enter your email')
    if (!values.password) return setError('Please enter a password')
    if (!values.confirm) return setError('Please confirm your password')
    if (values.confirm !== values.password) return setError('Passwords do not match')
    setLoading(true)
    signUp(values, (res) => {
      setLoading(false)
      if (res.err) {
        setError(res.msg)
        setValues(empty)
      } else {
        navigate('../')
      }
    })
  }

  return (
    <>
      <Box sx={sx.header}>Sign Up</Box>
      <Box sx={sx.inputRow}>
        <OutlinedInput
          variant='light_bg'
          margin='dense'
          placeholder='Email...'
          type='email'
          fullWidth={true}
          onChange={handleChange('email')}
          value={values.email}
        />
      </Box>
      <Box sx={sx.inputRow}>
        <OutlinedInput
          variant='light_bg'
          placeholder='Password...'
          type='password'
          fullWidth={true}
          onChange={handleChange('password')}
          value={values.password}
        />
      </Box>
      <Box sx={sx.inputRow}>
        <OutlinedInput
          variant='light_bg'
          placeholder='Confirm...'
          type='password'
          fullWidth={true}
          onChange={handleChange('confirm')}
          value={values.confirm}
        />
      </Box>
      <Box sx={{...sx.inputRow, display: error ? 'flex' : 'none'}}>
        <Box sx={{
          color: 'red'
        }}>{error}</Box>
      </Box>
      <Box sx={sx.submitRow}>
        <Button
          sx={sx.navButton}
          onClick={() => navigate('../', {replace: true})}
        >Sign In</Button>
        <Button
          variant='contained'
          sx={sx.submitButton}
          disableElevation={true}
          onClick={submitForm}
        >{loading ? <CircularProgress sx={{color: 'primary.main'}} size={24}/> : 'Submit'}</Button>
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