import { Box, CircularProgress } from '@mui/material'

export default function LoadingScreen(props) {

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <CircularProgress size={64}/>
    </Box>
  )
}