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
  VStack,
  HStack,
  useToast,
  Spinner,
  Center,
  IconButton,
  Select,
  InputGroup,
  InputLeftElement,
  Alert,
  AlertIcon,
  Text,
  Switch,
} from '@chakra-ui/react'
import { FiPlus, FiEdit2, FiUserCheck, FiSearch } from 'react-icons/fi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'almacen', label: 'Almacén' },
]

export default function UsuariosPage() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingUser, setEditingUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const toast = useToast()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'vendedor',
  })

  const { data: me } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
  })

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
    enabled: me?.user?.role === 'admin',
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/users', {
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
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({ title: 'Usuario creado', status: 'success', duration: 3000 })
      handleClose()
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
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
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({ title: 'Usuario actualizado', status: 'success', duration: 3000 })
      handleClose()
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 })
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      })
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({ title: 'Estado actualizado', status: 'success', duration: 3000 })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 })
    },
  })

  const handleOpen = (user?: any) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        username: user.username,
        password: '',
        role: user.role,
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        username: '',
        password: '',
        role: 'vendedor',
      })
    }
    onOpen()
  }

  const handleClose = () => {
    onClose()
    setEditingUser(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingUser) {
      const payload: any = { name: formData.name, role: formData.role }
      if (formData.password) payload.password = formData.password
      updateMutation.mutate({ id: editingUser.id, data: payload })
    } else {
      if (!formData.password || formData.password.length < 6) {
        toast({ title: 'La contraseña debe tener al menos 6 caracteres', status: 'error' })
        return
      }
      createMutation.mutate(formData)
    }
  }

  const filteredUsers = users.filter(
    (u: any) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isAdmin = me?.user?.role === 'admin'

  if (!me) {
    return (
      <Center h="80vh">
        <Spinner size="xl" colorScheme="brand" />
      </Center>
    )
  }

  if (me && !isAdmin) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="warning" borderRadius="xl">
          <AlertIcon />
          <Box>
            <Text fontWeight="semibold">Acceso restringido</Text>
            <Text fontSize="sm">Solo los administradores pueden gestionar usuarios y empleados.</Text>
          </Box>
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" px={{ base: 2, md: 4 }} py={{ base: 4, md: 6 }}>
      <VStack spacing={6} align="stretch">
        <Flex direction={{ base: 'column', sm: 'row' }} justify="space-between" align={{ base: 'stretch', sm: 'center' }} gap={3}>
          <Heading size={{ base: 'lg', md: 'xl' }} fontWeight="700" color="gray.800">
            Usuarios y empleados
          </Heading>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="brand"
            onClick={() => handleOpen()}
            borderRadius="xl"
            size={{ base: 'sm', md: 'md' }}
            w={{ base: 'full', sm: 'auto' }}
          >
            Nuevo usuario
          </Button>
        </Flex>

        <Text color="gray.600">
          Gestiona quién puede iniciar sesión en el sistema. Crea usuarios (vendedor, almacén, administrador) y activa o desactiva cuentas.
        </Text>

        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Buscar por nombre o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            borderRadius="xl"
          />
        </InputGroup>

        <Box overflowX="auto" bg="white" p={{ base: 3, md: 6 }} borderRadius="2xl" boxShadow="0 1px 3px 0 rgb(0 0 0 / 0.06)" borderWidth="1px" borderColor="blackAlpha.100">
          <Table variant="simple" size="sm" minW="520px">
            <Thead>
              <Tr>
                <Th>Nombre</Th>
                <Th>Usuario (login)</Th>
                <Th>Rol</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredUsers.map((user: any) => (
                <Tr key={user.id}>
                  <Td fontWeight="bold">{user.name}</Td>
                  <Td>{user.username}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        user.role === 'admin' ? 'purple' : user.role === 'almacen' ? 'orange' : 'blue'
                      }
                    >
                      {ROLES.find((r) => r.value === user.role)?.label || user.role}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack>
                      <Switch
                        isChecked={user.active}
                        onChange={() =>
                          toggleActiveMutation.mutate({
                            id: user.id,
                            active: !user.active,
                          })
                        }
                        colorScheme="brand"
                      />
                      <Text fontSize="sm">{user.active ? 'Activo' : 'Inactivo'}</Text>
                    </HStack>
                  </Td>
                  <Td>
                    <IconButton
                      aria-label="Editar"
                      icon={<FiEdit2 />}
                      size="sm"
                      variant="ghost"
                      colorScheme="brand"
                      onClick={() => handleOpen(user)}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>

      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader>
            {editingUser ? 'Editar usuario' : 'Nuevo usuario'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nombre completo</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: María González"
                    borderRadius="xl"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Usuario (para iniciar sesión)</FormLabel>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Ej: mgonzalez"
                    disabled={!!editingUser}
                    borderRadius="xl"
                  />
                  {editingUser && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      El usuario no se puede cambiar al editar.
                    </Text>
                  )}
                </FormControl>

                <FormControl isRequired={!editingUser}>
                  <FormLabel>{editingUser ? 'Nueva contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}</FormLabel>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'Opcional' : 'Mínimo 6 caracteres'}
                    borderRadius="xl"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Rol</FormLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    borderRadius="xl"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="brand"
                  width="full"
                  borderRadius="xl"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingUser ? 'Actualizar' : 'Crear'} usuario
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}
