'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Grid,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  HStack,
  Button,
  VStack,
  Text,
  FormControl,
  FormLabel,
  Select,
  Input,
  IconButton,
  useToast,
  Divider,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Collapse,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  Box as ChakraBox,
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatCurrency, formatDateShort, daysUntilExpiration, getStatusColor } from '@/lib/utils'
import { FiAlertTriangle, FiPackage, FiDollarSign, FiShoppingCart, FiRefreshCw, FiPlus, FiTrash2, FiSave, FiSearch } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import TasaCambio from '../components/TasaCambio'

interface Sale {
  id: string
  customer: {
    name: string
  }
  total: number
  status: string
  createdAt: string
  items: Array<{
    product: {
      name: string
    }
    quantity: number
  }>
}

interface Product {
  id: string
  name: string
  stock: number
  minStock: number
  category: string
  pricePerUnit: number
  lotes?: Array<{
    id: string
    loteNumber: string
    stockActual: number
    precioCompra: number
    precioVenta: number
    fechaIngreso: string
    fechaVencimiento: string
    estado: string
  }>
}

interface Lote {
  id: string
  loteNumber: string
  product: {
    name: string
  }
  stockActual: number
  fechaVencimiento: string
  estado: string
}

export default function HomePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()

  // Estado para la venta rápida
  const [customerId, setCustomerId] = useState('')
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [paymentType, setPaymentType] = useState('bolivares')
  const [expandedProductIndex, setExpandedProductIndex] = useState<number | null>(null)

  // Estado para agregar nuevo cliente desde el modal de venta
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerCedula, setNewCustomerCedula] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')

  // Obtener datos
  const { 
    data: sales = [], 
    isLoading: isLoadingSales,
    error: salesError 
  } = useQuery<Sale[]>({
    queryKey: ['sales'],
    queryFn: async () => {
      const res = await fetch('/api/sales')
      if (!res.ok) throw new Error('Error al cargar ventas')
      return res.json()
    }
  })

  const { 
    data: products = [], 
    isLoading: isLoadingProducts,
    error: productsError 
  } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Error al cargar productos')
      return res.json()
    }
  })

  const { data: lotesProximosVencer = [] } = useQuery<Lote[]>({
    queryKey: ['lotes-proximos-vencer'],
    queryFn: async () => {
      const res = await fetch('/api/lotes/verificar-vencimientos')
      if (!res.ok) return []
      return res.json()
    }
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch('/api/customers')
      if (!res.ok) return []
      return res.json()
    },
  })

  // Filtrar clientes por búsqueda
  const filteredCustomers = customers.filter((customer: any) => {
    if (!customerSearchTerm) return false
    const searchLower = customerSearchTerm.toLowerCase()
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.cedula.toLowerCase().includes(searchLower)
    )
  })

  const { data: tasaCambio } = useQuery({
    queryKey: ['tasa-cambio'],
    queryFn: async () => {
      const res = await fetch('/api/tasa-cambio')
      if (!res.ok) return { tasa: 0 }
      return res.json()
    },
  })

  // Mutation para verificar vencimientos
  const verificarVencimientosMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/lotes/verificar-vencimientos', {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotes-proximos-vencer'] })
      queryClient.invalidateQueries({ queryKey: ['alertas'] })
    },
  })

  // Mutation para crear cliente
  const createCustomerMutation = useMutation({
    mutationFn: async (data: { name: string; cedula: string; email?: string; phone?: string }) => {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, type: 'detal' }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear cliente')
      }
      return res.json()
    },
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setCustomerId(newCustomer.id)
      setCustomerSearchTerm(`${newCustomer.name} - ${newCustomer.cedula}`)
      setShowNewCustomerForm(false)
      setNewCustomerName('')
      setNewCustomerCedula('')
      setNewCustomerEmail('')
      setNewCustomerPhone('')
      toast({
        title: 'Cliente creado',
        description: `${newCustomer.name} agregado. Ya está seleccionado para la venta.`,
        status: 'success',
        duration: 3000,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    },
  })

  // Mutation para crear venta
  const createSaleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: '¡Venta registrada!',
        status: 'success',
        duration: 3000,
      })
      resetSaleForm()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    },
  })

  // Mutation para sincronizar lotes
  const syncLotesMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/products/sync-lotes', {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Error al sincronizar')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: 'Lotes sincronizados',
        description: `${data.productosCorregidos} productos corregidos`,
        status: 'success',
        duration: 3000,
      })
    },
  })

  // Funciones para manejar ventas
  const resetSaleForm = () => {
    setCustomerId('')
    setCustomerSearchTerm('')
    setShowCustomerList(false)
    setItems([])
    setPaymentMethod('efectivo')
    setPaymentType('bolivares')
    setShowNewCustomerForm(false)
    setNewCustomerName('')
    setNewCustomerCedula('')
    setNewCustomerEmail('')
    setNewCustomerPhone('')
  }

  const handleCreateCustomer = () => {
    if (!newCustomerName.trim() || !newCustomerCedula.trim()) {
      toast({
        title: 'Campos requeridos',
        description: 'Nombre y cédula son obligatorios',
        status: 'error',
        duration: 3000,
      })
      return
    }
    createCustomerMutation.mutate({
      name: newCustomerName.trim(),
      cedula: newCustomerCedula.trim(),
      email: newCustomerEmail.trim() || undefined,
      phone: newCustomerPhone.trim() || undefined,
    }, {
      onSuccess: (newCustomer) => {
        // Seleccionar el cliente recién creado
        setCustomerId(newCustomer.id)
        setCustomerSearchTerm(`${newCustomer.name} - ${newCustomer.cedula}`)
        setShowNewCustomerForm(false)
      }
    })
  }

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1, price: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index][field] = value

    if (field === 'productId') {
      const product = products.find((p: any) => p.id === value)
      if (product) {
        newItems[index].price = product.pricePerUnit
      }
    }

    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      return sum + (item.quantity * item.price)
    }, 0)
  }

  const handleSubmitSale = () => {
    if (!customerId) {
      toast({
        title: 'Error',
        description: 'Selecciona un cliente',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (items.length === 0 || items.some(item => !item.productId)) {
      toast({
        title: 'Error',
        description: 'Agrega al menos un producto válido',
        status: 'error',
        duration: 3000,
      })
      return
    }

    createSaleMutation.mutate({
      customerId,
      items,
      paymentMethod,
      paymentType,
    })
  }

  // Verificar vencimientos al cargar
  useEffect(() => {
    verificarVencimientosMutation.mutate()
  }, [])

  if (isLoadingSales || isLoadingProducts) {
    return (
      <Center h="80vh">
        <Spinner size="xl" />
      </Center>
    )
  }

  if (salesError || productsError) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          Error al cargar los datos. Por favor, intente nuevamente.
        </Alert>
      </Container>
    )
  }

  // Calcular ventas del día
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todaySales = sales
    .filter(sale => new Date(sale.createdAt) >= today && sale.status === 'completada')
    .reduce((total, sale) => total + (sale.total || 0), 0)

  // Calcular productos con bajo stock
  const lowStockProducts = products.filter(product => (product.stock || 0) <= (product.minStock || 0))

  // Calcular productos más vendidos
  const productCounts: { [key: string]: number } = {}
  sales.forEach(sale => {
    if (sale.status === 'completada') {
      sale.items?.forEach(item => {
        if (item?.product?.name) {
          const name = item.product.name
          productCounts[name] = (productCounts[name] || 0) + (item.quantity || 0)
        }
      })
    }
  })
  const topProducts = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Obtener últimas ventas
  const recentSales = [...sales]
    .filter(s => s.status === 'completada')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const totalStock = products.reduce((total, p) => total + (p.stock || 0), 0)

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between" flexWrap="wrap" gap={4}>
          <Heading size="xl" fontWeight="700" color="gray.800">Dashboard</Heading>
          <HStack>
            <Button
              leftIcon={<FiShoppingCart />}
              colorScheme="brand"
              onClick={() => router.push('/ventas/nueva')}
              size="md"
              borderRadius="xl"
              fontWeight="600"
            >
              Nueva Venta
            </Button>
            <Button
              leftIcon={<FiRefreshCw />}
              variant="outline"
              colorScheme="brand"
              onClick={() => {
                queryClient.invalidateQueries()
                verificarVencimientosMutation.mutate()
              }}
              size="sm"
              borderRadius="xl"
              isLoading={verificarVencimientosMutation.isPending}
            >
              Actualizar
            </Button>
          </HStack>
        </HStack>

        {/* Tasa de cambio */}
        <TasaCambio />

        {/* Alerta: Sincronizar lotes */}
        {products.some((p: any) => p.stock > 0 && (!p.lotes || p.lotes.length === 0)) && (
          <Alert status="error" borderRadius="2xl" boxShadow="card">
            <AlertIcon />
            <VStack align="start" spacing={1} flex="1">
              <Text fontWeight="bold">
                ⚠️ Productos con stock pero sin lotes disponibles
              </Text>
              <Text fontSize="sm">
                Algunos productos tienen stock pero no tienen lotes creados. Esto puede causar errores al vender.
              </Text>
            </VStack>
            <Button
              size="sm"
              colorScheme="red"
              borderRadius="xl"
              onClick={() => syncLotesMutation.mutate()}
              isLoading={syncLotesMutation.isPending}
            >
              Sincronizar Ahora
            </Button>
          </Alert>
        )}

        {/* Alertas de vencimiento */}
        {lotesProximosVencer.length > 0 && (
          <Alert status="warning" borderRadius="2xl" boxShadow="card">
            <AlertIcon />
            <VStack align="start" spacing={1} flex="1">
              <Text fontWeight="bold">
                ⚠️ {lotesProximosVencer.length} lotes próximos a vencer
              </Text>
              {lotesProximosVencer.slice(0, 3).map(lote => (
                <Text key={lote.id} fontSize="sm">
                  • {lote.product.name} - Lote {lote.loteNumber} (vence en {daysUntilExpiration(lote.fechaVencimiento)} días)
                </Text>
              ))}
            </VStack>
          </Alert>
        )}
        
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
          <Stat
            px={5}
            py={6}
            borderRadius="2xl"
            boxShadow="0 1px 3px 0 rgb(0 0 0 / 0.06)"
            border="1px solid"
            borderColor="blackAlpha.100"
            bg="white"
          >
            <StatLabel>
              <HStack color="gray.500" fontSize="sm" fontWeight="500">
                <FiDollarSign />
                <Text>Ventas del Día</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="green.600" fontWeight="700" fontSize="2xl" mt={1}>{formatCurrency(todaySales)}</StatNumber>
            <StatHelpText color="gray.500" mt={1}>
              {sales.filter(s => new Date(s.createdAt) >= today && s.status === 'completada').length} ventas
            </StatHelpText>
          </Stat>

          <Stat
            px={5}
            py={6}
            borderRadius="2xl"
            boxShadow="0 1px 3px 0 rgb(0 0 0 / 0.06)"
            border="1px solid"
            borderColor="blackAlpha.100"
            bg="white"
          >
            <StatLabel>
              <HStack color="gray.500" fontSize="sm" fontWeight="500">
                <FiPackage />
                <Text>Productos en Stock</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="blue.600" fontWeight="700" fontSize="2xl" mt={1}>{products.length}</StatNumber>
            <StatHelpText color="gray.500" mt={1}>
              {totalStock.toFixed(0)} unidades totales
            </StatHelpText>
          </Stat>

          <Stat
            px={5}
            py={6}
            borderRadius="2xl"
            boxShadow="0 1px 3px 0 rgb(0 0 0 / 0.06)"
            border="1px solid"
            borderColor="blackAlpha.100"
            bg="white"
          >
            <StatLabel>
              <HStack color="gray.500" fontSize="sm" fontWeight="500">
                <FiAlertTriangle />
                <Text>Stock Bajo</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="orange.600" fontWeight="700" fontSize="2xl" mt={1}>{lowStockProducts.length}</StatNumber>
            <StatHelpText color="gray.500" mt={1}>Productos con stock mínimo</StatHelpText>
          </Stat>

          <Stat
            px={5}
            py={6}
            borderRadius="2xl"
            boxShadow="0 1px 3px 0 rgb(0 0 0 / 0.06)"
            border="1px solid"
            borderColor="blackAlpha.100"
            bg="white"
          >
            <StatLabel>
              <HStack color="gray.500" fontSize="sm" fontWeight="500">
                <FiShoppingCart />
                <Text>Total Ventas</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="purple.600" fontWeight="700" fontSize="2xl" mt={1}>{sales.filter(s => s.status === 'completada').length}</StatNumber>
            <StatHelpText color="gray.500" mt={1}>Ventas completadas</StatHelpText>
          </Stat>
        </SimpleGrid>

        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
          <Box p={6} borderRadius="2xl" boxShadow="0 1px 3px 0 rgb(0 0 0 / 0.06)" border="1px solid" borderColor="blackAlpha.100" bg="white">
            <Heading size="md" mb={4} fontWeight="600" color="gray.800">Productos más vendidos</Heading>
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Producto</Th>
                  <Th isNumeric>Cantidad</Th>
                </Tr>
              </Thead>
              <Tbody>
                {topProducts.length > 0 ? topProducts.map(([name, quantity]) => (
                  <Tr key={name}>
                    <Td>{name}</Td>
                    <Td isNumeric fontWeight="bold">{quantity}</Td>
                  </Tr>
                )) : (
                  <Tr>
                    <Td colSpan={2} textAlign="center" color="gray.500">
                      No hay ventas registradas
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>

          <Box p={6} borderRadius="2xl" boxShadow="0 1px 3px 0 rgb(0 0 0 / 0.06)" border="1px solid" borderColor="blackAlpha.100" bg="white">
            <Heading size="md" mb={4} fontWeight="600" color="gray.800">Últimas ventas</Heading>
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Cliente</Th>
                  <Th isNumeric>Total</Th>
                  <Th>Fecha</Th>
                </Tr>
              </Thead>
              <Tbody>
                {recentSales.length > 0 ? recentSales.map((sale) => (
                  <Tr key={sale.id}>
                    <Td>{sale.customer?.name || 'Cliente desconocido'}</Td>
                    <Td isNumeric fontWeight="bold">{formatCurrency(sale.total || 0)}</Td>
                    <Td fontSize="xs">{formatDateShort(sale.createdAt)}</Td>
                  </Tr>
                )) : (
                  <Tr>
                    <Td colSpan={3} textAlign="center" color="gray.500">
                      No hay ventas registradas
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </Grid>

        {/* Productos con bajo stock */}
        {lowStockProducts.length > 0 && (
          <Box p={6} borderRadius="2xl" boxShadow="0 1px 3px 0 rgb(0 0 0 / 0.06)" border="1px solid" borderColor="orange.200" bg="orange.50">
            <Heading size="md" mb={4} color="orange.700" fontWeight="600">
              ⚠️ Productos con Stock Bajo
            </Heading>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Producto</Th>
                  <Th>Categoría</Th>
                  <Th isNumeric>Stock Actual</Th>
                  <Th isNumeric>Stock Mínimo</Th>
                </Tr>
              </Thead>
              <Tbody>
                {lowStockProducts.map((product) => (
                  <Tr key={product.id}>
                    <Td fontWeight="bold">{product.name}</Td>
                    <Td>
                      <Badge colorScheme="blue">{product.category}</Badge>
                    </Td>
                    <Td isNumeric color="orange.600" fontWeight="bold">{product.stock}</Td>
                    <Td isNumeric>{product.minStock}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </VStack>

      {/* Modal de Nueva Venta */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl" mx={4}>
          <ModalHeader fontWeight="600">Nueva Venta Rápida</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Cliente</FormLabel>
                <HStack spacing={2} align="stretch">
                  <Box position="relative" flex={1}>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <FiSearch color="gray.300" />
                      </InputLeftElement>
                      <Input
                        placeholder="Buscar por nombre o cédula..."
                        value={customerSearchTerm}
                        onChange={(e) => {
                          setCustomerSearchTerm(e.target.value)
                          setShowCustomerList(true)
                          if (!e.target.value) {
                            setCustomerId('')
                          }
                        }}
                        onFocus={() => setShowCustomerList(true)}
                        onBlur={() => {
                          // Delay para permitir el click en la lista
                          setTimeout(() => setShowCustomerList(false), 200)
                        }}
                        isDisabled={showNewCustomerForm}
                      />
                    </InputGroup>
                    {showCustomerList && customerSearchTerm && !showNewCustomerForm && (
                      <ChakraBox
                        position="absolute"
                        zIndex={1000}
                        w="full"
                        mt={1}
                        bg="white"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="md"
                        boxShadow="lg"
                        maxH="200px"
                        overflowY="auto"
                      >
                        {filteredCustomers.length > 0 ? (
                          <List spacing={0}>
                            {filteredCustomers.map((customer: any) => (
                              <ListItem
                                key={customer.id}
                                px={4}
                                py={2}
                                cursor="pointer"
                                _hover={{ bg: 'gray.100' }}
                                onClick={() => {
                                  setCustomerId(customer.id)
                                  setCustomerSearchTerm(`${customer.name} - ${customer.cedula}`)
                                  setShowCustomerList(false)
                                }}
                                borderBottom="1px solid"
                                borderColor="gray.100"
                              >
                                <Text fontWeight="medium">{customer.name}</Text>
                                <Text fontSize="sm" color="gray.600">Cédula: {customer.cedula}</Text>
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Box px={4} py={3} textAlign="center" color="gray.500">
                            <Text fontSize="sm">No se encontraron clientes</Text>
                          </Box>
                        )}
                      </ChakraBox>
                    )}
                    {customerId && !showNewCustomerForm && (
                      <Text fontSize="sm" color="green.600" mt={2}>
                        Cliente seleccionado: {customers.find((c: any) => c.id === customerId)?.name}
                      </Text>
                    )}
                  </Box>
                  <Button
                    size="sm"
                    leftIcon={<FiPlus />}
                    variant="outline"
                    colorScheme="blue"
                    onClick={() => {
                      setShowNewCustomerForm(!showNewCustomerForm)
                      if (showNewCustomerForm) {
                        setCustomerSearchTerm('')
                        setCustomerId('')
                      }
                    }}
                    whiteSpace="nowrap"
                  >
                    {showNewCustomerForm ? 'Cancelar' : 'Nuevo cliente'}
                  </Button>
                </HStack>
                {showNewCustomerForm && (
                  <Box mt={3} p={4} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                    <Text fontWeight="semibold" mb={3} fontSize="sm">Datos del nuevo cliente</Text>
                    <VStack spacing={3} align="stretch">
                      <HStack spacing={3}>
                        <FormControl isRequired size="sm">
                          <FormLabel fontSize="sm">Nombre</FormLabel>
                          <Input
                            size="sm"
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                            placeholder="Nombre completo"
                          />
                        </FormControl>
                        <FormControl isRequired size="sm">
                          <FormLabel fontSize="sm">Cédula</FormLabel>
                          <Input
                            size="sm"
                            value={newCustomerCedula}
                            onChange={(e) => setNewCustomerCedula(e.target.value)}
                            placeholder="V-12345678"
                          />
                        </FormControl>
                      </HStack>
                      <HStack spacing={3}>
                        <FormControl size="sm">
                          <FormLabel fontSize="sm">Teléfono</FormLabel>
                          <Input
                            size="sm"
                            value={newCustomerPhone}
                            onChange={(e) => setNewCustomerPhone(e.target.value)}
                            placeholder="Opcional"
                          />
                        </FormControl>
                        <FormControl size="sm">
                          <FormLabel fontSize="sm">Email</FormLabel>
                          <Input
                            size="sm"
                            type="email"
                            value={newCustomerEmail}
                            onChange={(e) => setNewCustomerEmail(e.target.value)}
                            placeholder="Opcional"
                          />
                        </FormControl>
                      </HStack>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={handleCreateCustomer}
                        isLoading={createCustomerMutation.isPending}
                        alignSelf="flex-start"
                      >
                        Crear y seleccionar cliente
                      </Button>
                    </VStack>
                  </Box>
                )}
              </FormControl>

              <Divider />

              <HStack justify="space-between">
                <Text fontWeight="bold">Productos</Text>
                <Button leftIcon={<FiPlus />} size="sm" onClick={addItem} colorScheme="blue">
                  Agregar Producto
                </Button>
              </HStack>

              {items.length > 0 && (
                <Box overflowX="auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Producto</Th>
                        <Th width="100px">Cantidad</Th>
                        <Th width="120px">Precio Final</Th>
                        <Th>Subtotal</Th>
                        <Th width="50px"></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {items.map((item, index) => {
                        const product = products.find((p: any) => p.id === item.productId)
                        const lotesDisponibles = product?.lotes?.filter((l: any) => l.stockActual > 0 && l.estado !== 'vencido') || []
                        const isExpanded = expandedProductIndex === index
                        
                        return (
                          <React.Fragment key={index}>
                            <Tr>
                              <Td>
                                <VStack align="start" spacing={1}>
                                  <Select
                                    value={item.productId}
                                    onChange={(e) => {
                                      updateItem(index, 'productId', e.target.value)
                                      setExpandedProductIndex(null)
                                    }}
                                    size="sm"
                                  >
                                    <option value="">Seleccionar</option>
                                    {products.filter((p: any) => p.stock > 0).map((product: any) => (
                                      <option key={product.id} value={product.id}>
                                        {product.name} (Stock: {product.stock})
                                      </option>
                                    ))}
                                  </Select>
                                  {product && lotesDisponibles.length > 0 && (
                                    <Button
                                      size="xs"
                                      variant="link"
                                      colorScheme="blue"
                                      onClick={() => setExpandedProductIndex(isExpanded ? null : index)}
                                    >
                                      {isExpanded ? 'Ocultar' : 'Ver'} lotes ({lotesDisponibles.length})
                                    </Button>
                                  )}
                                </VStack>
                              </Td>
                              <Td>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  max={product?.stock || 9999}
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                  size="sm"
                                />
                              </Td>
                              <Td>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.price}
                                  onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                                  size="sm"
                                  placeholder={product?.pricePerUnit?.toString() || '0'}
                                />
                              {product && (
                                <VStack align="start" spacing={0} mt={0.5}>
                                  <Text fontSize="xs" color="gray.700" fontWeight="medium">
                                    Precio: {formatCurrency(product.pricePerUnit, 'USD')}
                                  </Text>
                                  {tasaCambio?.tasa > 0 && (
                                    <Text fontSize="xs" color="gray.500">
                                      ≈ {formatCurrency(product.pricePerUnit * tasaCambio.tasa, 'VES')}
                                    </Text>
                                  )}
                                </VStack>
                              )}
                            </Td>
                            <Td>
                              <VStack align="end" spacing={0}>
                                <Text fontWeight="bold" fontSize="sm">
                                  {formatCurrency(item.quantity * item.price, 'USD')}
                                </Text>
                                {tasaCambio?.tasa > 0 && (
                                  <Text fontSize="xs" color="gray.600">
                                    ≈ {formatCurrency(item.quantity * item.price * tasaCambio.tasa, 'VES')}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                              <Td>
                                <IconButton
                                  aria-label="Eliminar"
                                  icon={<FiTrash2 />}
                                  size="sm"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => {
                                    removeItem(index)
                                    setExpandedProductIndex(null)
                                  }}
                                />
                              </Td>
                            </Tr>
                            {product && lotesDisponibles.length > 0 && (
                              <Tr>
                                <Td colSpan={5} p={0}>
                                  <Collapse in={isExpanded} animateOpacity>
                                    <Box bg={useColorModeValue('gray.50', 'gray.800')} p={4} borderTop="1px solid" borderColor="gray.200">
                                      <VStack align="stretch" spacing={3}>
                                        <Text fontWeight="bold" fontSize="sm" color="gray.700">
                                          Información de Lotes - {product.name}
                                        </Text>
                                        <Box overflowX="auto">
                                          <Table size="sm" variant="simple">
                                            <Thead>
                                              <Tr>
                                                <Th>Lote</Th>
                                                <Th>Stock</Th>
                                                <Th isNumeric>Precio Compra</Th>
                                                <Th isNumeric>Precio Venta</Th>
                                                <Th isNumeric>Ganancia Unit.</Th>
                                                <Th>Vencimiento</Th>
                                                <Th>Estado</Th>
                                                <Th>Diferencia</Th>
                                              </Tr>
                                            </Thead>
                                            <Tbody>
                                        {lotesDisponibles.map((lote: any, loteIndex: number) => {
                                          const precioVenta = product.pricePerUnit
                                          const gananciaUnit = precioVenta - lote.precioCompra
                                          const loteAnterior = loteIndex > 0 ? lotesDisponibles[loteIndex - 1] : null
                                          const diferenciaPrecio = loteAnterior ? lote.precioCompra - loteAnterior.precioCompra : 0
                                          
                                          return (
                                            <Tr key={lote.id}>
                                              <Td fontSize="xs">{lote.loteNumber}</Td>
                                              <Td fontSize="xs">{lote.stockActual}</Td>
                                              <Td fontSize="xs">
                                                <VStack align="end" spacing={0}>
                                                  <Text fontWeight="bold">
                                                    {formatCurrency(lote.precioCompra, 'USD')}
                                                  </Text>
                                                  {tasaCambio?.tasa > 0 && (
                                                    <Text fontSize="xs" color="gray.600">
                                                      ≈ {formatCurrency(lote.precioCompra * tasaCambio.tasa, 'VES')}
                                                    </Text>
                                                  )}
                                                </VStack>
                                              </Td>
                                              <Td fontSize="xs">
                                                <VStack align="end" spacing={0}>
                                                  <Text>
                                                    {formatCurrency(precioVenta, 'USD')}
                                                  </Text>
                                                  {tasaCambio?.tasa > 0 && (
                                                    <Text fontSize="xs" color="gray.600">
                                                      ≈ {formatCurrency(precioVenta * tasaCambio.tasa, 'VES')}
                                                    </Text>
                                                  )}
                                                </VStack>
                                              </Td>
                                              <Td fontSize="xs">
                                                <VStack align="end" spacing={0}>
                                                  <Text fontWeight="bold" color={gananciaUnit >= 0 ? 'green.600' : 'red.600'}>
                                                    {formatCurrency(gananciaUnit, 'USD')}
                                                  </Text>
                                                  {tasaCambio?.tasa > 0 && (
                                                    <Text fontSize="xs" color="gray.600">
                                                      ≈ {formatCurrency(gananciaUnit * tasaCambio.tasa, 'VES')}
                                                    </Text>
                                                  )}
                                                </VStack>
                                              </Td>
                                              <Td fontSize="xs">{formatDateShort(lote.fechaVencimiento)}</Td>
                                              <Td>
                                                <Badge colorScheme={getStatusColor(lote.estado)} size="sm">
                                                  {lote.estado}
                                                </Badge>
                                              </Td>
                                              <Td fontSize="xs">
                                                {loteIndex === 0 ? (
                                                  <Text color="gray.500">Lote más antiguo</Text>
                                                ) : diferenciaPrecio !== 0 ? (
                                                  <VStack align="start" spacing={0}>
                                                    <Text color={diferenciaPrecio > 0 ? 'orange.600' : 'blue.600'} fontWeight="medium">
                                                      {diferenciaPrecio > 0 ? '+' : ''}{formatCurrency(diferenciaPrecio, 'USD')} vs anterior
                                                    </Text>
                                                    {tasaCambio?.tasa > 0 && (
                                                      <Text fontSize="xs" color="gray.600">
                                                        ≈ {formatCurrency(Math.abs(diferenciaPrecio) * tasaCambio.tasa, 'VES')}
                                                      </Text>
                                                    )}
                                                  </VStack>
                                                ) : (
                                                  <Text color="gray.500">Sin diferencia</Text>
                                                )}
                                              </Td>
                                            </Tr>
                                          )
                                        })}
                                            </Tbody>
                                          </Table>
                                        </Box>
                                        {lotesDisponibles.length > 1 && (
                                          <Alert status="info" size="sm" borderRadius="md">
                                            <AlertIcon />
                                            <Text fontSize="xs">
                                              Se venderá usando FIFO (First In, First Out). El lote más antiguo se usará primero.
                                            </Text>
                                          </Alert>
                                        )}
                                      </VStack>
                                    </Box>
                                  </Collapse>
                                </Td>
                              </Tr>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </Tbody>
                  </Table>
                </Box>
              )}

              <Divider />

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Método de Pago</FormLabel>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="punto">Punto de Venta</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Tipo de Pago</FormLabel>
                  <Select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                  >
                    <option value="bolivares">Bolívares</option>
                    <option value="dolares">Dólares</option>
                  </Select>
                </FormControl>
              </HStack>

              <Box bg="green.50" p={4} rounded="md">
                <HStack justify="space-between" flexWrap="wrap" gap={2}>
                  <Text fontSize="xl" fontWeight="bold">Total:</Text>
                  <VStack align="flex-end" spacing={0}>
                    <Text fontSize="2xl" fontWeight="bold" color="green.600">
                      {formatCurrency(calculateTotal(), 'USD')}
                    </Text>
                    {tasaCambio?.tasa > 0 && (
                      <Text fontSize="sm" color="gray.600">
                        ≈ {formatCurrency(calculateTotal() * tasaCambio.tasa, 'VES')} Bs
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </Box>

              <HStack spacing={4}>
                <Button
                  leftIcon={<FiSave />}
                  colorScheme="brand"
                  flex={1}
                  onClick={handleSubmitSale}
                  isLoading={createSaleMutation.isPending}
                  size="lg"
                  borderRadius="xl"
                  fontWeight="600"
                >
                  Registrar Venta
                </Button>
                <Button
                  variant="outline"
                  colorScheme="brand"
                  borderRadius="xl"
                  onClick={() => {
                    resetSaleForm()
                    onClose()
                  }}
                >
                  Cancelar
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}




