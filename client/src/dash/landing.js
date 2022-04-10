import { useContext } from 'react'
import { Box } from '@mui/material'
import { AppContext } from '../universal/AppContext'

export default function DashLanding(props){
  const { brand } = useContext(AppContext)

  return (
    <Box sx={{color: 'primary.main'}}>{`Welcome to ${brand}!`}</Box>
  )
}