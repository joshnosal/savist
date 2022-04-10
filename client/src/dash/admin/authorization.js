import { useState, useContext, useEffect } from 'react'
import { CircularProgress, Box } from '@mui/material'
import { Navigate } from 'react-router-dom'
import { AppContext } from '../../universal/AppContext'
import AdminPage from '.'

export default function AdminAuth(props) {
  const [ state, setState ] = useState({
    loading: true,
    isAdmin: false
  })
  const { userToken } = useContext(AppContext)

  useEffect(async () => {
    const response = await fetch('/admin/check', { 
      headers: { Authorization: `JWT ${userToken}`} ,
      method: 'GET'
    })
    if (!response.ok) {
      setState({loading: false, isAdmin: false})
    } else {
      setState({loading: false, isAdmin: true})
    }

  }, [])


  return state.loading ? (
    <Box sx={{height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <CircularProgress/>
    </Box>
  ) : state.isAdmin ? (
    <AdminPage/>
  ) : (
    <Navigate to='../dash' replace={true}/>
  )

}