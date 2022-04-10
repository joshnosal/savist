import { Box } from "@mui/material"

export default function FormContainer(props) {
  const { maxWidth } = props
  return (
    <Box  sx={{
      display: 'flex', 
      flexWrap:'wrap',
      flexShrink: '0',
      maxWidth: maxWidth || 'none'
    }}>
      {props.children}
    </Box>
  )
}