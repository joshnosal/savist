import { Box } from '@mui/material'

export default function Container(props){
  const width = props.maxWidth || 200
  return (
  <Box sx={{
    display: 'flex', 
    flexDirection: 'column',
    maxWidth: `${width}px`,
    overflowY: 'auto',
    paddingBottom: '100px'
  }}>{props.children}</Box>
)}