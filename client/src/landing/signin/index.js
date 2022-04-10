import { Box, useTheme, IconButton } from '@mui/material'
import { useState, useContext } from 'react'
import { AppContext } from '../../universal/AppContext'
import { useNavigate } from 'react-router-dom'
import SuccessPage from './success'
import SignUpForm from './signup'
import SignInForm from './signin'
import ResetRequestForm from './reset_request'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const createStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: '1'
  },
  title_block: {
    fontWeight: '500',
    fontSize: '24px',
    marginBottom: '20px',
  }
})


export default function SigninRouter(props){
  const [ page, setPage ] = useState('signin')
  const theme = useTheme()
  const { brand, sx } = useContext(AppContext)
  const custom_sx = createStyles()
  const navigate = useNavigate()

  const getPage = (prop) => {
    switch(prop) {
      default: return <SignInForm setPage={setPage} sx={sx} custom_sx={custom_sx}/>
      case 'signup': return <SignUpForm setPage={setPage} sx={sx} custom_sx={custom_sx}/>
      case 'reset': return <ResetRequestForm setPage={setPage} sx={sx} custom_sx={custom_sx}/>
      case 'success': return <SuccessPage setPage={setPage} sx={sx} custom_sx={custom_sx} brand={brand}/>
    }
  }

  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
    }}>
      <IconButton
        sx={{
          position:'fixed',
          margin: '40px'
        }}
        disableFocusRipple
        onClick={() => navigate('/', {replace: true})}
      >
        <ArrowBackIcon/>
      </IconButton>
      <Box sx={{
        minWidth: '300px',
        maxWidth: '300px',
        borderRight: '1px solid '+theme.palette.grey[800],
        display: 'flex',
        alignItems: 'center',
        padding: '0 40px'
      }}>
        {getPage(page)}
      </Box>
      <Box sx={{
        color: 'primary.main',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <Box sx={{fontSize: '56px', fontWeight: '600'}}>{'Welcome to '+brand+'!'}</Box>
        <Box sx={{fontSize: '24px', fontWeight: '400'}}>Cashing prepaids one day at a time</Box>
      </Box>
    </Box>
  )
}