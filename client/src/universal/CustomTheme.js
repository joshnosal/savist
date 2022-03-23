import { createTheme } from '@mui/material'
import { yellow, deepOrange, green, blue, cyan } from '@mui/material/colors'


const grey = {
  50: '#E0E0E1',
  100: '#E0E0E1',
  200: '#C1C1C3',
  300: '#A2A2A4',
  400: '#838386',
  500: '#838386',
  600: '#646468',
  700: '#45454A',
  800: '#26262B',
  900: '#07070D',
}

export const Theme = createTheme({
    
    palette: {
      primary: {main: cyan[600], light: cyan[300], dark: cyan[900]},
      secondary: {main: deepOrange[800], light: deepOrange.A200, dark: deepOrange[600]},
      warning: {main: yellow[500], light: yellow[300], dark: yellow[600]},
      background: {default: 'white', dark: grey[900]},
      grey: grey
    },

    components: {
      MuiOutlinedInput: {
        variants: [
          {
            props: { variant: 'light_bg' },
            style: { 
              backgroundColor: 'white',
              '& fieldset': { display: 'none' }
            }
          }
        ]
      },
      MuiCheckbox: {
        variants: [
          {
            props: {variant: 'white' },
            style: {
              color: 'white',
              '&.Mui-checked svg': { color: 'white', fill: 'white' }
            }
          }
        ]
      },
      MuiButton: {
        variants: [
          {
            props: {variant: 'contained', disabled: true},
            style: {
              backgroundColor: grey[800]+' !important',
              color: grey[900]+' !important'
            }
          },
          {
            props: {variant: 'contained', color: 'primary'},
            style:{
              color: grey[900],
              fontWeight: '600',
              '&:hover' : {
                backgroundColor: deepOrange[600]
              }
            }
          }
        ]
      }
    }
})

// export const Theme = createTheme({
//   palette: {
//     grey: grey,
//     cyan: cyan,
//     orange: deepOrange,
//     background: {
//       default: 'white',
//       dark: grey[900]
//     },
//     common: {
//       dark: '#0C0C0C'
//     },
//     primary: {main: blue[600], light: blue[300], dark: blue[900]},
//     secondary: {main: deepOrange[800], light: deepOrange.A200, dark: deepOrange[600]},
//     warning: {main: yellow[500], light: yellow[300], dark: yellow[600]},
//     success: {light: green[300], main: green[500], dark: green[800]}
//   },
//   typography: {
//     fontWeightRegular: 300
//   },
//   components:{
//     MuiButton:{
//       variants:[{
//         props: {variant: 'contained'},
//         style:{
//           fontWeight: '600',
//           fontSize: '14px',
//           textTransform: 'none'
//         }
//       }, {
//         props: {variant: 'outlined'},
//         style:{
//           fontWeight: '600',
//           fontSize: '14px',
//           textTransform: 'none',
//         }
//       },{
//         props: {variant: 'outlined', disableRipple: true},
//         style: {
//           fontWeight: '600',
//           fontSize: '14px',
//           textTransform: 'none',
//           color: blue[600],
//           borderColor: grey[100],
//           '&:hover': {
//             backgroundColor: grey[100],
//             borderColor: grey[100]
//           },
//           '&:active': { 
//             backgroundColor: grey[300]
//           }
//         }
//       }]
//     },
//     MuiOutlinedInput: {
//       variants: [
//         {
//           props: { variant: 'darkbg' },
//           style: {
//             color: 'black',
//             borderRadius: '4px',
//             backgroundColor: grey[100],
//             '& input': {borderRadius: '4px'}
//           }
//         }
//       ]
//     }
//   }
// })