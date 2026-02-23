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
  Spinner,
  Center,
  Button,
  SimpleGrid,
  Text,
  Divider,
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

  const { data: tasaCambio } = useQuery({
    queryKey: ['tasa-cambio'],
    queryFn: async () => {
      const res = await fetch('/api/tasa-cambio')
      if (!res.ok) return { tasa: 0 }
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <Center h="80vh" bgGradient="linear(to-b, brand.50 0%, gray.50 100%)">
        <Spinner size="xl" color="brand.500" thickness="3px" />
      </Center>
    )
  }

  return (
    <Container maxW="container.xl" px={{ base: 2, md: 4 }} py={{ base: 4, md: 6 }}>
      <VStack spacing={6} align="stretch" bgGradient="linear(to-b, brand.50 0%, transparent 120px)" borderRadius="2xl" py={1}>
        <Flex direction={{ base: 'column', sm: 'row' }} justify="space-between" align={{ base: 'stretch', sm: 'center' }} gap={3}>
          <Flex align="center" gap={3}>
            <Box w="4px" h={{ base: 8, md: 10 }} bgGradient="linear(to-b, brand.500, pollo.amarilloOscuro)" borderRadius="full" flexShrink={0} />
            <Heading size={{ base: 'lg', md: 'xl' }} fontWeight="800" color="gray.800">
              <Box as="span" color="brand.600">Historial de Ventas</Box>
            </Heading>
          </Flex>
          <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={() => router.push('/ventas/nueva')} size={{ base: 'sm', md: 'md' }} w={{ base: 'full', sm: 'auto' }} fontWeight="600">
            Nueva Venta
          </Button>
        </Flex>

        {/* Vista Desktop - Tabla */}
        <Box display={{ base: 'none', md: 'block' }} bg="white" p={{ base: 3, md: 6 }} rounded="lg" shadow="md" border="1px solid" borderColor="blackAlpha.100">
          <Table size="sm">
            <Thead>
              <Tr>
                <Th fontWeight="bold" color="gray.800">Factura</Th>
                <Th fontWeight="bold" color="gray.800">Cliente</Th>
                <Th isNumeric fontWeight="bold" color="gray.800">Total</Th>
                <Th isNumeric fontWeight="bold" color="gray.800">Ganancia</Th>
                <Th fontWeight="bold" color="gray.800">Método de Pago</Th>
                <Th fontWeight="bold" color="gray.800">Estado</Th>
                <Th fontWeight="bold" color="gray.800">Fecha</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sales.map((sale: any) => (
                <Tr key={sale.id}>
                  <Td fontWeight="bold">{sale.invoiceNumber}</Td>
                  <Td>{sale.customer?.name || 'N/A'}</Td>
                  <Td isNumeric>
                    <VStack align="end" spacing={0}>
                      <Text fontWeight="bold" color="brand.600">
                        {formatCurrency(sale.total, 'USD')}
                      </Text>
                      {tasaCambio?.tasa > 0 && (
                        <Text fontSize="xs" color="gray.600">
                          ≈ {formatCurrency(sale.total * tasaCambio.tasa, 'VES')}
                        </Text>
                      )}
                    </VStack>
                  </Td>
                  <Td isNumeric>
                    <VStack align="end" spacing={0}>
                      <Text fontWeight="bold" color="green.600">
                        {formatCurrency(sale.ganancia, 'USD')}
                      </Text>
                      {tasaCambio?.tasa > 0 && (
                        <Text fontSize="xs" color="gray.600">
                          ≈ {formatCurrency(sale.ganancia * tasaCambio.tasa, 'VES')}
                        </Text>
                      )}
                    </VStack>
                  </Td>
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

        {/* Vista Mobile - Tarjetas */}
        <VStack display={{ base: 'flex', md: 'none' }} spacing={3} align="stretch">
          {sales.map((sale: any) => (
            <Box
              key={sale.id}
              bg="white"
              p={4}
              rounded="lg"
              shadow="md"
              border="1px solid"
              borderColor="blackAlpha.100"
            >
              <VStack align="stretch" spacing={2}>
                <Flex justify="space-between" align="center">
                  <Text fontWeight="bold" fontSize="lg">{sale.invoiceNumber}</Text>
                  <Badge colorScheme={sale.status === 'completada' ? 'green' : 'red'}>
                    {sale.status}
                  </Badge>
                </Flex>
                <Divider />
                <Flex justify="space-between">
                  <Text color="gray.600" fontSize="sm">Cliente:</Text>
                  <Text fontWeight="500">{sale.customer?.name || 'N/A'}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.600" fontSize="sm">Total:</Text>
                  <VStack align="end" spacing={0}>
                    <Text fontWeight="bold" color="brand.600">{formatCurrency(sale.total, 'USD')}</Text>
                    {tasaCambio?.tasa > 0 && (
                      <Text fontSize="xs" color="gray.600">
                        ≈ {formatCurrency(sale.total * tasaCambio.tasa, 'VES')}
                      </Text>
                    )}
                  </VStack>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.600" fontSize="sm">Ganancia:</Text>
                  <VStack align="end" spacing={0}>
                    <Text fontWeight="bold" color="green.600">{formatCurrency(sale.ganancia, 'USD')}</Text>
                    {tasaCambio?.tasa > 0 && (
                      <Text fontSize="xs" color="gray.600">
                        ≈ {formatCurrency(sale.ganancia * tasaCambio.tasa, 'VES')}
                      </Text>
                    )}
                  </VStack>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.600" fontSize="sm">Pago:</Text>
                  <Text>{sale.paymentMethod}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.600" fontSize="sm">Fecha:</Text>
                  <Text fontSize="sm">{formatDateShort(sale.createdAt)}</Text>
                </Flex>
              </VStack>
            </Box>
          ))}
        </VStack>
      </VStack>
    </Container>
  )
}




