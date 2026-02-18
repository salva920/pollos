'use client'

import React from 'react'
import {
  Box,
  Flex,
  Button,
  Heading,
  HStack,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
  Badge,
} from '@chakra-ui/react'
import { useRouter, usePathname } from 'next/navigation'
import { FiHome, FiPackage, FiShoppingCart, FiUsers, FiTruck, FiDollarSign, FiLogOut, FiUser, FiBell, FiUserCheck } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const toast = useToast()

  // Obtener alertas no leídas
  const { data: alertas = [] } = useQuery({
    queryKey: ['alertas', 'no-leidas'],
    queryFn: async () => {
      const res = await fetch('/api/alertas?leida=false')
      if (!res.ok) return []
      return res.json()
    },
    refetchInterval: 60000, // Actualizar cada minuto
  })

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión exitosamente',
        status: 'success',
        duration: 3000,
      })
      router.push('/login')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cerrar sesión',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const isActive = (path: string) => pathname === path

  return (
    <Box
      bg="white"
      borderBottom="1px"
      borderColor="blackAlpha.100"
      px={4}
      py={3}
      boxShadow="0 1px 3px 0 rgb(0 0 0 / 0.05)"
    >
      <Flex maxW="1600px" mx="auto" justify="space-between" align="center">
        <Heading
          size="md"
          cursor="pointer"
          onClick={() => router.push('/')}
          fontWeight="700"
          color="gray.800"
          _hover={{ color: 'brand.600' }}
          transition="color 0.2s"
        >
          🥚 Sistema de Alimentos
        </Heading>

        <HStack spacing={1}>
          <Button
            leftIcon={<FiHome />}
            variant={isActive('/') ? 'solid' : 'ghost'}
            colorScheme="brand"
            color={isActive('/') ? 'white' : 'gray.700'}
            bg={isActive('/') ? 'brand.500' : undefined}
            _hover={{ bg: isActive('/') ? 'brand.600' : 'gray.100' }}
            onClick={() => router.push('/')}
            size="sm"
            borderRadius="xl"
          >
            Dashboard
          </Button>

          <Button
            leftIcon={<FiPackage />}
            variant="ghost"
            color={isActive('/productos') ? 'brand.600' : 'gray.700'}
            bg={isActive('/productos') ? 'brand.50' : undefined}
            _hover={{ bg: 'gray.100' }}
            onClick={() => router.push('/productos')}
            size="sm"
            borderRadius="xl"
          >
            Productos
          </Button>

          <Button
            leftIcon={<FiShoppingCart />}
            variant="ghost"
            color={isActive('/ventas') ? 'brand.600' : 'gray.700'}
            bg={isActive('/ventas') ? 'brand.50' : undefined}
            _hover={{ bg: 'gray.100' }}
            onClick={() => router.push('/ventas')}
            size="sm"
            borderRadius="xl"
          >
            Ventas
          </Button>

          <Button
            leftIcon={<FiUsers />}
            variant="ghost"
            color={isActive('/clientes') ? 'brand.600' : 'gray.700'}
            bg={isActive('/clientes') ? 'brand.50' : undefined}
            _hover={{ bg: 'gray.100' }}
            onClick={() => router.push('/clientes')}
            size="sm"
            borderRadius="xl"
          >
            Clientes
          </Button>

          <Button
            leftIcon={<FiTruck />}
            variant="ghost"
            color={isActive('/proveedores') ? 'brand.600' : 'gray.700'}
            bg={isActive('/proveedores') ? 'brand.50' : undefined}
            _hover={{ bg: 'gray.100' }}
            onClick={() => router.push('/proveedores')}
            size="sm"
            borderRadius="xl"
          >
            Proveedores
          </Button>

          <Button
            leftIcon={<FiDollarSign />}
            variant="ghost"
            color={isActive('/administracion') ? 'brand.600' : 'gray.700'}
            bg={isActive('/administracion') ? 'brand.50' : undefined}
            _hover={{ bg: 'gray.100' }}
            onClick={() => router.push('/administracion')}
            size="sm"
            borderRadius="xl"
          >
            Administración
          </Button>

          <Button
            leftIcon={<FiUserCheck />}
            variant="ghost"
            color={isActive('/usuarios') ? 'brand.600' : 'gray.700'}
            bg={isActive('/usuarios') ? 'brand.50' : undefined}
            _hover={{ bg: 'gray.100' }}
            onClick={() => router.push('/usuarios')}
            size="sm"
            borderRadius="xl"
          >
            Usuarios
          </Button>

          <Button
            leftIcon={<FiBell />}
            variant="ghost"
            color="gray.700"
            _hover={{ bg: 'gray.100' }}
            onClick={() => router.push('/alertas')}
            size="sm"
            position="relative"
            borderRadius="xl"
          >
            Alertas
            {alertas.length > 0 && (
              <Badge
                position="absolute"
                top="-1"
                right="-1"
                colorScheme="red"
                borderRadius="full"
                fontSize="xs"
              >
                {alertas.length}
              </Badge>
            )}
          </Button>

          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              color="gray.700"
              size="sm"
              borderRadius="xl"
              _hover={{ bg: 'gray.100' }}
            >
              <HStack spacing={2}>
                <Avatar size="xs" bg="brand.400" />
                <FiUser />
              </HStack>
            </MenuButton>
            <MenuList color="gray.800" borderRadius="xl" shadow="soft" border="1px" borderColor="blackAlpha.100">
              <MenuItem icon={<FiUser />}>Mi Perfil</MenuItem>
              <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
                Cerrar Sesión
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  )
}




