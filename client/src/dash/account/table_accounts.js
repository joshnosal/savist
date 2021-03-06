
import { Box, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody, useTheme, Icon, alpha } from '@mui/material'
import { useEffect, useContext, useReducer, useState } from 'react'
import { AppContext } from '../../universal/AppContext'
import CheckboxChecked from '@mui/icons-material/CheckBoxOutlined'
import CheckboxEmpty from '@mui/icons-material/CheckBoxOutlineBlankOutlined'
import TrashIcon from '@mui/icons-material/DeleteOutlineOutlined'

const initialState = {
  loading: true,
  backend: false,
  errorMessage: null,
  accounts: [],
}

function reducer(s, a) {
  switch (a.type) {
    case 'set': return { ...s, ...a.state} 
    default: return { ...s }
  }
}

const columns = [
  {key: 'bank_name', title: 'Bank'},
  {key: 'subtype', title: 'Type'},
  {key: 'account_name', title: 'Name'},
  {key: 'last4', title: 'No.'},
  {key: 'default', title: 'Default' },
  {key: 'remove', title: 'Remove' }
]

export default function AccountsTable(props) {
  const { userToken, updated, update } = useContext(AppContext)
  const [ state, dispatch ] = useReducer(reducer, initialState)

  useEffect(async () => {
    const response = await fetch('/stripe/get_external_accounts', {
      method: 'GET',
      headers: { Authorization: `JWT ${userToken}`}
    })
    if (!response.ok) return dispatch({type: 'set', state: { loading: false, backend: false, errorMessage: 'Server error. Please try back later'}})
    let data = await response.json()
    dispatch({ type: 'set', state: { loading: false, backend: true, accounts: data }})
  }, [updated, dispatch])


  const removeAcct = async (accountID) => {
    dispatch({ type: 'set', state: {errorMessage: null}})
    const response = await fetch('/stripe/remove_external_account', {
      method: 'POST',
      headers: { Authorization: `JWT ${userToken}`, "Content-Type": 'application/json'},
      body: JSON.stringify({accountID: accountID})
    })
    if (!response.ok) {
      dispatch({type: 'set', state: { errorMessage: 'Server error. Please try back later'}})
      update()
      return
    }
    let data = await response.json()
    if (data.error) {
      dispatch({ type: 'set', state: { errorMessage: data.message } })
    } 
    update()
  }

  const setDefault = async (accountID) => {
    dispatch({ type: 'set', state: {errorMessage: null}})
    const response = await fetch('/stripe/set_default_external_account', {
      method: 'POST',
      headers: { Authorization: `JWT ${userToken}`, "Content-Type": 'application/json'},
      body: JSON.stringify({accountID: accountID})
    })
    if (!response.ok) {
      dispatch({type: 'set', state: { errorMessage: 'An unexpected error occured. Please try back later'}})
      update()
      return
    }
    update()
  }

  return state.loading ? (
    <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100px'}}>
      <CircularProgress size={48}/>
    </Box>
    
  ) : !state.backend ? (
    <Box>Error Occured</Box>
  ) : (
    <Box sx={{display: 'flex', flexDirection: 'column' }}>
      {state.errorMessage && (
        <Box sx={{
          color: 'error.main',
          fontSize: '14px',
          marginBottom: '5px'
        }}>{state.errorMessage}</Box>
      )}
      <Table size='small' sx={{width: '100%'}}>
        <TableHead>
          <TableRow>
            {columns.map((col, idx) => (
              <TableCell 
                key={idx}
                sx={{
                  fontWeight: '600',
                  textAlign: ['default', 'remove'].includes(col.key)  && 'center'
                  // color: theme.palette.grey[600]
                }}
              >{col.title}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {state.accounts.map((acct, idx) => (
            <CustomRow 
              key={idx} 
              account={acct}
              removeAcct={removeAcct}
              setDefault={setDefault}
            />
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

function CustomRow(props) {
  const { account, removeAcct, setDefault } = props
  const [ loading, setLoading ] = useState('')
  const theme = useTheme()
  const sx = {
    all: {
      fontWeight: '200',
      color: theme.palette.grey[200]
    }
  }

  useEffect(() => setLoading(''), [setLoading, account])

  const defaultElement = (
    <Box sx={{
      textAlign: 'center',
      color: theme.palette.grey[200]
    }}>
      <Icon children={<CheckboxChecked/>}/>
    </Box>
  )
  const defaultButton = (
    <Box
      sx={{
        cursor: 'pointer',
        opacity: loading === 'default' ? '1' : '0',
        textAlign: 'center',
        '&:hover': { opacity: '1'},
        color: theme.palette.grey[700]
      }}
      onClick={() => {
        setDefault(account.id)
        setLoading('default')
      }}
    >
      {loading === 'default' ? <CircularProgress size={24}/> : <Icon children={<CheckboxEmpty/>}/>}
    </Box>
  )

  return (
    <TableRow>
      {columns.map((col, idx) => {
        switch(col.key) {
          case 'remove': return (
            <TableCell key={idx} sx={{...sx.all}}>
              {loading === 'remove' ? (
                <Box sx={{textAlign: 'center'}}>
                  <CircularProgress size={24}/>
                </Box>
              ) : (
                <Box 
                  onClick={() => {
                    removeAcct(account.id)
                    setLoading('remove')
                  }}
                  sx={{
                    cursor: 'pointer',
                    textAlign: 'center',
                    '& span': { opacity: '0.5'},
                    '&:hover span': { opacity: '1'},
                    color: theme.palette.grey[200]
                  }}
                >
                  <Icon children={<TrashIcon/>}/>
                </Box>
              )}
              
            </TableCell>
          )
          case 'default': return (
            <TableCell key={idx} sx={{...sx.all}}>{account[col.key] ? defaultElement : defaultButton}</TableCell>
          )
          case 'last4': return (
            <TableCell key={idx} sx={{...sx.all}}>{'...'+account[col.key]}</TableCell>
          )
          case 'subtype': return (
            <TableCell key={idx} sx={{...sx.all, textTransform: 'capitalize'}}>{account[col.key]}</TableCell>
          )
          default: return (
            <TableCell key={idx} sx={{...sx.all}}>{account[col.key]}</TableCell>
          )
        }
      })}
    </TableRow>
  )
}