'use client'

import React from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Button,
} from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDateShort } from '@/lib/utils'
import { FiCheck } from 'react-icons/fi'

export default function AlertasPage() {
  const queryClient = useQueryClient()

  const { data: alertas = [], isLoading } = useQuery({
    queryKey: ['alertas'],
    queryFn: async () => {
      const res = await fetch('/api/alertas')
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
  })

  const marcarLeidaMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/alertas/${id}`, {
        method: 'PUT',
      })
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] })
    },
  })

  if (isLoading) {
    return (
      <Center h="80vh">
        <Spinner size="xl" />
      </Center>
    )
  }

  return (
    <Container maxW="container.xl">
      <VStack spacing={6} align="stretch">
        <Heading>Centro de Alertas</Heading>

        {alertas.length === 0 ? (
          <Alert status="success">
            <AlertIcon />
            No hay alertas pendientes
          </Alert>
        ) : (
          <VStack spacing={4} align="stretch">
            {alertas.map((alerta: any) => (
              <Box
                key={alerta.id}
                p={4}
                bg={alerta.leida ? 'gray.50' : 'orange.50'}
                border="1px"
                borderColor={alerta.leida ? 'gray.200' : 'orange.200'}
                rounded="lg"
              >
                <HStack justify="space-between">
                  <VStack align="start" flex={1}>
                    <HStack>
                      <Badge colorScheme={alerta.prioridad === 'alta' ? 'red' : 'yellow'}>
                        {alerta.prioridad.toUpperCase()}
                      </Badge>
                      <Badge colorScheme="blue">{alerta.tipo}</Badge>
                    </HStack>
                    <Text fontWeight="bold">{alerta.mensaje}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {formatDateShort(alerta.fecha)}
                    </Text>
                  </VStack>
                  {!alerta.leida && (
                    <Button
                      size="sm"
                      leftIcon={<FiCheck />}
                      colorScheme="green"
                      onClick={() => marcarLeidaMutation.mutate(alerta.id)}
                    >
                      Marcar como leída
                    </Button>
                  )}
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>
    </Container>
  )
}




