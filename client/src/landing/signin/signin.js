import React, { useState , useContext } from 'react'
import { Box, OutlinedInput, Button, FormControlLabel, Checkbox, CircularProgress } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../../universal/AppContext'

export default function SignInDialog(props){
  const sx = props.sx
  const navigate = useNavigate()
  const { signIn } = useContext(AppContext)
  const empty = { email: '', password: '', remember: false}
  const [error, setError] = useState('')
  const [values, setValues] = useState(empty)
  const [loading, setLoading] = useState(false)

  const handleChange = (prop) => (e) => {
    setValues({...values, [prop]: e.target.value})
    setError('')
  }

  const handleCheck = (e) => {
    setValues({...values, remember: e.target.checked})
  }

  const submitForm = () => {
    if (!values.email) return setError('Please enter your email')
    if (!values.password) return setError('Please enter a password')
    setLoading(true)
    signIn(values, (res) => {
      setLoading(false)
      if (res.err) {
        setError(res.msg)
        setValues(empty)
      } else {
        console.log('here')
        // navigate('../dash', {replace: true})
      }
    })
  }

  return (
    <>
      <Box sx={sx.header}>Sign In</Box>
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
        <FormControlLabel control={<Checkbox variant='white' checked={values.remember} onChange={handleCheck}/>} label="Remember Me"/>
      </Box>
      <Box sx={{...sx.inputRow, display: error ? 'flex' : 'none'}}>
        <Box sx={{
          color: 'red'
        }}>{error}</Box>
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