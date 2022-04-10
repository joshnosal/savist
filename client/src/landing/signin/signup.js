import { Box, Button, ButtonBase, CircularProgress } from '@mui/material'
import { useReducer } from 'react'
import InputContainer from '../../components/input_container'
import InputBase from '../../components/input_base'

const reducer = (s, a) => ({ ...s, ...a})

export default function SignUpForm(props) {
  const controller = new AbortController()
  const { signal } = controller
  const { custom_sx, setPage, sx } = props
  const [ state, dispatch ] = useReducer(reducer, {
    email: {value: null, error: null},
    password: {value: null, error: null},
    confirm: {value: null, error: null},
    focusedElement: null,
    error_message: null,
    loading: false
  })

  const inputs = [
    {type: 'email', field_type: 'email', width: null, title: 'Email'},
    {type: 'password', field_type: 'password', width: null, title: 'Password'},
    {type: 'confirm', field_type: 'password', width: null, title: 'Confirmation'},
  ]

  const handleBlur = (prop) => (e) => dispatch({ focusedElement: null })
  const handleFocus = (prop) => (e) => dispatch({ focusedElement: prop })
  const handleChange = (prop) => (e) => {
    let error = !e.target.value ? {message: 'Required'} : null 
    dispatch({ [prop]: {value: e.target.value, error: error }, error_message: null })
  }

  const handleSubmit = async () => {
    dispatch({ loading: true })
    let stateUpdate = {}
    inputs.map(item => {
      if (!state[item.type].value) stateUpdate[item.type] = { value: null, error: {message: 'Required'}}
    })
    if (state.password.value !== state.confirm.value) stateUpdate.confirm = { value: state.confirm.value, error: {message: "Doesn't match"}}
    if (Object.keys(stateUpdate).length > 0) return dispatch({...stateUpdate, loading: false})
    const response = await fetch('/user/signup', {
      method: 'POST',
      headers: { "Content-Type": 'application/json'},
      signal,
      body: JSON.stringify({email: state.email.value, password: state.password.value})
    })
    if (!response.ok) dispatch({ loading: false, error_message: 'An unexpected error occured. Please try again.'})
    setPage('success')
    return () => controller.abort()
  }

  return (
    <Box sx={custom_sx.container}>
      <Box sx={custom_sx.title_block}>
        Sign Up
      </Box>
      {inputs.map((input, idx) => (
        <InputContainer
          key={idx}
          title={input.title}
          error={state[input.type].error}
          focused={state.focusedElement === input.type}
          width={input.width}
          sx={sx}
        >
          <InputBase
            onChange={handleChange(input.type)}
            value={state[input.type].value}
            onFocus={handleFocus(input.type)}
            onBlur={handleBlur(input.type)}
            type={input.field_type}
          />
        </InputContainer>
      ))}
      <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
        <Button
          color='secondary'
          size='small'
          disableTouchRipple
          sx={{ marginRight: '10px' }}
          onClick={()=>setPage('signin')}
          disabled={state.loading}
        >Sign In</Button>
        <Button
          color='secondary'
          variant='contained'
          size='small'
          onClick={handleSubmit}
          disabled={state.loading}
        >
          {state.loading ? <CircularProgress size={24}/> : 'Submit'}
        </Button>
      </Box>
      {state.error_message && <Box sx={{color:'error.main', marginTop: '20px'}}>{state.error_message}</Box>}
    </Box>
  )
}