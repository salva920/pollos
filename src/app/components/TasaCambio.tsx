'use client'

import React, { useState } from 'react'
import {
  Box,
  Button,
  HStack,
  Input,
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
} from '@chakra-ui/react'
import { FiDollarSign, FiEdit2 } from 'react-icons/fi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatCurrency } from '@/lib/utils'

export default function TasaCambio() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [nuevaTasa, setNuevaTasa] = useState('')
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: tasaCambio } = useQuery({
    queryKey: ['tasa-cambio'],
    queryFn: async () => {
      const res = await fetch('/api/tasa-cambio')
      if (!res.ok) throw new Error('Error al cargar tasa')
      return res.json()
    },
  })

  const updateTasaMutation = useMutation({
    mutationFn: async (tasa: number) => {
      const res = await fetch('/api/tasa-cambio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasa }),
      })
      if (!res.ok) throw new Error('Error al actualizar tasa')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasa-cambio'] })
      toast({
        title: 'Tasa actualizada',
        description: 'La tasa de cambio se actualizó correctamente',
        status: 'success',
        duration: 3000,
      })
      onClose()
      setNuevaTasa('')
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la tasa',
        status: 'error',
        duration: 3000,
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const tasa = parseFloat(nuevaTasa)
    if (tasa > 0) {
      updateTasaMutation.mutate(tasa)
    }
  }

  return (
    <>
      <Box
        bg="white"
        border="1px"
        borderColor="blackAlpha.100"
        borderRadius="2xl"
        p={4}
        boxShadow="0 1px 3px 0 rgb(0 0 0 / 0.06)"
      >
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', sm: 'center' }}
          gap={3}
          flexWrap="wrap"
        >
          <HStack flex={1} minW={0}>
            <Box p={2} bg="brand.50" borderRadius="xl" color="brand.500" flexShrink={0}>
              <FiDollarSign />
            </Box>
            <Box minW={0}>
              <Text fontSize="sm" color="gray.500" fontWeight="500">Tasa de Cambio</Text>
              <Text color="gray.800" fontWeight="700" fontSize={{ base: 'md', sm: 'lg' }} noOfLines={1}>
                {tasaCambio?.tasa ? formatCurrency(tasaCambio.tasa, 'VES') : 'No configurada'}
              </Text>
            </Box>
          </HStack>
          <Button
            size="sm"
            leftIcon={<FiEdit2 />}
            colorScheme="brand"
            variant="outline"
            onClick={onOpen}
            borderRadius="xl"
            w={{ base: 'full', sm: 'auto' }}
          >
            Actualizar
          </Button>
        </Flex>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl" mx={4}>
          <ModalHeader fontWeight="600">Actualizar Tasa de Cambio</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit}>
              <FormControl isRequired>
                <FormLabel>Nueva tasa (Bs. por USD)</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={nuevaTasa}
                  onChange={(e) => setNuevaTasa(e.target.value)}
                  placeholder="Ej: 36.50"
                  borderRadius="xl"
                  focusBorderColor="brand.500"
                />
              </FormControl>
              <Button
                type="submit"
                colorScheme="brand"
                width="full"
                mt={4}
                borderRadius="xl"
                isLoading={updateTasaMutation.isPending}
              >
                Actualizar Tasa
              </Button>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}




