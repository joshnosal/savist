import { Box, useTheme, alpha } from '@mui/material'

const createStyle = (theme) => ({
  container: {
    marginRight: '20px',
  },
  input_base: {
    border: '1px solid '+alpha(theme.palette.background.contrast, 0.5),
    borderRadius: '14px',
    paddingLeft: '14px',
  },
  input_focus: {
    backgroundColor: alpha(theme.palette.background.contrast, 0.1),
    borderColor: theme.palette.background.contrast
  },
  input_error: {
    borderColor: theme.palette.error.main
  }
})

export default function InputContainer(props) {
  const theme = useTheme()
  let { focused, error, title, sx, width } = props
  sx = sx ? sx : createStyle(theme)

  return (
    <Box sx={{
      ...sx.container, 
      minWidth: props.width, 
      maxWidth: width, 
      flexGrow: width ? null : 1, 
      marginBottom: '20px'
    }}>
      <Box sx={{
        color: alpha(theme.palette.primary.main, 0.8),
        fontSize: '14px',
        fontWeight: '400',
        paddingLeft: '14px',
      }}>{title}</Box>
      <Box sx={{
        ...sx.input_base, 
        ...(focused && sx.input_focus), 
        ...(error && sx.input_error),
      }}>
        {props.children}
      </Box>
      {error && (
        <Box sx={{
          color: theme.palette.error.main,
          fontSize: '12px',
          fontWeight: '400',
          lineHeight: '14px',
          padding: '5px 14px 0 14px'
        }}>{error.message}</Box>
      )}
    </Box>
  )
}