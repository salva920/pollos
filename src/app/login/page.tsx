'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  VStack,
  useToast,
  Text,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  UnorderedList,
  ListItem,
  Link,
} from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import ChickenLogo from '../components/ChickenLogo'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null)
  const [showInitForm, setShowInitForm] = useState(false)
  const [initName, setInitName] = useState('')
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [regName, setRegName] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const toast = useToast()
  const router = useRouter()

  useEffect(() => {
    checkInitialization()
  }, [])

  const checkInitialization = async () => {
    try {
      const res = await fetch('/api/auth/init')
      const data = await res.json()
      
      if (res.status === 503 && data.connectionError) {
        setConnectionError(data.details || 'Error de conexión a la base de datos')
        setIsInitialized(null)
      } else {
        setConnectionError(null)
        setIsInitialized(data.initialized)
      }
    } catch (error) {
      console.error('Error al verificar inicialización:', error)
      setConnectionError('No se pudo conectar con el servidor. Verifica tu conexión a internet.')
      setIsInitialized(null)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: 'Bienvenido',
          description: `Hola ${data.user.name}`,
          status: 'success',
          duration: 3000,
        })
        const redirect = typeof window !== 'undefined' ? sessionStorage.getItem('loginRedirect') : null
        if (redirect) {
          sessionStorage.removeItem('loginRedirect')
          router.push(redirect)
        } else {
          router.push('/')
        }
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Credenciales inválidas',
          status: 'error',
          duration: 5000,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo conectar con el servidor',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName.trim() || !regUsername.trim() || !regPassword) {
      toast({ title: 'Completa todos los campos', status: 'error', duration: 3000 })
      return
    }
    if (regUsername.trim().length < 3) {
      toast({ title: 'El usuario debe tener al menos 3 caracteres', status: 'error', duration: 3000 })
      return
    }
    if (regPassword.length < 6) {
      toast({ title: 'La contraseña debe tener al menos 6 caracteres', status: 'error', duration: 3000 })
      return
    }
    setRegisterLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          username: regUsername.trim(),
          password: regPassword,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: 'Cuenta creada',
          description: 'Ya puedes iniciar sesión con tu usuario y contraseña.',
          status: 'success',
          duration: 5000,
        })
        setShowRegisterForm(false)
        setUsername(regUsername.trim())
        setRegName('')
        setRegUsername('')
        setRegPassword('')
      } else {
        toast({
          title: 'Error',
          description: data.error || 'No se pudo crear la cuenta',
          status: 'error',
          duration: 5000,
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo conectar con el servidor',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setRegisterLoading(false)
    }
  }

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones básicas
    if (!initName.trim()) {
      toast({
        title: 'Campo requerido',
        description: 'El nombre completo es obligatorio',
        status: 'error',
        duration: 3000,
      })
      return
    }
    
    if (!username.trim()) {
      toast({
        title: 'Campo requerido',
        description: 'El usuario es obligatorio',
        status: 'error',
        duration: 3000,
      })
      return
    }
    
    if (username.length < 3) {
      toast({
        title: 'Usuario inválido',
        description: 'El usuario debe tener al menos 3 caracteres',
        status: 'error',
        duration: 3000,
      })
      return
    }
    
    if (!password || password.length < 6) {
      toast({
        title: 'Contraseña inválida',
        description: 'La contraseña debe tener al menos 6 caracteres',
        status: 'error',
        duration: 3000,
      })
      return
    }
    
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          name: initName.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: '¡Usuario creado exitosamente!',
          description: `Bienvenido ${data.user.name}. Ahora puedes iniciar sesión.`,
          status: 'success',
          duration: 5000,
        })
        setIsInitialized(true)
        setShowInitForm(false)
        setConnectionError(null)
        // Limpiar los campos del formulario de inicialización
        setInitName('')
        setUsername('')
        setPassword('')
      } else {
        if (res.status === 503 && data.connectionError) {
          setConnectionError(data.details || 'Error de conexión a la base de datos')
        }
        toast({
          title: 'Error',
          description: data.error || data.details || 'No se pudo crear el usuario',
          status: 'error',
          duration: 5000,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo conectar con el servidor',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isInitialized === null && !connectionError) {
    return (
      <Box minH="100vh" bgGradient="linear(135deg, brand.50 0%, gray.50 40%, pollo.amarillo 99%)" display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={6}>
        <ChickenLogo boxSize={16} />
        <Spinner size="xl" color="brand.500" thickness="3px" />
        <Text color="gray.600" fontWeight="500">Cargando...</Text>
      </Box>
    )
  }

  // Mostrar error de conexión
  if (connectionError) {
    return (
      <Box minH="100vh" bgGradient="linear(135deg, brand.50 0%, gray.50 40%, pollo.amarillo 99%)" py={20} px={4}>
        <Container maxW="2xl" centerContent>
        <Box
          bg="white"
          p={8}
          borderRadius="2xl"
          boxShadow="0 25px 50px -12px rgb(0 0 0 / 0.2), 0 0 0 1px rgb(0 0 0 / 0.05)"
          w="full"
          borderTop="4px solid"
          borderTopColor="red.500"
        >
          <Flex direction="column" align="center" mb={6}>
            <ChickenLogo boxSize={14} />
            <Heading size="md" mt={3} color="gray.800" fontWeight="700">Sistema Alimentos</Heading>
          </Flex>
          <Alert status="error" borderRadius="md" mb={6}>
            <AlertIcon />
            <Box>
              <AlertTitle>Error de Conexión a la Base de Datos</AlertTitle>
              <AlertDescription mt={2}>
                No se puede conectar a MongoDB. Por favor, verifica la configuración.
              </AlertDescription>
            </Box>
          </Alert>

          <Box mb={6}>
            <Heading size="md" mb={4}>Pasos para resolver:</Heading>
            <UnorderedList spacing={2}>
              <ListItem>
                <Text fontWeight="bold">Si usas MongoDB Atlas:</Text>
                <UnorderedList ml={6} mt={2} spacing={1}>
                  <ListItem>Verifica que el cluster esté activo en{' '}
                    <Link href="https://cloud.mongodb.com" color="blue.500" isExternal>
                      MongoDB Atlas
                    </Link>
                  </ListItem>
                  <ListItem>Obtén una nueva cadena de conexión desde &quot;Connect&quot; → &quot;Connect your application&quot;</ListItem>
                  <ListItem>Actualiza la variable <code>DATABASE_URL</code> en el archivo <code>.env</code></ListItem>
                  <ListItem>Verifica que tu IP esté en la whitelist de MongoDB Atlas</ListItem>
                </UnorderedList>
              </ListItem>
              <ListItem mt={4}>
                <Text fontWeight="bold">Si usas MongoDB Local:</Text>
                <UnorderedList ml={6} mt={2} spacing={1}>
                  <ListItem>Verifica que MongoDB esté corriendo en tu sistema</ListItem>
                  <ListItem>Cambia la <code>DATABASE_URL</code> en <code>.env</code> a: <code>mongodb://localhost:27017/alimentos_db</code></ListItem>
                </UnorderedList>
              </ListItem>
            </UnorderedList>
          </Box>

          <Box bg="gray.50" p={4} borderRadius="md" mb={6}>
            <Text fontSize="sm" fontWeight="bold" mb={2}>Detalles del error:</Text>
            <Text fontSize="xs" fontFamily="mono" whiteSpace="pre-wrap">
              {connectionError}
            </Text>
          </Box>

          <Button
            colorScheme="brand"
            width="full"
            size="lg"
            borderRadius="xl"
            onClick={() => {
              setConnectionError(null)
              checkInitialization()
            }}
          >
            Reintentar Conexión
          </Button>
        </Box>
        </Container>
      </Box>
    )
  }

  if (!isInitialized && !showInitForm) {
    return (
      <Box minH="100vh" bgGradient="linear(135deg, brand.50 0%, gray.50 40%, pollo.amarillo 99%)" display="flex" alignItems="center" justifyContent="center" py={12} px={4}>
      <Container maxW="md" centerContent>
        <Box
          bg="white"
          p={10}
          borderRadius="2xl"
          boxShadow="0 25px 50px -12px rgb(0 0 0 / 0.2), 0 0 0 1px rgb(0 0 0 / 0.05)"
          w="full"
          borderTop="4px solid"
          borderTopColor="brand.500"
        >
          <Flex direction="column" align="center" mb={6}>
            <ChickenLogo boxSize={16} />
            <Heading size="xl" mt={4} textAlign="center" fontWeight="800">
              <Text as="span" color="brand.600">Bienvenido </Text>
              <Text as="span" color="pollo.amarilloOscuro">al Sistema</Text>
            </Heading>
          </Flex>
          <Text mb={2} textAlign="center" color="gray.600" fontSize="md">
            Es la primera vez que usas este sistema.
          </Text>
          <Text mb={6} textAlign="center" color="gray.500" fontSize="sm">
            Crea el primer usuario administrador para comenzar.
          </Text>
          <Button
            colorScheme="brand"
            width="full"
            size="lg"
            borderRadius="xl"
            fontWeight="600"
            onClick={() => setShowInitForm(true)}
          >
            Crear Usuario Administrador
          </Button>
        </Box>
      </Container>
      </Box>
    )
  }

  if (!isInitialized && showInitForm) {
    return (
      <Box minH="100vh" bgGradient="linear(135deg, brand.50 0%, gray.50 40%, pollo.amarillo 99%)" display="flex" alignItems="center" justifyContent="center" py={12} px={4}>
      <Container maxW="md" centerContent>
        <Box
          bg="white"
          p={10}
          borderRadius="2xl"
          boxShadow="0 25px 50px -12px rgb(0 0 0 / 0.2), 0 0 0 1px rgb(0 0 0 / 0.05)"
          w="full"
          borderTop="4px solid"
          borderTopColor="brand.500"
        >
          <Flex direction="column" align="center" mb={6}>
            <ChickenLogo boxSize={14} />
            <Heading size="lg" mt={3} textAlign="center" fontWeight="800" color="brand.700">
              Crear Usuario Administrador
            </Heading>
          </Flex>
          <Text mb={6} textAlign="center" color="gray.500" fontSize="sm">
            Completa el formulario para crear tu cuenta de administrador
          </Text>
          <form onSubmit={handleInitialize}>
            <VStack spacing={5}>
              <FormControl isRequired>
                <FormLabel fontWeight="semibold">Nombre completo</FormLabel>
                <Input
                  type="text"
                  value={initName}
                  onChange={(e) => setInitName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  size="lg"
                  autoFocus
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Tu nombre completo para identificarte en el sistema
                </Text>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel fontWeight="semibold">Usuario</FormLabel>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej: admin"
                  size="lg"
                  minLength={3}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Mínimo 3 caracteres. Este será tu nombre de usuario para iniciar sesión
                </Text>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel fontWeight="semibold">Contraseña</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  size="lg"
                  minLength={6}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Mínimo 6 caracteres. Guárdala en un lugar seguro
                </Text>
              </FormControl>
              
              <Button
                type="submit"
                colorScheme="brand"
                width="full"
                size="lg"
                borderRadius="xl"
                isLoading={isLoading}
                loadingText="Creando usuario..."
              >
                Crear Usuario Administrador
              </Button>
              
              <Button
                variant="ghost"
                width="full"
                borderRadius="xl"
                onClick={() => {
                  setShowInitForm(false)
                  setInitName('')
                  setUsername('')
                  setPassword('')
                }}
                isDisabled={isLoading}
              >
                Cancelar
              </Button>
            </VStack>
          </form>
        </Box>
      </Container>
      </Box>
    )
  }

  return (
    <Box
      minH="100vh"
      bgGradient="linear(135deg, brand.50 0%, gray.50 40%, pollo.amarillo 99%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={12}
      px={4}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top="-20%"
        right="-10%"
        w="400px"
        h="400px"
        borderRadius="full"
        bg="brand.100"
        opacity={0.4}
      />
      <Box
        position="absolute"
        bottom="-10%"
        left="-5%"
        w="300px"
        h="300px"
        borderRadius="full"
        bg="pollo.amarillo"
        opacity={0.15}
      />
      <Container maxW="md" centerContent position="relative" zIndex={1}>
        <Box
          bg="white"
          p={{ base: 8, md: 10 }}
          borderRadius="2xl"
          boxShadow="0 25px 50px -12px rgb(0 0 0 / 0.2), 0 0 0 1px rgb(0 0 0 / 0.05)"
          w="full"
          borderTop="4px solid"
          borderTopColor="brand.500"
        >
          <Flex direction="column" align="center" mb={8}>
            <ChickenLogo boxSize={16} />
            <Heading size="xl" mt={4} textAlign="center" fontWeight="800" letterSpacing="tight">
              <Text as="span" color="brand.600">Sistema </Text>
              <Text as="span" color="pollo.amarilloOscuro">Alimentos</Text>
            </Heading>
            <Text mt={2} textAlign="center" color="gray.500" fontSize="sm" fontWeight="500">
              {showRegisterForm ? 'Crea tu cuenta para acceder' : 'Inicia sesión para continuar'}
            </Text>
          </Flex>

          {showRegisterForm ? (
            <form onSubmit={handleRegister}>
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel fontWeight="600" color="gray.700">Nombre completo</FormLabel>
                  <Input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ej: María González"
                    size="lg"
                    borderRadius="xl"
                    focusBorderColor="brand.500"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontWeight="600" color="gray.700">Usuario</FormLabel>
                  <Input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Para iniciar sesión (mín. 3 caracteres)"
                    size="lg"
                    borderRadius="xl"
                    focusBorderColor="brand.500"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontWeight="600" color="gray.700">Contraseña</FormLabel>
                  <Input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    size="lg"
                    borderRadius="xl"
                    focusBorderColor="brand.500"
                  />
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="brand"
                  width="full"
                  size="lg"
                  isLoading={registerLoading}
                  loadingText="Creando cuenta..."
                  borderRadius="xl"
                  fontWeight="600"
                >
                  Crear cuenta
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  width="full"
                  size="md"
                  borderRadius="xl"
                  onClick={() => {
                    setShowRegisterForm(false)
                    setRegName('')
                    setRegUsername('')
                    setRegPassword('')
                  }}
                >
                  Volver al inicio de sesión
                </Button>
              </VStack>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel fontWeight="600" color="gray.700">Usuario</FormLabel>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingresa tu usuario"
                    autoComplete="username"
                    size="lg"
                    borderRadius="xl"
                    focusBorderColor="brand.500"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontWeight="600" color="gray.700">Contraseña</FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    size="lg"
                    borderRadius="xl"
                    focusBorderColor="brand.500"
                  />
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="brand"
                  width="full"
                  size="lg"
                  isLoading={isLoading}
                  loadingText="Iniciando sesión..."
                  borderRadius="xl"
                  fontWeight="600"
                >
                  Iniciar Sesión
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  colorScheme="brand"
                  width="full"
                  size="md"
                  borderRadius="xl"
                  onClick={() => setShowRegisterForm(true)}
                >
                  Registrarme
                </Button>
              </VStack>
            </form>
          )}
        </Box>
      </Container>
    </Box>
  )
}




