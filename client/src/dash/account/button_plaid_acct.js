import { useCallback, useReducer, useContext, useEffect } from 'react'
import { AppContext } from '../../universal/AppContext'
import { Button, CircularProgress } from '@mui/material'
import axios from 'axios'
import { usePlaidLink } from 'react-plaid-link'

const initialState = {
  loading: false,
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

export default function PlaidAcctLink(props){
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
        state={state}
        text={props.text}
        userToken={userToken}
      />
    ) : (
      <Button
        variant='contained'
        size='small'
        disabled
      >
        <CircularProgress size={22}/>
      </Button>
    )
}

function Link(props) {
  const { linkToken, dispatch, text, userToken, state } = props
  const { update } = useContext(AppContext)
  
  const onSuccess = useCallback( (public_token, metadata) => {
    const setToken = async () => {
      const response = await fetch('/stripe/set_plaid_access_token', {
        method: 'POST',
        headers: { Authorization: `JWT ${userToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(metadata)
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
      update()
      dispatch({ type: 'SET_STATE', state: { linkSuccess: true, loading: false } })
    }
    setToken()
    
    window.history.pushState("", "", "/")
  }, [dispatch])

  const onExit = () => {
    dispatch({type: 'SET_STATE', state: {loading: false} })
  }

  let isOauth = false

  const config = {
    token: linkToken,
    onSuccess: onSuccess,
    onExit: onExit
  }

  if (window.location.href.includes("?oauth_state_id")) {
    config.receivedRedirectUri = window.location.href
    isOauth = true
  }

  const { open, ready, error } = usePlaidLink(config)

  const handleOpen = () => {
    open()
    dispatch({type: 'SET_STATE', state: {loading: true} })
  }

  useEffect(() => {
    if (isOauth && ready) {
      handleOpen()
    }
  }, [ready, open, isOauth])

  return (
    <Button
      variant='contained'
      size='small'
      color='secondary'
      onClick={handleOpen}
      disabled={!ready || state.loading}
    >{state.loading ? <CircularProgress size={22}/> : text}</Button>
  )

}

