'use client'

import React, { useState } from 'react'
import {
  Box,
  Button,
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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  useToast,
  Spinner,
  Center,
  IconButton,
  Checkbox,
  Textarea,
  InputGroup,
  InputLeftElement,
  Alert,
  AlertIcon,
  Text,
} from '@chakra-ui/react'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiLock, FiPackage } from 'react-icons/fi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCategoryName, formatCurrency } from '@/lib/utils'

const CATEGORIES = ['pollo', 'huevos', 'queso', 'lacteos', 'viveres']
const UNITS = ['kg', 'unidad', 'docena', 'litro', 'paquete', 'gramos']

const ADMIN_UNLOCK_KEY = 'admin_module_unlocked'
const ADMIN_UNLOCK_EXPIRY_MS = 30 * 60 * 1000

function isAdminUnlocked(): boolean {
  if (typeof window === 'undefined') return false
  const data = sessionStorage.getItem(ADMIN_UNLOCK_KEY)
  if (!data) return false
  try {
    const { expires } = JSON.parse(data)
    if (Date.now() > expires) {
      sessionStorage.removeItem(ADMIN_UNLOCK_KEY)
      return false
    }
    return true
  } catch {
    return false
  }
}

function setAdminUnlocked() {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(ADMIN_UNLOCK_KEY, JSON.stringify({
    expires: Date.now() + ADMIN_UNLOCK_EXPIRY_MS,
  }))
}

export default function ProductosPage() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isLoteModalOpen, onOpen: onLoteModalOpen, onClose: onLoteModalClose } = useDisclosure()
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [selectedProductForLote, setSelectedProductForLote] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [adminPasswordInput, setAdminPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [pendingAction, setPendingAction] = useState<{ type: 'open' } | { type: 'edit'; product: any } | { type: 'delete'; id: string } | null>(null)
  const [loteFormData, setLoteFormData] = useState({
    cantidad: '',
    precioCompra: '',
    fechaIngreso: '',
    horaIngreso: '',
    fechaVencimiento: '',
  })
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: me } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
  })

  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores'],
    queryFn: async () => {
      const res = await fetch('/api/proveedores')
      if (!res.ok) return []
      return res.json()
    },
  })

  const isAdmin = me?.user?.role === 'admin'

  const verifyPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await fetch('/api/auth/verify-admin-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) return { valid: false, error: data.error }
      return data
    },
    onSuccess: (data) => {
      if (data.valid && pendingAction) {
        setAdminUnlocked()
        setShowPasswordModal(false)
        setAdminPasswordInput('')
        setPasswordError('')
        const action = pendingAction
        setPendingAction(null)
        if (action.type === 'open') {
          handleOpen()
        } else if (action.type === 'edit') {
          handleOpen(action.product)
        } else if (action.type === 'delete') {
          if (confirm('¿Estás seguro de eliminar este producto?')) {
            deleteMutation.mutate(action.id)
          }
        }
        toast({ title: 'Acceso concedido', status: 'success', duration: 2000 })
      } else {
        setPasswordError(data?.error || 'Contraseña incorrecta')
      }
    },
    onError: () => setPasswordError('Contraseña incorrecta'),
  })

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subCategory: '',
    description: '',
    unit: '',
    precioInicial: '',
    pricePerUnit: '',
    stock: '',
    minStock: '',
    isPerishable: true,
    refrigerationRequired: false,
    shelfLifeDays: '',
    supplier: '',
    sku: '',
    barcode: '',
  })

  const { data: products = [], isLoading } = useQuery({
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

  // Calcular ganancia
  const precioInicialNum = formData.precioInicial ? parseFloat(formData.precioInicial) : 0
  const precioFinalNum = parseFloat(formData.pricePerUnit) || 0
  const ganancia = precioInicialNum > 0 ? precioFinalNum - precioInicialNum : 0
  const tasa = tasaCambio?.tasa || 0

  const syncLotesMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/products/sync-lotes', {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: 'Sincronización completada',
        description: `${data.productosCorregidos} productos sincronizados`,
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

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/products', {
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
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: 'Producto creado',
        status: 'success',
        duration: 3000,
      })
      handleClose()
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: 'Producto actualizado',
        status: 'success',
        duration: 3000,
      })
      handleClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: 'Producto eliminado',
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

  const addLoteMutation = useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: any }) => {
      const res = await fetch(`/api/products/${productId}/lote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al agregar lote')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: 'Lote agregado',
        description: 'El nuevo lote ha sido registrado y el stock ha sido actualizado',
        status: 'success',
        duration: 3000,
      })
      handleCloseLoteModal()
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

  const handleOpenLoteModal = (product: any) => {
    setSelectedProductForLote(product)
    // Establecer valores por defecto
    const now = new Date()
    const fechaIngreso = now.toISOString().split('T')[0]
    const horaActual = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
    
    // Calcular fecha de vencimiento por defecto (usando días de vida útil del producto o 365 días)
    const fechaVencimiento = new Date(now)
    const diasVida = product.shelfLifeDays || 365
    fechaVencimiento.setDate(fechaVencimiento.getDate() + diasVida)
    
    // Usar precioInicial del producto como valor por defecto para precioCompra del lote
    const precioCompraDefault = product.precioInicial ? product.precioInicial.toString() : ''
    
    setLoteFormData({
      cantidad: '',
      precioCompra: precioCompraDefault,
      fechaIngreso: fechaIngreso,
      horaIngreso: horaActual,
      fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
    })
    onLoteModalOpen()
  }

  const handleCloseLoteModal = () => {
    setSelectedProductForLote(null)
    setLoteFormData({
      cantidad: '',
      precioCompra: '',
      fechaIngreso: '',
      horaIngreso: '',
      fechaVencimiento: '',
    })
    onLoteModalClose()
  }

  const handleSubmitLote = () => {
    if (!loteFormData.cantidad || parseFloat(loteFormData.cantidad) <= 0) {
      toast({
        title: 'Error',
        description: 'La cantidad debe ser mayor a 0',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (!loteFormData.precioCompra || parseFloat(loteFormData.precioCompra) < 0) {
      toast({
        title: 'Error',
        description: 'El precio de compra es requerido',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (!loteFormData.fechaVencimiento) {
      toast({
        title: 'Error',
        description: 'La fecha de vencimiento es requerida',
        status: 'error',
        duration: 3000,
      })
      return
    }

    // Combinar fecha y hora de ingreso
    let fechaIngresoCompleta = loteFormData.fechaIngreso
    if (loteFormData.horaIngreso) {
      fechaIngresoCompleta = `${loteFormData.fechaIngreso}T${loteFormData.horaIngreso}:00`
    }

    addLoteMutation.mutate({
      productId: selectedProductForLote.id,
      data: {
        cantidad: parseFloat(loteFormData.cantidad),
        precioCompra: parseFloat(loteFormData.precioCompra),
        fechaIngreso: fechaIngresoCompleta,
        fechaVencimiento: loteFormData.fechaVencimiento,
      },
    })
  }

  const handleOpen = (product?: any) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        category: product.category,
        subCategory: product.subCategory || '',
        description: product.description || '',
        unit: product.unit,
        precioInicial: product.precioInicial?.toString() || '',
        pricePerUnit: product.pricePerUnit.toString(),
        stock: product.stock.toString(),
        minStock: product.minStock.toString(),
        isPerishable: product.isPerishable,
        refrigerationRequired: product.refrigerationRequired,
        shelfLifeDays: product.shelfLifeDays?.toString() || '',
        supplier: product.supplier || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        category: '',
        subCategory: '',
        description: '',
        unit: '',
        precioInicial: '',
        pricePerUnit: '',
        stock: '',
        minStock: '',
        isPerishable: true,
        refrigerationRequired: false,
        shelfLifeDays: '',
        supplier: '',
        sku: '',
        barcode: '',
      })
    }
    onOpen()
  }

  const handleClose = () => {
    onClose()
    setEditingProduct(null)
  }

  const requireAdminPassword = (action: { type: 'open' } | { type: 'edit'; product: any } | { type: 'delete'; id: string }) => {
    if (isAdmin || isAdminUnlocked()) {
      if (action.type === 'open') handleOpen()
      else if (action.type === 'edit') handleOpen(action.product)
      else if (action.type === 'delete') {
        if (confirm('¿Estás seguro de eliminar este producto?')) deleteMutation.mutate(action.id)
      }
    } else {
      setPendingAction(action)
      setPasswordError('')
      setAdminPasswordInput('')
      setShowPasswordModal(true)
    }
  }

  const handleSubmitPassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    if (!adminPasswordInput.trim()) {
      setPasswordError('Ingresa la contraseña')
      return
    }
    verifyPasswordMutation.mutate(adminPasswordInput)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: string) => {
    requireAdminPassword({ type: 'delete', id })
  }

  const filteredProducts = products.filter((product: any) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <Center h="80vh">
        <Spinner size="xl" />
      </Center>
    )
  }

  return (
    <Container maxW="container.xl" px={{ base: 2, md: 4 }} py={{ base: 4, md: 6 }} minW={0}>
      <VStack spacing={6} align="stretch" minW={0}>
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', sm: 'center' }}
          gap={3}
          flexWrap="wrap"
        >
          <Heading size={{ base: 'lg', md: 'xl' }} minW={0} noOfLines={1}>Gestión de Productos</Heading>
          <HStack spacing={2} flexWrap="wrap">
            <Button
              colorScheme="orange"
              variant="outline"
              size="sm"
              onClick={() => syncLotesMutation.mutate()}
              isLoading={syncLotesMutation.isPending}
            >
              Sincronizar Lotes
            </Button>
            <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={() => requireAdminPassword({ type: 'open' })} size={{ base: 'sm', md: 'md' }}>
              Nuevo Producto
            </Button>
          </HStack>
        </Flex>

        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>

        <Box overflowX="auto" overflowY="visible" bg="white" p={{ base: 3, md: 6 }} rounded="lg" shadow="md" minW={0}>
          <Table size="sm" minW="640px">
            <Thead>
              <Tr>
                <Th whiteSpace="nowrap">Nombre</Th>
                <Th whiteSpace="nowrap">Categoría</Th>
                <Th whiteSpace="nowrap">Unidad</Th>
                <Th whiteSpace="nowrap">Precio Venta</Th>
                <Th isNumeric whiteSpace="nowrap">Stock</Th>
                <Th isNumeric whiteSpace="nowrap">Stock Mín</Th>
                <Th whiteSpace="nowrap">Perecedero</Th>
                <Th whiteSpace="nowrap">Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredProducts.map((product: any) => (
                <Tr key={product.id}>
                  <Td fontWeight="bold">{product.name}</Td>
                  <Td>
                    <Badge colorScheme="blue">{getCategoryName(product.category)}</Badge>
                  </Td>
                  <Td>{product.unit}</Td>
                  <Td>
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
                  <Td isNumeric>
                    <Badge
                      colorScheme={product.stock <= product.minStock ? 'red' : 'green'}
                    >
                      {product.stock}
                    </Badge>
                  </Td>
                  <Td isNumeric>{product.minStock}</Td>
                  <Td>
                    {product.isPerishable ? (
                      <Badge colorScheme="orange">Sí</Badge>
                    ) : (
                      <Badge>No</Badge>
                    )}
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Entrada"
                        icon={<FiPackage />}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        onClick={() => handleOpenLoteModal(product)}
                        title="Agregar nuevo lote"
                      />
                      <IconButton
                        aria-label="Editar"
                        icon={<FiEdit2 />}
                        size="sm"
                        onClick={() => requireAdminPassword({ type: 'edit', product })}
                      />
                      <IconButton
                        aria-label="Eliminar"
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDelete(product.id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>

      {/* Modal contraseña para no administradores */}
      <Modal isOpen={showPasswordModal} onClose={() => { setShowPasswordModal(false); setPendingAction(null); setPasswordError(''); }}>
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader>
            <HStack>
              <FiLock />
              <Text>Contraseña de administración</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4} color="gray.600" fontSize="sm">
              Para agregar, editar o eliminar productos debes ingresar la contraseña del módulo de administración.
            </Text>
            <form onSubmit={handleSubmitPassword}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Contraseña</FormLabel>
                  <Input
                    type="password"
                    value={adminPasswordInput}
                    onChange={(e) => { setAdminPasswordInput(e.target.value); setPasswordError(''); }}
                    placeholder="Contraseña de administración"
                    borderRadius="xl"
                    autoFocus
                  />
                </FormControl>
                {passwordError && (
                  <Alert status="error" borderRadius="xl" w="full">
                    <AlertIcon />
                    <Text fontSize="sm">{passwordError}</Text>
                  </Alert>
                )}
                <HStack w="full">
                  <Button
                    type="submit"
                    colorScheme="brand"
                    flex={1}
                    borderRadius="xl"
                    isLoading={verifyPasswordMutation.isPending}
                  >
                    Confirmar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    borderRadius="xl"
                    onClick={() => { setShowPasswordModal(false); setPendingAction(null); setPasswordError(''); }}
                  >
                    Cancelar
                  </Button>
                </HStack>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isOpen} onClose={handleClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nombre</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </FormControl>

                <HStack w="full">
                  <FormControl isRequired>
                    <FormLabel>Categoría</FormLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Seleccionar</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{getCategoryName(cat)}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Subcategoría</FormLabel>
                    <Input
                      value={formData.subCategory}
                      onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    />
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>Descripción</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </FormControl>

                <HStack w="full">
                  <FormControl isRequired>
                    <FormLabel>Unidad</FormLabel>
                    <Select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="">Seleccionar</option>
                      {UNITS.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </Select>
                  </FormControl>
                </HStack>

                <HStack w="full">
                  <FormControl>
                    <FormLabel>Precio inicial (USD)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.precioInicial}
                      onChange={(e) => setFormData({ ...formData, precioInicial: e.target.value })}
                      placeholder="Precio de compra (opcional)"
                    />
                    {precioInicialNum > 0 && tasa > 0 && (
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        ≈ {formatCurrency(precioInicialNum * tasa, 'VES')} Bs
                      </Text>
                    )}
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Precio de compra inicial. Se usa para calcular la ganancia.
                    </Text>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Precio de venta final (USD)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pricePerUnit}
                      onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                      placeholder="Precio al que se venderá"
                    />
                    {precioFinalNum > 0 && tasa > 0 && (
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        ≈ {formatCurrency(precioFinalNum * tasa, 'VES')} Bs
                      </Text>
                    )}
                  </FormControl>
                </HStack>

                {(precioInicialNum > 0 || precioFinalNum > 0) && (
                  <Box p={4} bg={ganancia >= 0 ? 'green.50' : 'red.50'} borderRadius="md" border="1px solid" borderColor={ganancia >= 0 ? 'green.200' : 'red.200'}>
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <Text fontWeight="bold" fontSize="sm" color="gray.700">
                          Ganancia por unidad:
                        </Text>
                        <Text fontWeight="bold" fontSize="lg" color={ganancia >= 0 ? 'green.600' : 'red.600'}>
                          {formatCurrency(ganancia, 'USD')} USD
                        </Text>
                      </HStack>
                      {tasa > 0 && (
                        <Text fontSize="xs" color="gray.600">
                          ≈ {formatCurrency(ganancia * tasa, 'VES')} Bs
                        </Text>
                      )}
                      {ganancia < 0 && (
                        <Alert status="warning" size="sm" borderRadius="md">
                          <AlertIcon />
                          <Text fontSize="xs">
                            El precio de venta es menor que el precio inicial. Revisa los valores.
                          </Text>
                        </Alert>
                      )}
                    </VStack>
                  </Box>
                )}

                <HStack w="full">
                  <FormControl>
                    <FormLabel>Stock inicial (opcional)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="0"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Stock mínimo</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    />
                  </FormControl>
                </HStack>

                <HStack w="full">
                  <FormControl>
                    <FormLabel>Días de vida útil</FormLabel>
                    <Input
                      type="number"
                      value={formData.shelfLifeDays}
                      onChange={(e) => setFormData({ ...formData, shelfLifeDays: e.target.value })}
                      placeholder="Opcional"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Proveedor</FormLabel>
                    <Select
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      placeholder="Seleccionar proveedor"
                    >
                      <option value="">Ninguno</option>
                      {proveedores.map((proveedor: any) => (
                        <option key={proveedor.id} value={proveedor.nombre}>
                          {proveedor.nombre} {proveedor.rif ? `(${proveedor.rif})` : ''}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </HStack>

                <HStack w="full">
                  <FormControl>
                    <FormLabel>SKU</FormLabel>
                    <Input
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Código de barras</FormLabel>
                    <Input
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    />
                  </FormControl>
                </HStack>

                <HStack w="full">
                  <Checkbox
                    isChecked={formData.isPerishable}
                    onChange={(e) => setFormData({ ...formData, isPerishable: e.target.checked })}
                  >
                    Producto perecedero
                  </Checkbox>

                  <Checkbox
                    isChecked={formData.refrigerationRequired}
                    onChange={(e) => setFormData({ ...formData, refrigerationRequired: e.target.checked })}
                  >
                    Requiere refrigeración
                  </Checkbox>
                </HStack>

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingProduct ? 'Actualizar' : 'Crear'} Producto
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal para agregar nuevo lote */}
      <Modal isOpen={isLoteModalOpen} onClose={handleCloseLoteModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Agregar Nuevo Lote - {selectedProductForLote?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Al agregar un nuevo lote, el stock del producto se actualizará automáticamente.
                </Text>
              </Alert>

              <FormControl isRequired>
                <FormLabel>Cantidad</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={loteFormData.cantidad}
                  onChange={(e) => setLoteFormData({ ...loteFormData, cantidad: e.target.value })}
                  placeholder="Cantidad del lote"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Precio de Compra del Lote (por unidad en USD)</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={loteFormData.precioCompra}
                  onChange={(e) => setLoteFormData({ ...loteFormData, precioCompra: e.target.value })}
                  placeholder="Precio de compra de este lote específico"
                />
                {parseFloat(loteFormData.precioCompra) > 0 && tasaCambio?.tasa > 0 && (
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    ≈ {formatCurrency(parseFloat(loteFormData.precioCompra) * tasaCambio.tasa, 'VES')} Bs
                  </Text>
                )}
                {selectedProductForLote && (
                  <VStack align="start" spacing={2} mt={3} p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                    <Text fontSize="xs" color="blue.800" fontWeight="bold">
                      Información de referencia:
                    </Text>
                    {selectedProductForLote.precioInicial && (
                      <VStack align="start" spacing={0}>
                        <Text fontSize="xs" color="gray.700">
                          Precio inicial del producto (referencia):
                        </Text>
                        <Text fontSize="sm" fontWeight="medium" color="gray.800">
                          {formatCurrency(selectedProductForLote.precioInicial, 'USD')}
                        </Text>
                        {tasaCambio?.tasa > 0 && (
                          <Text fontSize="xs" color="gray.600">
                            ≈ {formatCurrency(selectedProductForLote.precioInicial * tasaCambio.tasa, 'VES')} Bs
                          </Text>
                        )}
                      </VStack>
                    )}
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xs" color="gray.700">
                        Precio de venta del producto:
                      </Text>
                      <Text fontSize="sm" fontWeight="bold" color="blue.600">
                        {formatCurrency(selectedProductForLote.pricePerUnit, 'USD')}
                      </Text>
                      {tasaCambio?.tasa > 0 && (
                        <Text fontSize="xs" color="gray.600">
                          ≈ {formatCurrency(selectedProductForLote.pricePerUnit * tasaCambio.tasa, 'VES')} Bs
                        </Text>
                      )}
                    </VStack>
                    {parseFloat(loteFormData.precioCompra) > 0 && selectedProductForLote.pricePerUnit && (
                      <VStack align="start" spacing={0} mt={2} pt={2} borderTop="1px solid" borderColor="blue.200">
                        <Text fontSize="xs" color="green.700" fontWeight="medium">
                          Ganancia estimada por unidad:
                        </Text>
                        <Text fontSize="sm" fontWeight="bold" color="green.600">
                          {formatCurrency(selectedProductForLote.pricePerUnit - parseFloat(loteFormData.precioCompra), 'USD')}
                        </Text>
                        {tasaCambio?.tasa > 0 && (
                          <Text fontSize="xs" color="gray.600">
                            ≈ {formatCurrency((selectedProductForLote.pricePerUnit - parseFloat(loteFormData.precioCompra)) * tasaCambio.tasa, 'VES')} Bs
                          </Text>
                        )}
                      </VStack>
                    )}
                  </VStack>
                )}
              </FormControl>

              <HStack w="full" spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Fecha de Ingreso</FormLabel>
                  <Input
                    type="date"
                    value={loteFormData.fechaIngreso}
                    onChange={(e) => setLoteFormData({ ...loteFormData, fechaIngreso: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Hora de Ingreso</FormLabel>
                  <Input
                    type="time"
                    value={loteFormData.horaIngreso}
                    onChange={(e) => setLoteFormData({ ...loteFormData, horaIngreso: e.target.value })}
                  />
                </FormControl>
              </HStack>

              <FormControl isRequired>
                <FormLabel>Fecha de Vencimiento</FormLabel>
                <Input
                  type="date"
                  value={loteFormData.fechaVencimiento}
                  onChange={(e) => setLoteFormData({ ...loteFormData, fechaVencimiento: e.target.value })}
                />
              </FormControl>

              <Button
                colorScheme="blue"
                width="full"
                onClick={handleSubmitLote}
                isLoading={addLoteMutation.isPending}
              >
                Agregar Lote
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}




