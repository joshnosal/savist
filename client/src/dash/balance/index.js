import { Box, CircularProgress, useTheme, alpha, Button } from '@mui/material'
import { useReducer, useEffect, useContext } from 'react'
import { AppContext } from '../../universal/AppContext'
import Container from '../../components/container'
import FormHeader from '../../components/form_header'

const reducer = (s, a) => ({...s, ...a})

export default function BalanceDetails(props) {
  const [ state, dispatch ] = useReducer(reducer, {
    loading: true,
    backend: false,
    balance: {available: 0, pending: 0}
  })
  const controller = new AbortController()
  const { signal } = controller
  const { userToken } = useContext(AppContext)
  const theme = useTheme()

  const maxWidth = 400

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/stripe/get_balance', {
        method: 'GET',
        headers: { Authorization: `JWT ${userToken}` },
        signal
      })
      if (!response.ok) {
        return dispatch({ loading: false })
      }
      const data = await response.json()
      dispatch({balance: data, loading: false, backend: true})
    }
    fetchData().catch(e=>{})
    return () => controller.abort()
  }, [dispatch])

  return state.loading ? (
    <Container maxWidth={maxWidth}>
      <CircularProgress/>
    </Container>
  ) : !state.backend ? (
    <Container maxWidth={maxWidth}>
      <Box sx={{color: 'error.main', alignItems: 'center', justifyContent: 'center', height: '200px'}}>
        An unexpected error occured. Please try back later.
      </Box>
    </Container>
  ) : (
    <Container maxWidth={maxWidth}>
      <ShapeRow>
        <Circle 
          value={state.balance.pending} 
          color={theme.palette.grey[800]} 
          size={150}
          title='Pending'
        />
      </ShapeRow>
      <ShapeRow>
        <Circle 
          value={state.balance.available} 
          color={theme.palette.primary.main} 
          size={200}
          title='Available'
        />
      </ShapeRow>
      <ShapeRow>
        <Button></Button>
      </ShapeRow>
    </Container>
  )

}

const ShapeRow = (props) => (
  <Box sx={{
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px'
  }}>{props.children}</Box>
)

const Circle = (props) => {
  const { value, color, size, title } = props

  const getDollars = (val) => {
    let text = ''+(val / 100)
    if (text.indexOf('.') === -1) text = text + '.00'
    if (text.indexOf('.') !== -1 && text.indexOf('.') === text.length - 2) text = text + '0'
    text = text.split('.')
    text[0] = text[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    text = text.join('.')
    return '$'+text
  }

  return (
    <Box sx={{
      backgroundColor: color,
      height: `${size}px`,
      width: `${size}px`,
      borderRadius: `${size/2}px`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Box sx={{
        fontSize: `${size/5}px`
      }}>{getDollars(value)}</Box>
      <Box sx={{
        fontSize: '14px'
      }}>{title}</Box>
      <CircularProgress size={size} sx={{position: 'absolute'}} thickness={1} value={10}/>
    </Box>
  )
}