import { useCallback, useReducer, useContext, useEffect, useState } from 'react'
import { AppContext } from '../../universal/AppContext'
import { Button } from '@mui/material'
import axios from 'axios'
import { usePlaidLink } from 'react-plaid-link'

const initialState = {
  linkSuccess: false,
  isItemAccess: true,
  linkToken: "", 
  accessToken: null,
  itemId: null,
  isError: false,
  backend: true,
  products: ["transactions"],
  linkTokenError: {
    error_type: "",
    error_code: "",
    error_message: "",
  }
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_STATE": 
      return { ...state, ...action.state }
    default: 
      return { ...state }
  }
}

export default function PlaidAcctBtn(props){
  const [ state, dispatch ] = useReducer(reducer, initialState)
  const { userToken } = useContext(AppContext)

  const generateToken = useCallback( async () => {
    const response = await fetch('/stripe/create_plaid_link_token', {
      method: 'POST',
      headers: { Authorization: `JWT ${userToken}` }
    })
    if (!response.ok) {
      dispatch({ type: 'SET_STATE', state: { linkToken: null } })
      return
    }
    const data = await response.json()
    if (data) {
      if (data.error != null) {
        dispatch({
          type: 'SET_STATE',
          state: {
            linkToken: null,
            linkTokenError: data.error
          }
        })
        return
      }
      dispatch({ type: 'SET_STATE', state: { linkToken: data.link_token } })
    }
    localStorage.setItem("link_token", data.link_token)
  }, [dispatch])

  const init = async () => {
    if (window.location.href.includes("?oauth_state_id=")){
      dispatch({
        type: "SET_STATE",
        state: { linkToken: localStorage.getItem("link_token")}
      })
      return
    }
    generateToken()
  }
  
  useEffect(() => {
    if (window.location.href.includes("?oauth_state_id=")) {
      dispatch({
        type: "SET_STATE",
        state: {
          linkToken: localStorage.getItem("link_token"),
        },
      });
      return;
    }
    init()
  }, [dispatch])

  return state.backend && state.linkToken
    ? (
      <Link 
        linkToken={state.linkToken} 
        dispatch={dispatch} 
        text={props.text}
        userToken={userToken}
      />
    ) : state.linkToken == null || state.linkToken == "" ? (
      <Button
        variant='contained'
        size='small'
        color='primary'
        onClick={init}
      >{props.text}</Button>
    ) : (
      <Button
        variant='contained'
        size='small'
        color='primary'
        disabled={true}
      >{props.text}</Button>
    )
}

function Link(props) {
  const { linkToken, dispatch, text, userToken } = props
  
  const onSuccess = useCallback( (public_token) => {
    const setToken = async () => {
      const response = await fetch('/stripe/set_plaid_access_token', {
        method: 'POST',
        headers: { Authorization: `JWT ${userToken}`, "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: `public_token=${public_token}`
      })
      if (!response.ok) {
        dispatch({
          type: "SET_STATE",
          state: {
            itemId: `no item_id retrieved`,
            accessToken: `no access_token retrieved`,
            isItemAccess: false,
          }
        })
        return
      }
      const data = await response.json()
      dispatch({
        type: "SET_STATE",
        state: {
          itemId: data.item_id,
          accessToken: data.access_token,
          isItemAccess: true,
        }
      })
    }
    setToken()
    dispatch({ type: 'SET_STATE', state: { linkSuccess: true } })
    window.history.pushState("", "", "/")
  }, [dispatch])

  let isOauth = false

  const config = {
    token: linkToken,
    onSuccess: onSuccess
  }

  if (window.location.href.includes("?oauth_state_id")) {
    config.receivedRedirectUri = window.location.href
    isOauth = true
  }

  const { open, ready, error } = usePlaidLink(config)

  useEffect(() => {
    if (isOauth && ready) {
      open()
    }
  }, [ready, open, isOauth])

  return (
    <Button
      variant='contained'
      size='small'
      color='primary'
      onClick={() => open()}
      disabled={!ready}
    >{text}</Button>
  )

}
