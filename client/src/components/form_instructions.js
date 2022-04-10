import { Box, useTheme, alpha } from "@mui/material"

export default function FormInstructions(props) {
  const { marginTop } = props
  const theme = useTheme()
  return (
    <Box sx={{
      fontStyle: 'italic',
      fontWeight: '600',
      fontSize: '12px',
      color: theme.palette.grey[500],
      marginTop: `${marginTop || 0}px`,
      marginBottom: '5px'
    }}>
      {props.children}
    </Box>
  )
}