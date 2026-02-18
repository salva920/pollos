'use client'

import React from 'react'
import {
  Box,
  Container,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  VStack,
  HStack,
  Spinner,
  Center,
  Button,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { FiPlus } from 'react-icons/fi'
import { useRouter } from 'next/navigation'

export default function VentasPage() {
  const router = useRouter()

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const res = await fetch('/api/sales')
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <Center h="80vh">
        <Spinner size="xl" />
      </Center>
    )
  }

  return (
    <Container maxW="container.xl" px={{ base: 2, md: 4 }} py={{ base: 4, md: 6 }}>
      <VStack spacing={6} align="stretch">
        <Flex direction={{ base: 'column', sm: 'row' }} justify="space-between" align={{ base: 'stretch', sm: 'center' }} gap={3}>
          <Heading size={{ base: 'lg', md: 'xl' }}>Historial de Ventas</Heading>
          <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={() => router.push('/ventas/nueva')} size={{ base: 'sm', md: 'md' }} w={{ base: 'full', sm: 'auto' }}>
            Nueva Venta
          </Button>
        </Flex>

        <Box overflowX="auto" bg="white" p={{ base: 3, md: 6 }} rounded="lg" shadow="md">
          <Table size="sm" minW="600px">
            <Thead>
              <Tr>
                <Th>Factura</Th>
                <Th>Cliente</Th>
                <Th isNumeric>Total</Th>
                <Th isNumeric>Ganancia</Th>
                <Th>Método de Pago</Th>
                <Th>Estado</Th>
                <Th>Fecha</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sales.map((sale: any) => (
                <Tr key={sale.id}>
                  <Td fontWeight="bold">{sale.invoiceNumber}</Td>
                  <Td>{sale.customer?.name || 'N/A'}</Td>
                  <Td isNumeric fontWeight="bold">{formatCurrency(sale.total)}</Td>
                  <Td isNumeric color="green.600">{formatCurrency(sale.ganancia)}</Td>
                  <Td>{sale.paymentMethod}</Td>
                  <Td>
                    <Badge colorScheme={sale.status === 'completada' ? 'green' : 'red'}>
                      {sale.status}
                    </Badge>
                  </Td>
                  <Td fontSize="sm">{formatDateShort(sale.createdAt)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </Container>
  )
}




