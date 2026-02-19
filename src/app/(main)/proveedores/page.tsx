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
  InputGroup,
  InputLeftElement,
  Text,
  Divider,
} from '@chakra-ui/react'
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function ProveedoresPage() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingProveedor, setEditingProveedor] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const toast = useToast()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    nombre: '',
    rif: '',
    telefono: '',
    email: '',
    direccion: '',
    contacto: '',
  })

  const { data: proveedores = [], isLoading } = useQuery({
    queryKey: ['proveedores'],
    queryFn: async () => {
      const res = await fetch('/api/proveedores')
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/proveedores', {
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
      queryClient.invalidateQueries({ queryKey: ['proveedores'] })
      toast({
        title: 'Proveedor creado',
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
      const res = await fetch(`/api/proveedores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] })
      toast({
        title: 'Proveedor actualizado',
        status: 'success',
        duration: 3000,
      })
      handleClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/proveedores/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] })
      toast({
        title: 'Proveedor eliminado',
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

  const handleOpen = (proveedor?: any) => {
    if (proveedor) {
      setEditingProveedor(proveedor)
      setFormData({
        nombre: proveedor.nombre,
        rif: proveedor.rif,
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        direccion: proveedor.direccion || '',
        contacto: proveedor.contacto || '',
      })
    } else {
      setEditingProveedor(null)
      setFormData({
        nombre: '',
        rif: '',
        telefono: '',
        email: '',
        direccion: '',
        contacto: '',
      })
    }
    onOpen()
  }

  const handleClose = () => {
    onClose()
    setEditingProveedor(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingProveedor) {
      updateMutation.mutate({ id: editingProveedor.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
      deleteMutation.mutate(id)
    }
  }

  const filteredProveedores = proveedores.filter((proveedor: any) =>
    proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.rif.includes(searchTerm)
  )

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
            <Heading size={{ base: 'lg', md: 'xl' }} fontWeight="800" color="brand.600">Gestión de Proveedores</Heading>
          </Flex>
          <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={() => handleOpen()} size={{ base: 'sm', md: 'md' }} w={{ base: 'full', sm: 'auto' }} fontWeight="600">
            Nuevo Proveedor
          </Button>
        </Flex>

        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Buscar proveedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>

        {/* Vista Desktop - Tabla */}
        <Box display={{ base: 'none', md: 'block' }} bg="white" p={{ base: 3, md: 6 }} rounded="lg" shadow="md" border="1px solid" borderColor="blackAlpha.100">
          <Table size="sm">
            <Thead>
              <Tr>
                <Th fontWeight="bold" color="gray.800">Nombre</Th>
                <Th fontWeight="bold" color="gray.800">RIF</Th>
                <Th fontWeight="bold" color="gray.800">Teléfono</Th>
                <Th fontWeight="bold" color="gray.800">Email</Th>
                <Th fontWeight="bold" color="gray.800">Contacto</Th>
                <Th fontWeight="bold" color="gray.800">Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredProveedores.map((proveedor: any) => (
                <Tr key={proveedor.id}>
                  <Td fontWeight="bold">{proveedor.nombre}</Td>
                  <Td>{proveedor.rif}</Td>
                  <Td>{proveedor.telefono || '-'}</Td>
                  <Td>{proveedor.email || '-'}</Td>
                  <Td>{proveedor.contacto || '-'}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Editar"
                        icon={<FiEdit2 />}
                        size="sm"
                        onClick={() => handleOpen(proveedor)}
                      />
                      <IconButton
                        aria-label="Eliminar"
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDelete(proveedor.id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        {/* Vista Mobile - Tarjetas */}
        <VStack display={{ base: 'flex', md: 'none' }} spacing={3} align="stretch">
          {filteredProveedores.map((proveedor: any) => (
            <Box
              key={proveedor.id}
              bg="white"
              p={4}
              rounded="lg"
              shadow="md"
              border="1px solid"
              borderColor="blackAlpha.100"
            >
              <VStack align="stretch" spacing={2}>
                <Text fontWeight="bold" fontSize="lg">{proveedor.nombre}</Text>
                <Divider />
                <Flex justify="space-between">
                  <Text color="gray.600" fontSize="sm">RIF:</Text>
                  <Text fontWeight="500">{proveedor.rif}</Text>
                </Flex>
                {proveedor.telefono && (
                  <Flex justify="space-between">
                    <Text color="gray.600" fontSize="sm">Teléfono:</Text>
                    <Text>{proveedor.telefono}</Text>
                  </Flex>
                )}
                {proveedor.email && (
                  <Flex justify="space-between">
                    <Text color="gray.600" fontSize="sm">Email:</Text>
                    <Text fontSize="sm" isTruncated maxW="200px">{proveedor.email}</Text>
                  </Flex>
                )}
                {proveedor.contacto && (
                  <Flex justify="space-between">
                    <Text color="gray.600" fontSize="sm">Contacto:</Text>
                    <Text>{proveedor.contacto}</Text>
                  </Flex>
                )}
                <Divider />
                <HStack justify="flex-end" spacing={2}>
                  <IconButton
                    aria-label="Editar"
                    icon={<FiEdit2 />}
                    size="sm"
                    onClick={() => handleOpen(proveedor)}
                  />
                  <IconButton
                    aria-label="Eliminar"
                    icon={<FiTrash2 />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => handleDelete(proveedor.id)}
                  />
                </HStack>
              </VStack>
            </Box>
          ))}
        </VStack>
      </VStack>

      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalOverlay />
        <ModalContent borderRadius="2xl" borderTop="4px solid" borderTopColor="brand.500">
          <ModalHeader fontWeight="700" color="brand.700">
            {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nombre</FormLabel>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>RIF</FormLabel>
                  <Input
                    value={formData.rif}
                    onChange={(e) => setFormData({ ...formData, rif: e.target.value })}
                    disabled={!!editingProveedor}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Teléfono</FormLabel>
                  <Input
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Dirección</FormLabel>
                  <Input
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Persona de contacto</FormLabel>
                  <Input
                    value={formData.contacto}
                    onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="brand"
                  width="full"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingProveedor ? 'Actualizar' : 'Crear'} Proveedor
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}




