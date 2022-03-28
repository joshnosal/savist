import { useState, useContext, createElement, useEffect } from 'react'
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, useTheme, Button, Icon } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppContext } from '../universal/AppContext'
import { Routes, Route } from 'react-router-dom'
import AccountIcon from '@mui/icons-material/PersonOutlineOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import MoneyIcon from '@mui/icons-material/AttachMoney'
import BankIcon from '@mui/icons-material/AccountBalanceOutlined'
import BalanceIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import HistoryIcon from '@mui/icons-material/Timeline'
import LogoutIcon from '@mui/icons-material/Logout'
import AddCardIcon from '@mui/icons-material/AddCardOutlined'

import DashLanding from './landing'
import AccountPage from './account'
import DepositPage from './deposit/index'
import NewCardPage from './new_card'

export default function AppRouter(props){
  const theme = useTheme()
  const sx = {
    menuRow: {
      display: 'flex',
      marginTop: '20px',
      cursor: 'pointer',
      '&:hover .inner-row': {
        backgroundColor: 'rgba(255,255,255,0.1)'
      },
    },
    menuInnerRow: {
      padding: '5px 15px 5px 10px',
      display: 'flex',
      alignItems: 'center',
      borderRadius: '20px',
    },
    activeInnerRow: {
      backgroundColor: 'rgba(255,255,255,0.1)'
    },
    menuIcon: {
      color: 'white',
      width: 32,
      height: 32,
    },
    menuText: {
      marginLeft: '10px',
      fontSize: '18px',
      color: theme.palette.text.main
    }
  }

  let pages = [
    // {path: 'deposit', title: 'New Deposit', icon: <BalanceIcon sx={sx.menuIcon}/>},
    {path: 'new_card', title: 'New Card', icon: <AddCardIcon sx={sx.menuIcon}/>},
    {path: 'my_account', title: 'My Account', icon: <AccountIcon sx={sx.menuIcon}/>},
    {path: 'history', title: 'History', icon: <HistoryIcon sx={sx.menuIcon}/>},
    {path: 'bank_acounts', title: 'Bank Accounts', icon: <BankIcon sx={sx.menuIcon}/>},
  ]
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState()
  
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useContext(AppContext)

  useEffect(()=>{
    let path = location.pathname
    if (path.includes('/deposit')) return setTitle('New Deposit')
    for (let i=0; i<pages.length; i++) {
      if (path.includes(pages[i].path)) {
        setTitle(pages[i].title)
        return
      }
    }
    setTitle('Welcome to Savist!')
  },[location, setTitle])


  return (
    <Box sx={{ display: 'flex', flex: 'column', backgroundColor: 'background.dark', height: '100vh', width: '100vw', justifyContent: 'center' }}>
      <Box sx={{ flexGrow: '1', maxWidth: '1000px', display: 'flex', flexDirection: 'row' }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '40px 0px', 
          minWidth: '250px',
          borderRight: '1px solid '+theme.palette.grey[800]
        }}>
          <Button
            variant='contained'
            color='secondary'
            sx={{
              borderRadius: '20px',
              fontSize: '18px',
              marginRight: '20px'
            }}
            onClick={() => {
              navigate('deposit', { replace: true })
              setTitle('New Deposit')
            }}
          >Deposit</Button>
          {pages.map((page, idx) => (
          <Box key={idx} sx={sx.menuRow} onClick={() => { 
            navigate(''+page.path, { replace: true })
            setTitle(page.title)
          }}>
            <Box sx={{...sx.menuInnerRow, ...(location.pathname.includes('/'+page.path) && sx.activeInnerRow)}} className={'inner-row'}>
              {page.icon}
              <Box sx={sx.menuText}>{page.title}</Box>
            </Box>
          </Box>
          ))}
          <Box sx={sx.menuRow} onClick={signOut}>
            <Box sx={sx.menuInnerRow} className={'inner-row'}>
              <LogoutIcon sx={sx.menuIcon}/>
              <Box sx={sx.menuText}>Sign Out</Box>
            </Box>
          </Box>
        </Box>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          padding: '0 20px'
        }}>
          <Box sx={{
            padding: '40px 0'
          }}>
            <Box sx={{
              color: 'primary.light',
              fontWeight: '600',
              fontSize: '24px',
            }}>{title}</Box>
          </Box>
          <Routes>
            <Route index element={<DashLanding/>}/>
            <Route path="/my_account" element={<AccountPage/>}/>
            <Route path="/deposit" element={<DepositPage/>}/>
            <Route path='/new_card' element={<NewCardPage/>}/>
          </Routes>
        </Box>
      </Box>
    </Box>
  )
}