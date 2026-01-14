import { extendTheme } from '@mui/material/styles'
import { red } from '@mui/material/colors'

// Create a theme instance.
const theme = extendTheme({
  colorSchemeSelector: 'class',
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#3C86B0',
          header: 'rgba(255, 255, 255, 0.8)'
        },
        secondary: {
          main: '#19857b'
        },
        error: {
          main: red[500]
        }
      }
    },
    dark: {
      palette: {
        primary: {
          main: '#3C86B0',
          header: 'rgba(33, 33, 33, 0.8)'
        },
        secondary: {
          main: '#19857b'
        },
        error: {
          main: red[500]
        }
      }
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollbarWidth: 'none'
        },
        body: {
          scrollbarWidth: 'none'
        },
        '#root': {
          scrollbarWidth: 'none'
        },
        // Hide scrollbar for Chrome, Safari and Opera
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        // Target all elements for Firefox
        '*': {
          scrollbarWidth: 'none'
        },
        // Target all elements for Chrome/Safari/Edge
        '*::-webkit-scrollbar': {
          display: 'none'
        }
      }
    }
  }
})

export default theme