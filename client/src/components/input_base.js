import { InputBase, useTheme } from "@mui/material"


export default function CustomInputBase(props) {
  const theme = useTheme()
  let { 
    onFocus,
    onBlur, 
    onChange, 
    width, 
    placeholder, 
    sx, 
    disabled, 
    value,
    startAdornment,
    endAdornment,
    type
  } = props

  return (
    <InputBase
      placeholder={placeholder || '. . .'}
      fullWidth={!width ? true : false}
      disabled={!disabled ? false : disabled}
      margin='none'
      sx={sx ? sx : {
        width: width,
        '& fieldset': { display: 'none' },
        '& input': { 
          padding: '0', 
          height: '28px',
          fontSize: '14px'
        },
      }}
      onChange={onChange}
      value={value || ''}
      onFocus={onFocus}
      onBlur={onBlur}
      startAdornment={startAdornment}
      endAdornment={endAdornment}
      type={type || 'text'}
    />
  )

}