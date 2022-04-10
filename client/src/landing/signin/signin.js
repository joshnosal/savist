import { Box, Button, ButtonBase, FormControlLabel, Switch, alpha, useTheme, CircularProgress } from '@mui/material'
import { useReducer, useContext } from 'react'
import { AppContext } from '../../universal/AppContext'
import InputContainer from '../../components/input_container'
import InputBase from '../../components/input_base'

const reducer = (s, a) => ({ ...s, ...a})

export default function SignInForm(props) {
  const { custom_sx, setPage, sx } = props
  const theme = useTheme()
  const { signIn } = useContext(AppContext)
  const [ state, dispatch ] = useReducer(reducer, {
    email: {value: null, error: null},
    password: {value: null, error: null},
    focusedElement: null,
    error_message: null,
    loading: false,
    remember: false
  })

  const inputs = [
    {type: 'email', field_type: 'email', width: null, title: 'Email'},
    {type: 'password', field_type: 'password', width: null, title: 'Password'},
  ]

  const handleBlur = (prop) => (e) => dispatch({ focusedElement: null })
  const handleFocus = (prop) => (e) => dispatch({ focusedElement: prop })
  const handleChange = (prop) => (e) => {
    let error = !e.target.value ? {message: 'Required'} : null 
    dispatch({ [prop]: {value: e.target.value, error: error } })
  }

  const handleSubmit = () => {
    dispatch({ loading: true })
    let stateUpdate = {}
    inputs.map(item => {
      if (!state[item.type].value) stateUpdate[item.type] = { value: null, error: {message: 'Required'}}
    })
    if (Object.keys(stateUpdate).length > 0) return dispatch({...stateUpdate, loading: false})
    signIn({email: state.email.value, password: state.password.value, remember: state.remember}, (res)=>{
      dispatch({
        loading: false,
        error_message: res.err ? res.msg : null,
        email: {value: null, error: null},
        password: {value: null, error: null},
      })
    })
  }

  return (
    <Box sx={custom_sx.container}>
      <Box sx={custom_sx.title_block}>
        Sign In
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
      <Box sx={{marginBottom: '20px'}}>
        <FormControlLabel 
          control={<Switch 
            color='primary' 
            onChange={(e)=>dispatch({remember: e.target.checked})}
            checked={state.remember}
            size='small'
          />}
          label='Remember me'
          sx={{
            color: state.remember ? alpha(theme.palette.primary.main, 0.8) : alpha(theme.palette.background.contrast,0.3),
            paddingLeft: '14px',
            '& .MuiFormControlLabel-label': {
              fontSize: '14px',
              fontWeight: '400',
              paddingLeft: '5px'
            }
          }}
        />
      </Box>
      <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
        <Button
          color='secondary'
          size='small'
          disableTouchRipple
          sx={{ marginRight: '10px' }}
          onClick={()=>setPage('signup')}
          disabled={state.loading}
        >Sign Up</Button>
        <Button
          color='secondary'
          variant='contained'
          size='small'
          onClick={handleSubmit}
          disabled={state.loading}
        >
          {state.loading ? <CircularProgress size={24}/> : 'Enter'}
        </Button>
      </Box>
      <Box sx={{
        display: 'flex', 
        justifyContent: 'center', 
        color: 'primary.main',
        marginTop: '40px'
      }}>
        <ButtonBase 
          sx={{fontSize: '12px'}}
          onClick={() => setPage('reset')}
        >Reset Password</ButtonBase>
      </Box>
      {state.error_message && <Box sx={{color:'error.main', marginTop: '20px'}}>{state.error_message}</Box>}
    </Box>
  )
}