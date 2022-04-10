import { alpha } from '@mui/material'

export const createStyles = (theme) => ({
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
  },
  input_complete: {
    borderColor: alpha(theme.palette.background.contrast, 0.1)
  },
  input_text_field: {
    '& fieldset': { display: 'none' },
    '& input': { 
      padding: '0', 
      height: '28px',
      fontSize: '14px'
    },
  },
  card: {
    base: {
      color: 'white',
      // lineHeight: '28px',
      fontSize: '14px',
      fontFamily: theme.typography.fontFamily
    },
    invalid: {
      color: theme.palette.error.main
    }
  }
})