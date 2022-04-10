
import { Navigate } from 'react-router-dom'
import DashLanding from '../../dash'
import LoadingPage from './loading'


export default function UserAuthenticator(props){
  const { loading, userToken, user } = props
  if (loading) {
    return <LoadingPage/>
  } else if (user && userToken) {
    return <DashLanding {...props}/>
  } else {
    return <Navigate to='/access' replace={true}/>
  }
}
