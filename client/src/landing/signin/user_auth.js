import React from 'react'
import { Navigate } from 'react-router-dom'

import DashRouter from '../../dash'
import LoadingScreen from './loading'

export default function UserAuthenticator(props){
  if (props.loading) {
    return <LoadingScreen/>
  } else if (props.user && props.userToken) {
    return <DashRouter {...props}/>
  } else {
    return <Navigate to='/access' replace={true}/>
  }
}