'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  VStack,
  HStack,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Button,
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
  useToast,
  Textarea,
  Text,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Badge,
  Divider,
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { FiPlus, FiLock, FiSettings } from 'react-icons/fi'

const ADMIN_UNLOCK_KEY = 'admin_module_unlocked'
const ADMIN_UNLOCK_EXPIRY_MS = 30 * 60 * 1000 // 30 minutos

function isUnlocked(): boolean {
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

function setUnlocked() {
  sessionStorage.setItem(ADMIN_UNLOCK_KEY, JSON.stringify({
    expires: Date.now() + ADMIN_UNLOCK_EXPIRY_MS,
  }))
}

export default function AdministracionPage() {
  const { isOpen: isGastoOpen, onOpen: onGastoOpen, onClose: onGastoClose } = useDisclosure()
  const { isOpen: isMermaOpen, onOpen: onMermaOpen, onClose: onMermaClose } = useDisclosure()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [gateLoading, setGateLoading] = useState(true)
  const [passwordConfigured, setPasswordConfigured] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [unlocked, setUnlockedState] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('')
  const [gateError, setGateError] = useState('')
  const [showSetPasswordForm, setShowSetPasswordForm] = useState(false)

  const [gastoData, setGastoData] = useState({
    concepto: '',
    categoria: 'servicios',
    monto: '',
    moneda: 'VES',
    descripcion: '',
  })

  const [mermaData, setMermaData] = useState({
    productId: '',
    cantidad: '',
    motivo: 'vencido',
    descripcion: '',
  })

  // Estado inicial: verificar si ya está desbloqueado (sessionStorage)
  useEffect(() => {
    setUnlockedState(isUnlocked())
  }, [])

  const { data: adminPasswordConfig } = useQuery({
    queryKey: ['settings', 'admin-password'],
    queryFn: async () => {
      const res = await fetch('/api/settings/admin-password')
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
  })

  const { data: me } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
  })

  useEffect(() => {
    if (adminPasswordConfig && me) {
      setPasswordConfigured(adminPasswordConfig.configured)
      setUserRole(me.user?.role || null)
      setGateLoading(false)
    }
  }, [adminPasswordConfig, me])

  const setPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await fetch('/api/settings/admin-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'admin-password'] })
      setPasswordConfigured(true)
      setNewAdminPassword('')
      setConfirmAdminPassword('')
      setShowSetPasswordForm(false)
      setUnlocked()
      setUnlockedState(true)
      toast({ title: 'Contraseña configurada', status: 'success', duration: 3000 })
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e.message, status: 'error', duration: 5000 })
    },
  })

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
      if (data.valid) {
        setUnlocked()
        setUnlockedState(true)
        setAdminPassword('')
        setGateError('')
        toast({ title: 'Acceso concedido', status: 'success', duration: 2000 })
      } else {
        setGateError(data.error || 'Contraseña incorrecta')
      }
    },
    onError: () => {
      setGateError('Contraseña incorrecta')
    },
  })

  const handleSetPassword = () => {
    if (newAdminPassword.length < 4) {
      toast({ title: 'La contraseña debe tener al menos 4 caracteres', status: 'error', duration: 3000 })
      return
    }
    if (newAdminPassword !== confirmAdminPassword) {
      toast({ title: 'Las contraseñas no coinciden', status: 'error', duration: 3000 })
      return
    }
    setPasswordMutation.mutate(newAdminPassword)
  }

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault()
    setGateError('')
    if (!adminPassword.trim()) {
      setGateError('Ingresa la contraseña')
      return
    }
    verifyPasswordMutation.mutate(adminPassword)
  }

  // Queries
  const { data: transacciones = [] } = useQuery({
    queryKey: ['transacciones'],
    queryFn: async () => {
      const res = await fetch('/api/transacciones?limit=50')
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
  })

  const { data: gastos = [] } = useQuery({
    queryKey: ['gastos'],
    queryFn: async () => {
      const res = await fetch('/api/gastos')
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
  })

  const { data: mermas = [] } = useQuery({
    queryKey: ['mermas'],
    queryFn: async () => {
      const res = await fetch('/api/mermas')
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

  // Mutations
  const createGastoMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
      queryClient.invalidateQueries({ queryKey: ['transacciones'] })
      toast({
        title: 'Gasto registrado',
        status: 'success',
        duration: 3000,
      })
      onGastoClose()
      setGastoData({
        concepto: '',
        categoria: 'servicios',
        monto: '',
        moneda: 'VES',
        descripcion: '',
      })
    },
  })

  const createMermaMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/mermas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mermas'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: 'Merma registrada',
        status: 'success',
        duration: 3000,
      })
      onMermaClose()
      setMermaData({
        productId: '',
        cantidad: '',
        motivo: 'vencido',
        descripcion: '',
      })
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

  const tasa = tasaCambio?.tasa || 0

  // Saldo en caja: si la última transacción es en USD, el saldo guardado ya está en USD; si es VES, convertir con tasa
  const primeraTx = transacciones[0]
  const saldoActualBs = transacciones[0]?.saldo || 0
  const saldoEnUsd =
    primeraTx?.moneda === 'USD'
      ? saldoActualBs
      : tasa > 0
        ? saldoActualBs / tasa
        : saldoActualBs
  const saldoActualUsd = saldoEnUsd
  const saldoEsVes = primeraTx?.moneda !== 'USD'

  // Calcular totales: gastos pueden ser VES o USD; mermas en USD
  const totalGastosUsd = gastos.reduce((sum: number, gasto: any) => {
    const montoUsd = gasto.moneda === 'USD' ? gasto.monto : (tasa > 0 ? gasto.monto / tasa : 0)
    return sum + montoUsd
  }, 0)
  const totalGastosRaw = gastos.reduce((sum: number, g: any) => sum + g.monto, 0)
  const totalMermasUsd = mermas.reduce((sum: number, merma: any) => sum + merma.costoTotal, 0)

  // Puerta: cargando
  if (gateLoading) {
    return (
      <Center minH="50vh" bgGradient="linear(to-b, brand.50 0%, gray.50 100%)">
        <Spinner size="xl" color="brand.500" thickness="3px" />
      </Center>
    )
  }

  // Puerta: no desbloqueado
  if (!unlocked) {
    return (
      <Container maxW="md" py={20}>
        <Box
          bg="white"
          p={8}
          borderRadius="2xl"
          boxShadow="0 25px 50px -12px rgb(0 0 0 / 0.15)"
          borderWidth="1px"
          borderColor="blackAlpha.100"
        >
          <VStack spacing={6} align="stretch">
            <HStack justify="center" color="brand.500">
              <FiLock size={32} />
            </HStack>
            <Heading size="lg" textAlign="center">Módulo de Administración</Heading>

            {!passwordConfigured && userRole !== 'admin' && (
              <VStack spacing={3} align="stretch">
                <Alert status="info" borderRadius="xl">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="semibold">La contraseña aún no está configurada</Text>
                    <Text fontSize="sm" mt={1}>
                      Solo un usuario con rol <strong>administrador</strong> puede configurarla, y lo hace en esta misma página.
                    </Text>
                  </Box>
                </Alert>
                <Text fontSize="sm" color="gray.600">
                  <strong>Dónde configurarla:</strong> Cierra sesión, inicia sesión con el usuario administrador y entra de nuevo a <strong>Administración</strong>. Verás el botón &quot;Configurar contraseña de administración&quot; para crear la contraseña. Después, cualquier usuario que la conozca podrá ingresar a este módulo.
                </Text>
              </VStack>
            )}

            {!passwordConfigured && userRole === 'admin' && (
              <>
                <Text textAlign="center" color="gray.600">
                  Crea la contraseña que se pedirá para ingresar a este módulo. Solo tú (administrador) puedes configurarla o cambiarla.
                </Text>
                {!showSetPasswordForm ? (
                  <Button
                    colorScheme="brand"
                    size="lg"
                    width="full"
                    leftIcon={<FiSettings />}
                    onClick={() => setShowSetPasswordForm(true)}
                  >
                    Configurar contraseña de administración
                  </Button>
                ) : (
                  <VStack as="form" spacing={4} w="full" onSubmit={(e) => { e.preventDefault(); handleSetPassword(); }}>
                    <FormControl isRequired>
                      <FormLabel>Nueva contraseña</FormLabel>
                      <Input
                        type="password"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        size="lg"
                        borderRadius="xl"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Confirmar contraseña</FormLabel>
                      <Input
                        type="password"
                        value={confirmAdminPassword}
                        onChange={(e) => setConfirmAdminPassword(e.target.value)}
                        placeholder="Repite la contraseña"
                        size="lg"
                        borderRadius="xl"
                      />
                    </FormControl>
                    <HStack w="full">
                      <Button flex={1} colorScheme="brand" onClick={() => handleSetPassword()} isLoading={setPasswordMutation.isPending}>
                        Guardar
                      </Button>
                      <Button variant="ghost" onClick={() => { setShowSetPasswordForm(false); setNewAdminPassword(''); setConfirmAdminPassword(''); }}>
                        Cancelar
                      </Button>
                    </HStack>
                  </VStack>
                )}
              </>
            )}

            {passwordConfigured && (
              <>
                <Text textAlign="center" color="gray.600">
                  Ingresa la contraseña del módulo de administración para continuar.
                </Text>
                <form onSubmit={handleVerifyPassword} style={{ width: '100%' }}>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Contraseña</FormLabel>
                      <Input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => { setAdminPassword(e.target.value); setGateError(''); }}
                        placeholder="Contraseña de administración"
                        size="lg"
                        borderRadius="xl"
                        autoFocus
                      />
                    </FormControl>
                    {gateError && (
                      <Alert status="error" borderRadius="xl" w="full">
                        <AlertIcon />
                        <Text fontSize="sm">{gateError}</Text>
                      </Alert>
                    )}
                    <Button
                      type="submit"
                      colorScheme="brand"
                      width="full"
                      size="lg"
                      isLoading={verifyPasswordMutation.isPending}
                    >
                      Ingresar
                    </Button>
                  </VStack>
                </form>
              </>
            )}
          </VStack>
        </Box>
      </Container>
    )
  }

  // Contenido del módulo (desbloqueado)
  return (
    <Container maxW="container.xl" px={{ base: 2, md: 4 }} minW={0}>
      <VStack spacing={6} align="stretch" minW={0} bgGradient="linear(to-b, brand.50 0%, transparent 120px)" borderRadius="2xl" py={1}>
        <Flex align="center" gap={3}>
          <Box w="4px" h={{ base: 8, md: 10 }} bgGradient="linear(to-b, brand.500, pollo.amarilloOscuro)" borderRadius="full" flexShrink={0} />
          <Heading size={{ base: 'lg', md: 'xl' }} fontWeight="800" color="brand.600" minW={0} noOfLines={1}>Módulo de Administración</Heading>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Stat
            px={5}
            py={6}
            borderRadius="2xl"
            boxShadow="0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
            border="1px solid"
            borderColor="gray.200"
            bg="white"
          >
            <StatLabel fontWeight="bold" color="gray.800">Saldo en Caja</StatLabel>
            <StatNumber color={saldoActualUsd >= 0 ? 'green.600' : 'red.600'} fontWeight="700" fontSize="2xl" mt={1}>
              {tasa > 0 || !saldoEsVes ? formatCurrency(saldoActualUsd, 'USD') : formatCurrency(saldoActualBs, 'VES')}
            </StatNumber>
          </Stat>

          <Stat
            px={5}
            py={6}
            borderRadius="2xl"
            boxShadow="0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
            border="1px solid"
            borderColor="red.200"
            bg="white"
          >
            <StatLabel fontWeight="bold" color="gray.800">Total Gastos</StatLabel>
            <StatNumber color="red.600" fontWeight="700" fontSize="2xl" mt={1}>
              {tasa > 0 ? formatCurrency(totalGastosUsd, 'USD') : formatCurrency(totalGastosRaw, 'VES')}
            </StatNumber>
          </Stat>

          <Stat
            px={5}
            py={6}
            borderRadius="2xl"
            boxShadow="0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
            border="1px solid"
            borderColor="orange.200"
            bg="white"
          >
            <StatLabel fontWeight="bold" color="gray.800">Total Mermas</StatLabel>
            <StatNumber color="orange.600" fontWeight="700" fontSize="2xl" mt={1}>{formatCurrency(totalMermasUsd, 'USD')}</StatNumber>
          </Stat>
        </SimpleGrid>

        <Tabs isLazy variant="enclosed" minW={0}>
          <Box overflowX="auto" minW={0}>
            <TabList flexWrap="nowrap" minW="max-content">
              <Tab whiteSpace="nowrap">Transacciones</Tab>
              <Tab whiteSpace="nowrap">Gastos</Tab>
              <Tab whiteSpace="nowrap">Mermas</Tab>
              {userRole === 'admin' && <Tab whiteSpace="nowrap"><HStack><FiSettings /><Text>Configuración</Text></HStack></Tab>}
            </TabList>
          </Box>

          <TabPanels minW={0}>
            <TabPanel px={0} minW={0}>
              {/* Vista Desktop - Tabla */}
              <Box 
                display={{ base: 'none', md: 'block' }}
                minW={0}
                bg="white"
                borderRadius="2xl"
                boxShadow="0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
                border="1px solid"
                borderColor="gray.200"
                overflow="hidden"
              >
                <Table size="md" variant="simple">
                  <Thead>
                    <Tr bg="brand.50" borderBottom="2px solid" borderBottomColor="brand.200">
                      <Th whiteSpace="nowrap" fontWeight="bold" color="brand.700" py={4} px={4} fontSize="sm" textTransform="uppercase" letterSpacing="wide">Fecha</Th>
                      <Th whiteSpace="nowrap" fontWeight="bold" color="brand.700" py={4} px={4} fontSize="sm" textTransform="uppercase" letterSpacing="wide">Tipo</Th>
                      <Th whiteSpace="nowrap" fontWeight="bold" color="brand.700" py={4} px={4} fontSize="sm" textTransform="uppercase" letterSpacing="wide">Concepto</Th>
                      <Th isNumeric whiteSpace="nowrap" fontWeight="bold" color="brand.700" py={4} px={4} fontSize="sm" textTransform="uppercase" letterSpacing="wide">Entrada</Th>
                      <Th isNumeric whiteSpace="nowrap" fontWeight="bold" color="brand.700" py={4} px={4} fontSize="sm" textTransform="uppercase" letterSpacing="wide">Salida</Th>
                      <Th isNumeric whiteSpace="nowrap" fontWeight="bold" color="brand.700" py={4} px={4} fontSize="sm" textTransform="uppercase" letterSpacing="wide">Saldo</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {transacciones.map((tx: any, index: number) => (
                      <Tr 
                        key={tx.id}
                        borderBottom="1px solid"
                        borderBottomColor="gray.100"
                        _hover={{ bg: 'gray.50', transform: 'scale(1.001)' }}
                        transition="all 0.2s"
                        bg={index % 2 === 0 ? 'white' : 'gray.25'}
                      >
                        <Td fontSize="sm" fontWeight="500" py={3} px={4} color="gray.700">{formatDateShort(tx.fecha)}</Td>
                        <Td py={3} px={4}>
                          <Badge colorScheme={tx.tipo === 'venta' ? 'green' : tx.tipo === 'gasto' ? 'red' : 'gray'} size="sm" fontWeight="600">
                            {tx.tipo}
                          </Badge>
                        </Td>
                        <Td py={3} px={4} fontWeight="500" color="gray.800" maxW="300px" isTruncated>{tx.concepto}</Td>
                        <Td isNumeric py={3} px={4} fontWeight="bold" fontSize="sm" color="green.600">
                          {tx.entrada > 0 ? (
                            tx.moneda === 'USD' ? (
                              <VStack align="end" spacing={0}>
                                <Text>{formatCurrency(tx.entrada, 'USD')}</Text>
                                {tasa > 0 && (
                                  <Text fontSize="xs" color="gray.600">≈ {formatCurrency(tx.entrada * tasa, 'VES')}</Text>
                                )}
                              </VStack>
                            ) : (
                              formatCurrency(tx.entrada, 'VES')
                            )
                          ) : (
                            <Text as="span" color="gray.400">-</Text>
                          )}
                        </Td>
                        <Td isNumeric py={3} px={4} fontWeight="bold" fontSize="sm" color="red.600">
                          {tx.salida > 0 ? (
                            tx.moneda === 'USD' ? (
                              <VStack align="end" spacing={0}>
                                <Text>{formatCurrency(tx.salida, 'USD')}</Text>
                                {tasa > 0 && (
                                  <Text fontSize="xs" color="gray.600">≈ {formatCurrency(tx.salida * tasa, 'VES')}</Text>
                                )}
                              </VStack>
                            ) : (
                              formatCurrency(tx.salida, 'VES')
                            )
                          ) : (
                            <Text as="span" color="gray.400">-</Text>
                          )}
                        </Td>
                        <Td isNumeric py={3} px={4} fontWeight="700" fontSize="md" color="gray.900">
                          {tx.moneda === 'USD'
                            ? formatCurrency(tx.saldo, 'USD')
                            : tasa > 0
                              ? formatCurrency(tx.saldo / tasa, 'USD')
                              : formatCurrency(tx.saldo, 'VES')}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              {/* Vista Mobile - Tarjetas */}
              <VStack display={{ base: 'flex', md: 'none' }} spacing={3} align="stretch">
                {transacciones.map((tx: any) => (
                  <Box
                    key={tx.id}
                    bg="white"
                    p={4}
                    borderRadius="2xl"
                    boxShadow="0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <VStack align="stretch" spacing={2}>
                      <Flex justify="space-between" align="center">
                        <Text fontSize="xs" color="gray.500">{formatDateShort(tx.fecha)}</Text>
                        <Badge colorScheme={tx.tipo === 'venta' ? 'green' : tx.tipo === 'gasto' ? 'red' : 'gray'} size="sm" fontWeight="600">
                          {tx.tipo}
                        </Badge>
                      </Flex>
                      <Text fontWeight="500" color="gray.800" fontSize="sm">{tx.concepto}</Text>
                      <Divider />
                      <SimpleGrid columns={2} spacing={2}>
                        {tx.entrada > 0 && (
                          <Box>
                            <Text fontSize="xs" color="gray.600">Entrada:</Text>
                            {tx.moneda === 'USD' ? (
                              <>
                                <Text fontWeight="bold" fontSize="sm" color="green.600">{formatCurrency(tx.entrada, 'USD')}</Text>
                                {tasa > 0 && (
                                  <Text fontSize="xs" color="gray.500">≈ {formatCurrency(tx.entrada * tasa, 'VES')}</Text>
                                )}
                              </>
                            ) : (
                              <Text fontWeight="bold" fontSize="sm" color="green.600">{formatCurrency(tx.entrada, 'VES')}</Text>
                            )}
                          </Box>
                        )}
                        {tx.salida > 0 && (
                          <Box>
                            <Text fontSize="xs" color="gray.600">Salida:</Text>
                            {tx.moneda === 'USD' ? (
                              <>
                                <Text fontWeight="bold" fontSize="sm" color="red.600">{formatCurrency(tx.salida, 'USD')}</Text>
                                {tasa > 0 && (
                                  <Text fontSize="xs" color="gray.500">≈ {formatCurrency(tx.salida * tasa, 'VES')}</Text>
                                )}
                              </>
                            ) : (
                              <Text fontWeight="bold" fontSize="sm" color="red.600">{formatCurrency(tx.salida, 'VES')}</Text>
                            )}
                          </Box>
                        )}
                      </SimpleGrid>
                      <Divider />
                      <Flex justify="space-between" align="center">
                        <Text fontSize="sm" color="gray.600" fontWeight="bold">Saldo:</Text>
                        <Text fontWeight="700" fontSize="md" color="gray.900">
                          {tx.moneda === 'USD'
                            ? formatCurrency(tx.saldo, 'USD')
                            : tasa > 0
                              ? formatCurrency(tx.saldo / tasa, 'USD')
                              : formatCurrency(tx.saldo, 'VES')}
                        </Text>
                      </Flex>
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </TabPanel>

            <TabPanel px={0} minW={0}>
              <VStack spacing={4} align="stretch" minW={0}>
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="brand"
                  onClick={onGastoOpen}
                  alignSelf="flex-end"
                  fontWeight="600"
                >
                  Registrar Gasto
                </Button>

                {/* Vista Desktop - Tabla Gastos */}
                <Box 
                  display={{ base: 'none', md: 'block' }}
                  minW={0}
                  bg="white"
                  borderRadius="2xl"
                  boxShadow="0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
                  border="1px solid"
                  borderColor="gray.200"
                  overflow="hidden"
                >
                  <Table size="md" variant="simple">
                    <Thead>
                      <Tr bg="red.50" borderBottom="2px solid" borderBottomColor="red.200">
                        <Th whiteSpace="nowrap" fontWeight="bold" color="red.700" py={4} px={4} fontSize="sm" textTransform="uppercase" letterSpacing="wide">Fecha</Th>
                        <Th whiteSpace="nowrap" fontWeight="bold" color="red.700" py={4} px={4} fontSize="sm" textTransform="uppercase" letterSpacing="wide">Concepto</Th>
                        <Th whiteSpace="nowrap" fontWeight="bold" color="red.700" py={4} px={4} fontSize="sm" textTransform="uppercase" letterSpacing="wide">Categoría</Th>
                        <Th isNumeric whiteSpace="nowrap" fontWeight="bold" color="red.700" py={4} px={4} fontSize="sm" textTransform="uppercase" letterSpacing="wide">Monto</Th>
                      </Tr>
                    </Thead>
                  <Tbody>
                    {gastos.map((gasto: any, index: number) => (
                      <Tr 
                        key={gasto.id}
                        borderBottom="1px solid"
                        borderBottomColor="gray.100"
                        _hover={{ bg: 'red.50', transform: 'scale(1.001)' }}
                        transition="all 0.2s"
                        bg={index % 2 === 0 ? 'white' : 'red.25'}
                      >
                        <Td fontSize="sm" fontWeight="500" py={3} px={4} color="gray.700">{formatDateShort(gasto.fecha)}</Td>
                        <Td py={3} px={4} fontWeight="500" color="gray.800">{gasto.concepto}</Td>
                        <Td py={3} px={4}>
                          <Badge colorScheme="red" size="sm" fontWeight="600">{gasto.categoria}</Badge>
                        </Td>
                        <Td isNumeric py={3} px={4} color="red.600" fontWeight="700" fontSize="sm">
                          {formatCurrency(gasto.monto)}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                </Box>

                {/* Vista Mobile - Tarjetas Gastos */}
                <VStack display={{ base: 'flex', md: 'none' }} spacing={3} align="stretch">
                  {gastos.map((gasto: any) => (
                    <Box
                      key={gasto.id}
                      bg="white"
                      p={4}
                      borderRadius="2xl"
                      boxShadow="0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
                      border="1px solid"
                      borderColor="gray.200"
                    >
                      <VStack align="stretch" spacing={2}>
                        <Flex justify="space-between" align="center">
                          <Text fontSize="xs" color="gray.500">{formatDateShort(gasto.fecha)}</Text>
                          <Badge colorScheme="red" size="sm" fontWeight="600">{gasto.categoria}</Badge>
                        </Flex>
                        <Text fontWeight="500" color="gray.800">{gasto.concepto}</Text>
                        <Divider />
                        <Flex justify="space-between" align="center">
                          <Text fontSize="sm" color="gray.600" fontWeight="bold">Monto:</Text>
                          <Text color="red.600" fontWeight="700" fontSize="md">{formatCurrency(gasto.monto)}</Text>
                        </Flex>
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              </VStack>
            </TabPanel>

            <TabPanel px={0} minW={0}>
              <VStack spacing={4} align="stretch" minW={0}>
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="brand"
                  onClick={onMermaOpen}
                  alignSelf="flex-end"
                  fontWeight="600"
                >
                  Registrar Merma
                </Button>

                {/* Vista Desktop - Tabla Mermas */}
                <Box 
                  display={{ base: 'none', md: 'block' }}
                  minW={0}
                  bg="white"
                  borderRadius="2xl"
                  boxShadow="0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
                  border="1px solid"
                  borderColor="gray.200"
                  overflow="hidden"
                >
                  <Table size="md" variant="simple">
                    <Thead>
                      <Tr bg="orange.50" borderBottom="2px solid" borderBottomColor="orange.200">
                        <Th whiteSpace="nowrap" fontWeight="bold" color="orange.700" py={4} px={4} fontSize="sm" textTransform="uppercase" letterSpacing="wide">Fecha</Th>
                        <Th whiteSpace="nowrap" fontWeight="bold" color="orange.700" py={4} px={4} fontSize="sm" textTransform="uppercase" letterSpacing="wide">Producto</Th>
                        <Th whiteSpace="nowrap" fontWeight="bold" color="orange.700" py={4} px={4} fontSize="sm" textTransform="uppercase" letterSpacing="wide">Cantidad</Th>
                        <Th whiteSpace="nowrap" fontWeight="bold" color="orange.700" py={4} px={4} fontSize="sm" textTransform="uppercase" letterSpacing="wide">Motivo</Th>
                        <Th isNumeric whiteSpace="nowrap" fontWeight="bold" color="orange.700" py={4} px={4} fontSize="sm" textTransform="uppercase" letterSpacing="wide">Costo</Th>
                      </Tr>
                    </Thead>
                  <Tbody>
                    {mermas.map((merma: any, index: number) => (
                      <Tr 
                        key={merma.id}
                        borderBottom="1px solid"
                        borderBottomColor="gray.100"
                        _hover={{ bg: 'orange.50', transform: 'scale(1.001)' }}
                        transition="all 0.2s"
                        bg={index % 2 === 0 ? 'white' : 'orange.25'}
                      >
                        <Td fontSize="sm" fontWeight="500" py={3} px={4} color="gray.700">{formatDateShort(merma.fecha)}</Td>
                        <Td py={3} px={4} fontWeight="500" color="gray.800">{merma.productName}</Td>
                        <Td py={3} px={4} fontWeight="600" color="gray.700">{merma.cantidad}</Td>
                        <Td py={3} px={4} color="gray.700">{merma.motivo}</Td>
                        <Td isNumeric py={3} px={4} color="orange.600" fontWeight="700" fontSize="sm">
                          {formatCurrency(merma.costoTotal)}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                </Box>

                {/* Vista Mobile - Tarjetas Mermas */}
                <VStack display={{ base: 'flex', md: 'none' }} spacing={3} align="stretch">
                  {mermas.map((merma: any) => (
                    <Box
                      key={merma.id}
                      bg="white"
                      p={4}
                      borderRadius="2xl"
                      boxShadow="0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
                      border="1px solid"
                      borderColor="gray.200"
                    >
                      <VStack align="stretch" spacing={2}>
                        <Flex justify="space-between" align="center">
                          <Text fontSize="xs" color="gray.500">{formatDateShort(merma.fecha)}</Text>
                          <Badge colorScheme="orange" size="sm">{merma.motivo}</Badge>
                        </Flex>
                        <Text fontWeight="bold" color="gray.800">{merma.productName}</Text>
                        <Divider />
                        <Flex justify="space-between">
                          <Text color="gray.600" fontSize="sm">Cantidad:</Text>
                          <Text fontWeight="600">{merma.cantidad}</Text>
                        </Flex>
                        <Flex justify="space-between" align="center">
                          <Text fontSize="sm" color="gray.600" fontWeight="bold">Costo:</Text>
                          <Text color="orange.600" fontWeight="700" fontSize="md">{formatCurrency(merma.costoTotal)}</Text>
                        </Flex>
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              </VStack>
            </TabPanel>

            {userRole === 'admin' && (
              <TabPanel>
                <Box maxW="md" p={6} bg="gray.50" borderRadius="2xl" borderWidth="1px" borderColor="blackAlpha.100">
                  <Heading size="md" mb={4}>Contraseña del módulo de administración</Heading>
                  <Text mb={4} color="gray.600" fontSize="sm">
                    Esta contraseña se solicita al ingresar a este módulo. Cualquier usuario que la conozca podrá acceder a gastos, mermas y transacciones.
                  </Text>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Nueva contraseña</FormLabel>
                      <Input
                        type="password"
                        placeholder="Mínimo 4 caracteres"
                        size="lg"
                        borderRadius="xl"
                        id="config-new-password"
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        value={newAdminPassword}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Confirmar contraseña</FormLabel>
                      <Input
                        type="password"
                        placeholder="Repite la contraseña"
                        size="lg"
                        borderRadius="xl"
                        id="config-confirm-password"
                        onChange={(e) => setConfirmAdminPassword(e.target.value)}
                        value={confirmAdminPassword}
                      />
                    </FormControl>
                    <Button
                      colorScheme="brand"
                      size="lg"
                      borderRadius="xl"
                      onClick={() => {
                        if (newAdminPassword.length < 4) {
                          toast({ title: 'La contraseña debe tener al menos 4 caracteres', status: 'error' })
                          return
                        }
                        if (newAdminPassword !== confirmAdminPassword) {
                          toast({ title: 'Las contraseñas no coinciden', status: 'error' })
                          return
                        }
                        setPasswordMutation.mutate(newAdminPassword)
                        setNewAdminPassword('')
                        setConfirmAdminPassword('')
                      }}
                      isLoading={setPasswordMutation.isPending}
                    >
                      Cambiar contraseña
                    </Button>
                  </VStack>
                </Box>
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Modal Gasto */}
      <Modal isOpen={isGastoOpen} onClose={onGastoClose}>
        <ModalOverlay />
        <ModalContent borderRadius="2xl" borderTop="4px solid" borderTopColor="red.500">
          <ModalHeader fontWeight="700" color="red.700">Registrar Gasto</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Concepto</FormLabel>
                <Input
                  value={gastoData.concepto}
                  onChange={(e) => setGastoData({ ...gastoData, concepto: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Categoría</FormLabel>
                <Select
                  value={gastoData.categoria}
                  onChange={(e) => setGastoData({ ...gastoData, categoria: e.target.value })}
                >
                  <option value="servicios">Servicios</option>
                  <option value="nomina">Nómina</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="transporte">Transporte</option>
                  <option value="otros">Otros</option>
                </Select>
              </FormControl>

              <HStack w="full">
                <FormControl isRequired>
                  <FormLabel>Monto</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={gastoData.monto}
                    onChange={(e) => setGastoData({ ...gastoData, monto: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Moneda</FormLabel>
                  <Select
                    value={gastoData.moneda}
                    onChange={(e) => setGastoData({ ...gastoData, moneda: e.target.value })}
                  >
                    <option value="VES">Bolívares</option>
                    <option value="USD">Dólares</option>
                  </Select>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Descripción</FormLabel>
                <Textarea
                  value={gastoData.descripcion}
                  onChange={(e) => setGastoData({ ...gastoData, descripcion: e.target.value })}
                />
              </FormControl>

              <Button
                colorScheme="brand"
                width="full"
                onClick={() => createGastoMutation.mutate(gastoData)}
                isLoading={createGastoMutation.isPending}
              >
                Registrar Gasto
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal Merma */}
      <Modal isOpen={isMermaOpen} onClose={onMermaClose}>
        <ModalOverlay />
        <ModalContent borderRadius="2xl" borderTop="4px solid" borderTopColor="orange.500">
          <ModalHeader fontWeight="700" color="orange.700">Registrar Merma</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Producto</FormLabel>
                <Select
                  value={mermaData.productId}
                  onChange={(e) => setMermaData({ ...mermaData, productId: e.target.value })}
                  placeholder="Seleccionar producto"
                >
                  {products.map((product: any) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Cantidad</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={mermaData.cantidad}
                  onChange={(e) => setMermaData({ ...mermaData, cantidad: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Motivo</FormLabel>
                <Select
                  value={mermaData.motivo}
                  onChange={(e) => setMermaData({ ...mermaData, motivo: e.target.value })}
                >
                  <option value="vencido">Vencido</option>
                  <option value="deteriorado">Deteriorado</option>
                  <option value="roto">Roto</option>
                  <option value="otro">Otro</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Descripción</FormLabel>
                <Textarea
                  value={mermaData.descripcion}
                  onChange={(e) => setMermaData({ ...mermaData, descripcion: e.target.value })}
                />
              </FormControl>

              <Button
                colorScheme="brand"
                width="full"
                onClick={() => createMermaMutation.mutate(mermaData)}
                isLoading={createMermaMutation.isPending}
              >
                Registrar Merma
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}




