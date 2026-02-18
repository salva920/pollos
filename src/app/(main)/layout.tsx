import Navbar from '../components/Navbar'
import { Box } from '@chakra-ui/react'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Box minH="100vh" bg="gray.50" bgGradient="linear(to-b, gray.50 0%, gray.100 100%)">
      <Navbar />
      <Box as="main" p={{ base: 4, md: 6 }} maxW="1600px" mx="auto">
        {children}
      </Box>
    </Box>
  )
}




