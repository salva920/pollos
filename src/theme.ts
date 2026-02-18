import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  fonts: {
    heading: '"Inter", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
  },
  colors: {
    brand: {
      50: '#eef9f6',
      100: '#d5f0e9',
      200: '#afe0d8',
      300: '#7dc9be',
      400: '#48ad9e',
      500: '#2a9184',
      600: '#22746b',
      700: '#205d57',
      800: '#1e4c48',
      900: '#1d403c',
    },
  },
  styles: {
    global: {
      'html, body': {
        bg: 'gray.50',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'xl',
      },
      defaultProps: {
        colorScheme: 'brand',
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'brand.500',
        borderRadius: 'xl',
      },
    },
    Select: {
      defaultProps: {
        focusBorderColor: 'brand.500',
        borderRadius: 'xl',
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: '2xl',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
          border: '1px solid',
          borderColor: 'blackAlpha.100',
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: '2xl',
          boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        },
      },
    },
  },
  shadows: {
    card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
    'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
    soft: '0 2px 15px -3px rgb(0 0 0 / 0.07), 0 10px 20px -2px rgb(0 0 0 / 0.04)',
  },
  radii: {
    xl: '12px',
    '2xl': '16px',
    '3xl': '20px',
  },
})

export default theme
