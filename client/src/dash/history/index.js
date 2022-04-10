import { Box, CircularProgress, useTheme } from '@mui/material'
import { AppContext } from '../../universal/AppContext'
import { useEffect, useReducer, useContext, useCallback } from 'react'
import Container from '../../components/container'

const reducer = (s, a) => ({...s, ...a})

export default function HistoryPage(props){
  const [ state, dispatch ] = useReducer(reducer, {
    loading: true,
    backend: false,
    processing: true,
    search: {
      days: '30',
    }
  })
  const controller = new AbortController()
  const { signal } = controller
  const { userToken } = useContext(AppContext)
  const theme = useTheme()
  const maxWidth = 500

  const fetchData = useCallback( async () => {
    const response = await fetch('/stripe/get_history', {
      method: 'POST',
      headers: { Authorization: `JWT ${userToken}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({days: state.search.days}),
      signal
    })
    if (!response.ok) return dispatch({ loading: false, backend: false, processing: false })
    const data = await response.json()
  },[dispatch])

  useEffect(() => {
    fetchData().catch(e=>{})
    return () => controller.abort()
  }, [dispatch, fetchData])

  return state.loading ? (
    <Container maxWidth={maxWidth}>
      <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px'}}>
        <CircularProgress/>
      </Box>
    </Container>
  ) : !state.backend ? (
    <Container maxWidth={maxWidth}>
      <Box sx={{color: 'error.main', alignItems: 'center', justifyContent: 'center', height: '200px'}}>
        An unexpected error occured. Please try back later.
      </Box>
    </Container>
  ) : (
    <Box>History</Box>
  )

}