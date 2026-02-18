'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Text,
  Divider,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  Box as ChakraBox,
  Select,
  IconButton,
  Alert,
  AlertIcon,
  Collapse,
  useColorModeValue,
  Spinner,
  Center,
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiTrash2, FiPlus, FiSearch, FiShoppingCart, FiUser, FiPackage, FiSave, FiX } from 'react-icons/fi'
import { formatCurrency, formatDateShort, getStatusColor } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function NuevaVentaPage() {
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()
  
  // Estados principales
  const [customerId, setCustomerId] = useState('')
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [expandedProductIndex, setExpandedProductIndex] = useState<number | null>(null)
  
  // Estados para agregar nuevo cliente
  const { isOpen: isNewCustomerModalOpen, onOpen: onNewCustomerModalOpen, onClose: onNewCustomerModalClose } = useDisclosure()
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerCedula, setNewCustomerCedula] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  
  // Estados para modal de producto
  const { isOpen: isProductModalOpen, onOpen: onProductModalOpen, onClose: onProductModalClose } = useDisclosure()
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [productLotes, setProductLotes] = useState<any[]>([])
  const [loadingLotes, setLoadingLotes] = useState(false)
  const [productQuantity, setProductQuantity] = useState('')
  const [productPrice, setProductPrice] = useState('')
  
  // Estados para modal de confirmación de pago
  const { isOpen: isPaymentModalOpen, onOpen: onPaymentModalOpen, onClose: onPaymentModalClose } = useDisclosure()
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [paymentType, setPaymentType] = useState('bolivares')
  const [amountPaidBs, setAmountPaidBs] = useState('')
  const [amountPaidUsd, setAmountPaidUsd] = useState('')
  const [bank, setBank] = useState('')
  const [referencia, setReferencia] = useState('')
  const collapseBg = useColorModeValue('gray.50', 'gray.800')

  // Queries
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch('/api/customers')
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
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

  // Filtrar clientes por búsqueda
  const filteredCustomers = customers.filter((customer: any) => {
    if (!customerSearchTerm) return false
    const searchLower = customerSearchTerm.toLowerCase()
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.cedula.toLowerCase().includes(searchLower)
    )
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
      onNewCustomerModalClose()
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

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCustomerName || !newCustomerCedula) {
      toast({
        title: 'Error',
        description: 'Nombre y cédula son requeridos',
        status: 'error',
        duration: 3000,
      })
      return
    }
    createCustomerMutation.mutate({
      name: newCustomerName,
      cedula: newCustomerCedula,
      email: newCustomerEmail || undefined,
      phone: newCustomerPhone || undefined,
    })
  }

  // Filtrar productos disponibles
  const availableProducts = products.filter((p: any) => p.stock > 0)

  // Mutations
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
      toast({
        title: 'Venta registrada',
        status: 'success',
        duration: 3000,
      })
      router.push('/ventas')
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

  // Funciones
  const handleSelectProduct = async (product: any) => {
    setSelectedProduct(product)
    setLoadingLotes(true)
    setProductQuantity('')
    setProductPrice(product.pricePerUnit.toString())
    
    try {
      // Los lotes ya vienen incluidos en el producto desde la API
      const lotesDisponibles = product.lotes?.filter((l: any) => l.stockActual > 0 && l.estado !== 'vencido') || []
      setProductLotes(lotesDisponibles)
      
      if (lotesDisponibles.length === 0) {
        toast({
          title: 'Sin stock',
          description: 'No hay lotes disponibles para este producto',
          status: 'warning',
          duration: 3000,
        })
        return
      }
      
      onProductModalOpen()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al cargar lotes del producto',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoadingLotes(false)
    }
  }

  const handleAddProductToSale = () => {
    if (!productQuantity || parseFloat(productQuantity) <= 0) {
      toast({
        title: 'Error',
        description: 'Ingrese una cantidad válida',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (!productPrice || parseFloat(productPrice) <= 0) {
      toast({
        title: 'Error',
        description: 'Ingrese un precio válido',
        status: 'error',
        duration: 3000,
      })
      return
    }

    const cantidad = parseFloat(productQuantity)
    const precio = parseFloat(productPrice)

    // Verificar stock disponible
    const stockDisponible = selectedProduct.lotes?.reduce((sum: number, lote: any) => {
      return sum + (lote.stockActual > 0 && lote.estado !== 'vencido' ? lote.stockActual : 0)
    }, 0) || 0

    if (cantidad > stockDisponible) {
      toast({
        title: 'Stock insuficiente',
        description: `Solo hay ${stockDisponible} unidades disponibles`,
        status: 'error',
        duration: 3000,
      })
      return
    }

    // Agregar producto a la venta
    setItems([...items, {
      productId: selectedProduct.id,
      quantity: cantidad,
      price: precio,
      product: selectedProduct,
    }])

    // Cerrar modal y limpiar
    onProductModalClose()
    setSelectedProduct(null)
    setProductLotes([])
    setProductQuantity('')
    setProductPrice('')
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
    setExpandedProductIndex(null)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      return sum + (item.quantity * item.price)
    }, 0)
  }

  const handleFinalizeSale = () => {
    if (!customerId) {
      toast({
        title: 'Error',
        description: 'Selecciona un cliente',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: 'Error',
        description: 'Agrega al menos un producto',
        status: 'error',
        duration: 3000,
      })
      return
    }

    // Establecer monto por defecto según el tipo de pago
    const total = calculateTotal()
    if (paymentType === 'bolivares' && tasaCambio?.tasa) {
      setAmountPaidBs((total * tasaCambio.tasa).toFixed(2))
    } else if (paymentType === 'dolares') {
      setAmountPaidUsd(total.toFixed(2))
    }

    onPaymentModalOpen()
  }

  // Actualizar monto cuando cambia el tipo de pago
  useEffect(() => {
    if (isPaymentModalOpen) {
      const total = calculateTotal()
      if (paymentType === 'bolivares' && tasaCambio?.tasa) {
        setAmountPaidBs((total * tasaCambio.tasa).toFixed(2))
        setAmountPaidUsd('')
      } else if (paymentType === 'dolares') {
        setAmountPaidUsd(total.toFixed(2))
        setAmountPaidBs('')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentType, isPaymentModalOpen, tasaCambio?.tasa])

  const handleConfirmPayment = () => {
    const saleData: any = {
      customerId,
      items,
      paymentMethod,
      paymentType,
    }

    if (paymentType === 'dolares') {
      if (amountPaidUsd) saleData.amountPaidUsd = parseFloat(amountPaidUsd)
      if (tasaCambio?.tasa) saleData.tasaCambio = tasaCambio.tasa
    } else {
      if (amountPaidBs) saleData.amountPaidBs = parseFloat(amountPaidBs)
    }

    if (paymentMethod !== 'efectivo') {
      if (bank) saleData.bank = bank
      if (referencia) saleData.referencia = referencia
    }

    createSaleMutation.mutate(saleData)
  }

  const selectedCustomer = customers.find((c: any) => c.id === customerId)

  return (
    <Container maxW="container.xl" py={{ base: 4, md: 6 }} px={{ base: 2, md: 4 }}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex direction={{ base: 'column', sm: 'row' }} justify="space-between" align={{ base: 'stretch', sm: 'center' }} gap={3}>
          <HStack spacing={3}>
            <FiShoppingCart size={28} color="var(--chakra-colors-blue-500)" />
            <Heading size={{ base: 'lg', md: 'xl' }} fontWeight="700" color="gray.800">
              Procesar Venta
            </Heading>
          </HStack>
          <Button
            leftIcon={<FiX />}
            variant="outline"
            onClick={() => router.push('/ventas')}
            size={{ base: 'sm', md: 'md' }}
            w={{ base: 'full', sm: 'auto' }}
          >
            Cancelar
          </Button>
        </Flex>

        <Grid templateColumns={{ base: '1fr', lg: '3fr 2fr' }} gap={6}>
          {/* Columna Izquierda: Productos Disponibles */}
          <GridItem minW={0}>
            <Box bg="white" p={{ base: 3, md: 6 }} borderRadius="2xl" boxShadow="md" border="1px solid" borderColor="gray.200" overflow="hidden">
              <VStack spacing={4} align="stretch">
                <Flex direction={{ base: 'column', sm: 'row' }} justify="space-between" align={{ base: 'stretch', sm: 'center' }} gap={2} flexWrap="wrap">
                  <HStack minW={0} flex={1} spacing={2}>
                    <Box as="span" flexShrink={0}><FiPackage size={20} color="var(--chakra-colors-blue-500)" /></Box>
                    <Heading size="md" fontWeight="600" noOfLines={1} minW={0}>
                      Productos Disponibles
                    </Heading>
                  </HStack>
                  <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full" flexShrink={0}>
                    {availableProducts.length} productos
                  </Badge>
                </Flex>

                <Box maxH="600px" overflowY="auto" overflowX="auto" minW={0}>
                  <Table size="sm" variant="simple" minW="520px">
                    <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
                      <Tr>
                        <Th whiteSpace="nowrap">Producto</Th>
                        <Th whiteSpace="nowrap">Categoría</Th>
                        <Th isNumeric whiteSpace="nowrap">Stock</Th>
                        <Th isNumeric whiteSpace="nowrap">Precio</Th>
                        <Th whiteSpace="nowrap">Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {availableProducts.map((product: any) => (
                        <Tr key={product.id} _hover={{ bg: 'gray.50' }}>
                          <Td fontWeight="medium" minW="100px">{product.name}</Td>
                          <Td whiteSpace="nowrap">
                            <Badge colorScheme="blue" size="sm">
                              {product.category}
                            </Badge>
                          </Td>
                          <Td isNumeric whiteSpace="nowrap">
                            <Badge colorScheme={product.stock > product.minStock ? 'green' : 'red'}>
                              {product.stock} {product.unit}
                            </Badge>
                          </Td>
                          <Td whiteSpace="nowrap">
                            <VStack align="end" spacing={0}>
                              <Text fontWeight="bold" fontSize="sm">
                                {formatCurrency(product.pricePerUnit, 'USD')}
                              </Text>
                              {tasaCambio?.tasa > 0 && (
                                <Text fontSize="xs" color="gray.600">
                                  ≈ {formatCurrency(product.pricePerUnit * tasaCambio.tasa, 'VES')}
                                </Text>
                              )}
                            </VStack>
                          </Td>
                          <Td whiteSpace="nowrap">
                            <Button
                              size="sm"
                              leftIcon={<FiPlus />}
                              colorScheme="blue"
                              onClick={() => handleSelectProduct(product)}
                            >
                              Agregar
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </VStack>
            </Box>
          </GridItem>

          {/* Columna Derecha: Detalle de Venta */}
          <GridItem>
            <VStack spacing={6} align="stretch">
              {/* Selección de Cliente */}
<Box bg="white" p={{ base: 4, md: 6 }} borderRadius="2xl" boxShadow="md" border="1px solid" borderColor="gray.200">
              <VStack spacing={4} align="stretch">
                <HStack>
                  <FiUser size={20} color="var(--chakra-colors-blue-500)" />
                    <Heading size="md" fontWeight="600">
                      Cliente
                    </Heading>
                  </HStack>

                  <HStack spacing={2}>
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
                            setTimeout(() => setShowCustomerList(false), 200)
                          }}
                        />
                      </InputGroup>
                    </Box>
                    <Button
                      leftIcon={<FiPlus />}
                      colorScheme="blue"
                      variant="outline"
                      onClick={onNewCustomerModalOpen}
                    >
                      Nuevo Cliente
                    </Button>
                  </HStack>
                  <Box position="relative">
                    {showCustomerList && customerSearchTerm && (
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
                    {selectedCustomer && (
                      <Box mt={2} p={3} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
                        <Text fontSize="sm" fontWeight="medium" color="green.700">
                          Cliente seleccionado: {selectedCustomer.name}
                        </Text>
                        <Text fontSize="xs" color="green.600">
                          Cédula: {selectedCustomer.cedula}
                        </Text>
                      </Box>
                    )}
                  </Box>
                </VStack>
              </Box>

              {/* Detalle de Venta */}
              <Box bg="white" p={{ base: 4, md: 6 }} borderRadius="2xl" boxShadow="md" border="1px solid" borderColor="gray.200">
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <HStack>
                      <FiShoppingCart size={20} color="var(--chakra-colors-blue-500)" />
                      <Heading size="md" fontWeight="600">
                        Detalle de Venta
                      </Heading>
                    </HStack>
                    <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">
                      {items.length} productos
                    </Badge>
                  </HStack>

                  {items.length === 0 ? (
                    <Center py={8}>
                      <VStack spacing={2}>
                        <FiPackage size={48} color="var(--chakra-colors-gray-400)" />
                        <Text color="gray.500">No hay productos agregados</Text>
                        <Text fontSize="sm" color="gray.400">
                          Selecciona productos de la lista para agregarlos
                        </Text>
                      </VStack>
                    </Center>
                  ) : (
                    <Box maxH="400px" overflowY="auto">
                      <Table size="sm" variant="simple">
                        <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
                          <Tr>
                            <Th>Producto</Th>
                            <Th isNumeric>Cantidad</Th>
                            <Th isNumeric>Precio</Th>
                            <Th isNumeric>Subtotal</Th>
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
                                      <Text fontWeight="medium" fontSize="sm">
                                        {product?.name || 'Producto'}
                                      </Text>
                                      {lotesDisponibles.length > 0 && (
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
                                  <Td isNumeric fontWeight="bold">{item.quantity}</Td>
                                  <Td>
                                    <VStack align="end" spacing={0}>
                                      <Text fontWeight="bold" fontSize="sm">
                                        {formatCurrency(item.price, 'USD')}
                                      </Text>
                                      {tasaCambio?.tasa > 0 && (
                                        <Text fontSize="xs" color="gray.600">
                                          ≈ {formatCurrency(item.price * tasaCambio.tasa, 'VES')}
                                        </Text>
                                      )}
                                    </VStack>
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
                                      onClick={() => removeItem(index)}
                                    />
                                  </Td>
                                </Tr>
                                {product && lotesDisponibles.length > 0 && (
                                  <Tr>
                                    <Td colSpan={5} p={0}>
                                      <Collapse in={isExpanded} animateOpacity>
                                        <Box bg={collapseBg} p={4} borderTop="1px solid" borderColor="gray.200">
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

                  {/* Total */}
                  {items.length > 0 && (
                    <>
                      <Divider />
                      <Box bg="blue.50" p={4} borderRadius="md" border="1px solid" borderColor="blue.200">
                        <HStack justify="space-between">
                          <Text fontSize="xl" fontWeight="bold">Total:</Text>
                          <VStack align="flex-end" spacing={0}>
                            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
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
                    </>
                  )}

                  {/* Botón Finalizar */}
                  <Button
                    leftIcon={<FiSave />}
                    colorScheme="green"
                    size="lg"
                    width="full"
                    onClick={handleFinalizeSale}
                    isDisabled={items.length === 0 || !customerId}
                    borderRadius="xl"
                  >
                    Finalizar Venta
                  </Button>
                </VStack>
              </Box>
            </VStack>
          </GridItem>
        </Grid>
      </VStack>

      {/* Modal para seleccionar producto */}
      <Modal isOpen={isProductModalOpen} onClose={onProductModalClose} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader>
            <HStack>
              <FiPackage />
              <Text>Agregar Producto - {selectedProduct?.name}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {loadingLotes ? (
              <Center py={8}>
                <Spinner size="xl" />
              </Center>
            ) : productLotes.length === 0 ? (
              <Alert status="warning">
                <AlertIcon />
                No hay lotes disponibles para este producto
              </Alert>
            ) : (
              <VStack spacing={4} align="stretch">
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="medium">
                      Stock disponible: {productLotes.reduce((sum: number, l: any) => sum + l.stockActual, 0)} {selectedProduct?.unit}
                    </Text>
                    <Text fontSize="xs">
                      Se usará el sistema FIFO (First In, First Out)
                    </Text>
                  </VStack>
                </Alert>

                {/* Información de lotes */}
                {productLotes.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" mb={2}>Lotes disponibles:</Text>
                    <Box overflowX="auto">
                      <Table size="sm" variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Lote</Th>
                            <Th>Stock</Th>
                            <Th isNumeric>Precio Compra</Th>
                            <Th>Vencimiento</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {productLotes.map((lote: any) => (
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
                              <Td fontSize="xs">{formatDateShort(lote.fechaVencimiento)}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </Box>
                )}

                <HStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Cantidad</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={productLotes.reduce((sum: number, l: any) => sum + l.stockActual, 0)}
                      value={productQuantity}
                      onChange={(e) => setProductQuantity(e.target.value)}
                      placeholder="Cantidad"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Precio de Venta (USD)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="Precio"
                    />
                    {selectedProduct && (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Precio sugerido: {formatCurrency(selectedProduct.pricePerUnit, 'USD')}
                        {tasaCambio?.tasa > 0 && (
                          <span> (≈ {formatCurrency(selectedProduct.pricePerUnit * tasaCambio.tasa, 'VES')})</span>
                        )}
                      </Text>
                    )}
                  </FormControl>
                </HStack>

                {productQuantity && productPrice && parseFloat(productQuantity) > 0 && parseFloat(productPrice) > 0 && (
                  <Box p={3} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
                    <HStack justify="space-between">
                      <Text fontWeight="medium">Subtotal:</Text>
                      <VStack align="end" spacing={0}>
                        <Text fontWeight="bold" fontSize="lg" color="green.600">
                          {formatCurrency(parseFloat(productQuantity) * parseFloat(productPrice), 'USD')}
                        </Text>
                        {tasaCambio?.tasa > 0 && (
                          <Text fontSize="xs" color="gray.600">
                            ≈ {formatCurrency(parseFloat(productQuantity) * parseFloat(productPrice) * tasaCambio.tasa, 'VES')} Bs
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onProductModalClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleAddProductToSale}
              isDisabled={!productQuantity || !productPrice || parseFloat(productQuantity) <= 0 || parseFloat(productPrice) <= 0}
            >
              Agregar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Confirmación de Pago */}
      <Modal isOpen={isPaymentModalOpen} onClose={onPaymentModalClose} size="xl">
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader>
            <HStack>
              <FiShoppingCart />
              <Text>Confirmar Pago</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {/* Resumen de la venta */}
              <Box p={4} bg="gray.50" borderRadius="md">
                <Text fontWeight="bold" mb={3}>Resumen de la Venta</Text>
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <Text>Cliente:</Text>
                    <Text fontWeight="medium">{selectedCustomer?.name}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Productos:</Text>
                    <Text fontWeight="medium">{items.length}</Text>
                  </HStack>
                  <Divider />
                  <HStack justify="space-between">
                    <Text fontSize="lg" fontWeight="bold">Total:</Text>
                    <VStack align="end" spacing={0}>
                      <Text fontSize="xl" fontWeight="bold" color="blue.600">
                        {formatCurrency(calculateTotal(), 'USD')}
                      </Text>
                      {tasaCambio?.tasa > 0 && (
                        <Text fontSize="sm" color="gray.600">
                          ≈ {formatCurrency(calculateTotal() * tasaCambio.tasa, 'VES')} Bs
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                </VStack>
              </Box>

              {/* Método y tipo de pago */}
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

              {/* Campos condicionales */}
              {paymentType === 'dolares' && (
                <FormControl>
                  <FormLabel>Monto Pagado (USD)</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={amountPaidUsd}
                    onChange={(e) => setAmountPaidUsd(e.target.value)}
                    placeholder="0.00"
                  />
                </FormControl>
              )}

              {paymentType === 'bolivares' && (
                <FormControl>
                  <FormLabel>Monto Pagado (Bs)</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={amountPaidBs}
                    onChange={(e) => setAmountPaidBs(e.target.value)}
                    placeholder="0.00"
                  />
                </FormControl>
              )}

              {paymentMethod !== 'efectivo' && (
                <FormControl>
                  <FormLabel>Banco</FormLabel>
                  <Input
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    placeholder="Nombre del banco"
                  />
                </FormControl>
              )}

              {paymentMethod === 'transferencia' && (
                <FormControl>
                  <FormLabel>Referencia</FormLabel>
                  <Input
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    placeholder="Número de referencia"
                  />
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onPaymentModalClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="green"
              onClick={handleConfirmPayment}
              isLoading={createSaleMutation.isPending}
            >
              Confirmar Venta
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal para Nuevo Cliente */}
      <Modal isOpen={isNewCustomerModalOpen} onClose={onNewCustomerModalClose} size="md">
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader>
            <HStack>
              <FiUser />
              <Text>Nuevo Cliente</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleCreateCustomer}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nombre completo</FormLabel>
                  <Input
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Nombre del cliente"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Cédula</FormLabel>
                  <Input
                    value={newCustomerCedula}
                    onChange={(e) => setNewCustomerCedula(e.target.value)}
                    placeholder="Número de cédula"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Teléfono</FormLabel>
                  <Input
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="Número de teléfono"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onNewCustomerModalClose}>
                Cancelar
              </Button>
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={createCustomerMutation.isPending}
              >
                Crear Cliente
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Container>
  )
}
