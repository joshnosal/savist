import React, { useState, useContext } from 'react'
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, useTheme } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppContext } from '../universal/AppContext'
import { Routes, Route } from 'react-router-dom'
import AccountIcon from '@mui/icons-material/AccountCircle'
import MenuIcon from '@mui/icons-material/Menu'
import MoneyIcon from '@mui/icons-material/AttachMoney'
import BankIcon from '@mui/icons-material/AccountBalance'
import BalanceIcon from '@mui/icons-material/AccountBalanceWallet'
import HistoryIcon from '@mui/icons-material/Timeline'
import LogoutIcon from '@mui/icons-material/Logout'

import DashLanding from './landing'
import AccountPage from './account'


const drawerWidth = 220

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
})

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(2)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(7)} + 1px)`,
  },
})

const activeMixin = (theme) => ({
  backgroundColor: 'rgba(255,255,255,0.1)',
  color: theme.palette.secondary.main,
  '& .MuiTypography-root': {fontWeight: '500'},
  '&:hover': { 
    backgroundColor: 'rgba(255,255,255,0.1)',
  }
})

const inactiveMixin = (theme) => ({
  color: theme.palette.secondary.main
})

export default function AppRouter(props){
  let pages = [
    {path: 'my_account', title: 'My Account', icon: <AccountIcon/>},
    {path: 'history', title: 'History', icon: <HistoryIcon/>},
    {path: 'bank_acounts', title: 'Bank Accounts', icon: <BankIcon/>},
    {path: 'new_transfer', title: 'New Transfer', icon: <MoneyIcon/>},
    {path: 'check_balance', title: 'Check Balance', icon: <BalanceIcon/>}
  ]
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('Welcome to Savist!')
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useContext(AppContext)

  const toggleDrawer = () => setOpen(!open)



  return (
    <Box sx={{
      backgroundColor: 'background.dark',
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'row',
    }}>
      <Drawer
        variant='permanent'
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          '& > .MuiDrawer-paper': { 
            background: theme.palette.background.dark, 
            display: 'flex',
            borderRight: '1px solid '+theme.palette.primary.main
          },
          ...(open && {
            ...openedMixin(theme),
            '& .MuiDrawer-paper': openedMixin(theme),
          }),
          ...(!open && {
            ...closedMixin(theme),
            '& .MuiDrawer-paper': closedMixin(theme),
          })
        }}
      >
        <List disablePadding sx={{display: 'flex', flexDirection: 'column', heightL: '100%', flexGrow: 1}}>
          <ListItem>
            <ListItemIcon sx={{color: 'primary.main', cursor: 'pointer'}} onClick={toggleDrawer}>
              <MenuIcon/>
            </ListItemIcon>
          </ListItem>
          <Divider/>
          {pages.map((page, idx) => (
            <ListItem 
              button 
              disableRipple
              key={idx}
              onClick={() => {
                navigate(''+page.path, {replace: true})
                setTitle(page.title)
              }}
              sx={{...(location.pathname.includes('/'+page.path) ? activeMixin(theme) : inactiveMixin(theme))}}
            >
              <ListItemIcon sx={{color: 'inherit'}}>
                {page.icon}
              </ListItemIcon>
              <ListItemText primary={page.title} sx={{color: 'white'}}/>
            </ListItem>
          ))}
          <ListItem button onClick={signOut}>
            <ListItemIcon sx={{color: 'secondary.main', cursor: 'pointer'}}>
              <LogoutIcon/>
            </ListItemIcon>
            <ListItemText primary='Sign Out' sx={{color: 'white'}}/>
          </ListItem>
        </List>
      </Drawer>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        padding: '0 20px'
      }}>
        <Box sx={{
          padding: '20px 0'
        }}>
          <Box sx={{
            color: 'primary.main',
            fontWeight: '600',
            fontSize: '24px',
          }}>{title}</Box>
        </Box>
        <Routes>
          {/* <Route index element={<DashLanding/>}/> */}
          <Route path="/my_account" element={<AccountPage/>}/>
        </Routes>
      </Box>
    </Box>
  )
}