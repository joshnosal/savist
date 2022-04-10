import { Box, Button, ButtonBase } from '@mui/material'
import { useReducer } from 'react'
import InputContainer from '../../components/input_container'
import InputBase from '../../components/input_base'

export default function SuccessPage(props) {
  const { custom_sx, setPage, sx, brand } = props

  return (
    <Box sx={custom_sx.container}>
      <Box sx={custom_sx.title_block}>
        Success!
      </Box>
      <Box sx={{
        color: 'primary.main'
      }}>{"You've successfully signed up for "+brand+'. Please check your inbox for an account verification email. Then sign back in.'}</Box>
      <Box sx={{display: 'flex', justifyContent: 'center', marginTop: '40px'}}>
        <Button
          color='secondary'
          variant='contained'
          size='small'
          onClick={()=>setPage('signin')}
        >Sign In</Button>
      </Box>
    </Box>
  )
}