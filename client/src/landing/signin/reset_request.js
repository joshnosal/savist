import { Box, Button, ButtonBase } from '@mui/material'
import { useReducer } from 'react'
import InputContainer from '../../components/input_container'
import InputBase from '../../components/input_base'

const reducer = (s, a) => ({ ...s, ...a})

export default function ResetRequestForm(props) {
  const { custom_sx, setPage, sx } = props
  const [ state, dispatch ] = useReducer(reducer, {
    email: {value: null, error: null},
    focusedElement: null
  })

  const inputs = [
    {type: 'email', width: null, title: 'Email'},
  ]

  const handleBlur = (prop) => (e) => dispatch({ focusedElement: null })
  const handleFocus = (prop) => (e) => dispatch({ focusedElement: prop })
  const handleChange = (prop) => (e) => {
    let error = !e.target.value ? {message: 'Required'} : null 
    dispatch({ [prop]: {value: e.target.value, error: error } })
  }

  return (
    <Box sx={custom_sx.container}>
      <Box sx={custom_sx.title_block}>
        Reset Password
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
        >Back</Button>
        <Button
          color='secondary'
          variant='contained'
          size='small'
        >Reset</Button>
      </Box>
    </Box>
  )
}