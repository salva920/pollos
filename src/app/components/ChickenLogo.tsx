'use client'

import React from 'react'
import { Box } from '@chakra-ui/react'

/** Icono de pollo (cabeza + cresta) para logo tipo venta de pollos - colores rojo y amarillo */
export default function ChickenLogo({ boxSize = 9 }: { boxSize?: number }) {
  return (
    <Box
      bg="brand.500"
      borderRadius="full"
      p={1.5}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      boxSize={boxSize}
      flexShrink={0}
      border="2px solid"
      borderColor="pollo.amarillo"
      boxShadow="0 2px 8px rgba(196, 30, 58, 0.35)"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <ellipse cx="16" cy="14" rx="10" ry="11" fill="#FACC15" />
        <path
          d="M8 8 Q10 4 14 6 Q16 3 18 6 Q22 4 24 8 L23 12 Q20 10 16 11 Q12 10 9 12 Z"
          fill="#DC2626"
        />
        <circle cx="21" cy="13" r="2" fill="#1a1a1a" />
        <path
          d="M6 16 L2 18 L6 20 Z"
          fill="#F59E0B"
          transform="rotate(-10 16 18)"
        />
        <path d="M14 22 Q16 24 18 22" stroke="#DC2626" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </Box>
  )
}
