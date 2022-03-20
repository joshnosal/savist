import React, { useState, useMemo, useEffect } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import axios from 'axios'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import { AppContext } from './universal/AppContext'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Theme } from './universal/CustomTheme'
import LandingRouter from './landing'
import SigninRouter from './landing/signin'
import UserAuthenticator from './landing/signin/user_auth'

export default function App(props) {
  const [userToken, setUserToken] = useState(localStorage.getItem('userToken') || '')
  const [user, setUser] = useState()
  const tokenSource = axios.CancelToken.source()
  const navigate = useNavigate()

  useEffect(()=>{
    const source = axios.CancelToken.source()
    axios.get('/user/get_user', {headers: {Authorization: `JWT ${userToken}`}, cancelToken: source.token})
    .then(res=>{
      setUser(res.data.user)
    })
    .catch(err=>{})
    return () => source.cancel()
  },[userToken])

  useEffect(() => { if (userToken) return localStorage.setItem('userToken', userToken)}, [userToken])

  const appContext = useMemo(() => ({
    user: user,
    userToken: userToken,

    signUp: (vals, cb) => {
      axios.post('/user/signup', {email: vals.email, password: vals.password}, {cancelToken: tokenSource.token})
        .then(res => cb(res.data))
        .catch(err => cb({err: true, msg: "We're sorry, something went wrong. Please try again."}))
      return () => tokenSource.cancel()
    },

    signIn: (vals, cb) => {
      axios.post('/user/signin', {email: vals.email, password: vals.password, remember: vals.remember}, {cancelToken: tokenSource.token})
        .then(res => {
          console.log(res)
          if(!res.data.err) {
            setUser(res.data.obj.user)
            setUserToken(res.data.msg)
          }
          // cb(res.data)
        })
        .catch(err => cb({err: true, msg: "We're sorry, something went wrong. Please try again."}))
      return () => tokenSource.cancel()
    },
    
    signOut: () => {
      localStorage.removeItem('userToken')
      setUserToken()
      setUser()
      navigate('/')
    },

    getUser: (cb) => {
      axios.get('/user/get_user', {headers: {Authorization: `JWT ${userToken}`}, cancelToken: tokenSource.token})
        .then(res=>{
          cb(null, res.data)
        })
        .catch(err=>{
          cb(err, undefined)
        })
      return () => tokenSource.cancel()
    }

  }))

  return (
    <ThemeProvider theme={Theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AppContext.Provider value={appContext}>
          <CssBaseline/>
          <Routes>
            <Route index element={<LandingRouter/>}/>
            <Route path="access/*" element={user && userToken ? <Navigate to='/dash' replace={true}/> : <SigninRouter/>}/>
            <Route path='dash/*' element={<UserAuthenticator user={user} userToken={userToken}/>}/>
          </Routes>
        </AppContext.Provider>
      </LocalizationProvider>
    </ThemeProvider>
  )
}

