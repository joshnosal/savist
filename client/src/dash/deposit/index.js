import { Box, alpha, Button } from "@mui/material"
import { useState, useContext, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { AppContext } from "../../universal/AppContext"
import DetailsPage from './details'
import ConfirmationPage from './confirmation'
import DepositForm from './form_deposit_details'


export default function DepositRouter(props) {
  const { sx } = useContext(AppContext)
  const location = useLocation()
  const [page, setPage] = useState(!location.state ? 0 : location.state.page || 0)
  const [uniqueID, setUniqueID] = useState('success')

  const pageNext = () => setPage(page+1)
  const pageBack = () => setPage(page-1)

  const maxWidth = 360
  useEffect(() => {
    uniqueID === 'success' ? setPage(2) : uniqueID ? setPage(1) : setPage(0)
  }, [uniqueID])

  useEffect(() => {
    if (!location.state) return
    setPage(location.state.page || 0)
  }, [location])

  return page === 0 ? (
    <DetailsPage 
      sx={sx} 
      pageNext={pageNext} 
      setUniqueID={setUniqueID}
      maxWidth={maxWidth}
    />
  ) : page === 1 ? (
    <ConfirmationPage 
      sx={sx} 
      pageBack={pageBack} 
      pageNext={pageNext} 
      uniqueID={uniqueID} 
      setUniqueID={setUniqueID} 
      maxWidth={maxWidth}
    />
  ) : (
    <SuccessPage 
      sx={sx} 
      maxWidth={maxWidth}
      setPage={setPage}
    />
  )

}

const SuccessPage = (props) => {
  const navigate = useNavigate()
  const { maxWidth, setPage } = props
  return(
    <Box sx={{
      display: 'flex', 
      flexDirection: 'column',
      maxWidth: `${maxWidth}px`,
      overflowY: 'auto',
      paddingBottom: '100px',
      alignItems:'center'
    }}>
      <Button
        color='secondary'
        size='small'
        variant='contained'
        sx={{ marginBottom: '40px' }}
        onClick={()=>setPage(0)}
      >New Deposit</Button>
      <Button
        size='small'
        color='secondary'
        onClick={()=>navigate('../balance')}
      >Check Balance</Button>
    </Box>
  )
}
