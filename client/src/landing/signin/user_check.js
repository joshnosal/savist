import { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../universal/AppContext'
import { useNavigate } from 'react-router-dom'
import LoadingScreen from './loading'
import SigninRouter from '.'

export default function UserChecker(props) {
  const { user, userToken, refreshUser } = useContext(AppContext)
  const controller = new AbortController()
  const { signal } = controller
  const [ loading, setLoading ] = useState(true)
  const navigate = useNavigate()


  useEffect(async () => {
    const response = fetch('/user/check', {
      method: 'GET',
      headers: { Authorization: `JWT ${userToken}`},
      signal
    })
    if(!response.ok) return setLoading(false)
    navigate('./dash', {replace: true})
    return () => controller.abort()
  }, [userToken])

  return loading ? (
    <LoadingScreen/>
  ) : (
    <SigninRouter/>
  )
  
}