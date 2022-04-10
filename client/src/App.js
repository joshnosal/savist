import { useMemo, useReducer, useEffect } from 'react'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import { AppContext } from './universal/AppContext'
import { Theme } from './universal/CustomTheme'
import { createStyles } from './universal/CustomStyles'
import AdapterDateFns from '@mui/lab/AdapterDateFns'

import LandingRouter from './landing'
import UserAuthenticator from './landing/signin/user_auth'
import AccessPage from './landing/signin'

const reducer = (s, a) => ({...s, ...a})

export default function App(props){
  const [ state, dispatch ] = useReducer(reducer, {
    loading: true,
    user: null,
    userToken: localStorage.getItem('userToken'),
    updated: false,
  })
  const controller = new AbortController()
  const { signal } = controller
  const navigate = useNavigate()
  const sx = createStyles(Theme)

  useEffect( async () => {
    if (!state.userToken) return dispatch({ user: null })
    const response = await fetch('/user/get_user', {
      method: 'GET',
      headers: { Authorization: `JWT ${state.userToken}`},
      signal
    })
    if (!response.ok) return dispatch({ user: null, userToken: null })
    const data = await response.json()
    dispatch({ user: data.user, loading: false })
    return () => controller.abort()
  }, [])

  useEffect(() => { if (state.userToken) return localStorage.setItem('userToken', state.userToken)}, [state.userToken])

  const appContext = useMemo(() => ({
    user: state.user,
    userToken: state.userToken,
    brand: 'Ruebsy',
    sx: sx,
    updated: state.updated,
    update: () => dispatch({ updated: !state.updated }),

    signIn: async (vals, cb) => {
      const response = await fetch('/user/signin', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: vals.email, password: vals.password, remember: vals.remember}),
        signal
      })
      if(!response.ok) return cb({err: true, msg: 'An unexpected error occured. Please try again.'})
      const data = await response.json()
      dispatch({ user: data.obj.user, userToken: data.msg })
      cb(data)
      return () => controller.abort()
    },

    signOut: () => {
      dispatch({ userToken: null, user: null })
      localStorage.removeItem('userToken')
      navigate('/')
    },

    updateUser: async (updates, cb) => {
      const response = await fetch('/user/update', {
        method: 'POST',
        headers: { Authorization: `JWT ${state.userToken}`, 'Content-Type': 'application/json'},
        body: JSON.stringify({updates: updates}),
        signal
      })
      if (!response.ok) {
        return cb("An unexpected error occured. Please try again later.")
      }
      const data = await response.json()
      dispatch({ user: data.user})
      return () => controller.abort()
    } 
  }), [state, dispatch])

  return (
    <ThemeProvider theme={Theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AppContext.Provider value={appContext}>
          <CssBaseline/>
          <Routes>
            <Route index element={<LandingRouter/>}/>
            <Route path='access/*' element={state.userToken && state.user ? <Navigate to='/dash' replace={true}/> : <AccessPage/>}/>
            <Route path='dash/*' element={<UserAuthenticator userToken={state.userToken} user={state.user} loading={state.loading}/>}/>
          </Routes>
          </AppContext.Provider>
      </LocalizationProvider>
    </ThemeProvider>
  )
}