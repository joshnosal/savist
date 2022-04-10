import { Box, useTheme } from "@mui/material"

export default function FormHeader(props) {
  const { title } = props
  const theme = useTheme()

  return (
    <Box sx={{
      color: theme.palette.grey[200],
      borderBottom: '1px solid '+theme.palette.grey[800],
      fontSize: '16px',
      paddingBottom: '5px',
      marginBottom: '5px',
      fontWeight: '600'
    }}>{title}</Box>
  )
}