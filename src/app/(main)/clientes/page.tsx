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
  Text,
  Divider,
} from '@chakra-ui/react'
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function ClientesPage() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const toast = useToast()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    name: '',
    cedula: '',
    email: '',
    phone: '',
    address: '',
    type: 'detal',
  })

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch('/api/customers')
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/customers', {
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
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast({
        title: 'Cliente creado',
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
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast({
        title: 'Cliente actualizado',
        status: 'success',
        duration: 3000,
      })
      handleClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error)
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast({
        title: 'Cliente eliminado',
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

  const handleOpen = (customer?: any) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        name: customer.name,
        cedula: customer.cedula,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        type: customer.type,
      })
    } else {
      setEditingCustomer(null)
      setFormData({
        name: '',
        cedula: '',
        email: '',
        phone: '',
        address: '',
        type: 'detal',
      })
    }
    onOpen()
  }

  const handleClose = () => {
    onClose()
    setEditingCustomer(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      deleteMutation.mutate(id)
    }
  }

  const filteredCustomers = customers.filter((customer: any) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.cedula.includes(searchTerm)
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
            <Heading size={{ base: 'lg', md: 'xl' }} fontWeight="800" color="brand.600">Gestión de Clientes</Heading>
          </Flex>
          <Button leftIcon={<FiPlus />} colorScheme="brand" onClick={() => handleOpen()} size={{ base: 'sm', md: 'md' }} w={{ base: 'full', sm: 'auto' }} fontWeight="600">
            Nuevo Cliente
          </Button>
        </Flex>

        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Buscar clientes por nombre o cédula..."
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
                <Th fontWeight="bold" color="gray.800">Cédula</Th>
                <Th fontWeight="bold" color="gray.800">Teléfono</Th>
                <Th fontWeight="bold" color="gray.800">Email</Th>
                <Th fontWeight="bold" color="gray.800">Tipo</Th>
                <Th fontWeight="bold" color="gray.800">Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredCustomers.map((customer: any) => (
                <Tr key={customer.id}>
                  <Td fontWeight="bold">{customer.name}</Td>
                  <Td>{customer.cedula}</Td>
                  <Td>{customer.phone || '-'}</Td>
                  <Td>{customer.email || '-'}</Td>
                  <Td>
                    <Badge colorScheme={customer.type === 'mayorista' ? 'purple' : 'brand'}>
                      {customer.type === 'mayorista' ? 'Mayorista' : 'Detal'}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Editar"
                        icon={<FiEdit2 />}
                        size="sm"
                        onClick={() => handleOpen(customer)}
                      />
                      <IconButton
                        aria-label="Eliminar"
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDelete(customer.id)}
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
          {filteredCustomers.map((customer: any) => (
            <Box
              key={customer.id}
              bg="white"
              p={4}
              rounded="lg"
              shadow="md"
              border="1px solid"
              borderColor="blackAlpha.100"
            >
              <VStack align="stretch" spacing={2}>
                <Flex justify="space-between" align="center">
                  <Text fontWeight="bold" fontSize="lg">{customer.name}</Text>
                  <Badge colorScheme={customer.type === 'mayorista' ? 'purple' : 'brand'}>
                    {customer.type === 'mayorista' ? 'Mayorista' : 'Detal'}
                  </Badge>
                </Flex>
                <Divider />
                <Flex justify="space-between">
                  <Text color="gray.600" fontSize="sm">Cédula:</Text>
                  <Text fontWeight="500">{customer.cedula}</Text>
                </Flex>
                {customer.phone && (
                  <Flex justify="space-between">
                    <Text color="gray.600" fontSize="sm">Teléfono:</Text>
                    <Text>{customer.phone}</Text>
                  </Flex>
                )}
                {customer.email && (
                  <Flex justify="space-between">
                    <Text color="gray.600" fontSize="sm">Email:</Text>
                    <Text fontSize="sm" isTruncated maxW="200px">{customer.email}</Text>
                  </Flex>
                )}
                <Divider />
                <HStack justify="flex-end" spacing={2}>
                  <IconButton
                    aria-label="Editar"
                    icon={<FiEdit2 />}
                    size="sm"
                    onClick={() => handleOpen(customer)}
                  />
                  <IconButton
                    aria-label="Eliminar"
                    icon={<FiTrash2 />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => handleDelete(customer.id)}
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
            {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Cédula</FormLabel>
                  <Input
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                    disabled={!!editingCustomer}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Teléfono</FormLabel>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Tipo de cliente</FormLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="detal">Detal</option>
                    <option value="mayorista">Mayorista</option>
                  </Select>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="brand"
                  width="full"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingCustomer ? 'Actualizar' : 'Crear'} Cliente
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}




