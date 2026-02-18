'use client'

import React from 'react'
import {
  Box,
  Flex,
  Button,
  Heading,
  HStack,
  VStack,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Badge,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  useDisclosure,
} from '@chakra-ui/react'
import { useRouter, usePathname } from 'next/navigation'
import { FiHome, FiPackage, FiShoppingCart, FiUsers, FiTruck, FiDollarSign, FiLogOut, FiUser, FiBell, FiUserCheck, FiMenu } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'

const navItems = [
  { path: '/', label: 'Dashboard', icon: FiHome },
  { path: '/productos', label: 'Productos', icon: FiPackage },
  { path: '/ventas', label: 'Ventas', icon: FiShoppingCart },
  { path: '/clientes', label: 'Clientes', icon: FiUsers },
  { path: '/proveedores', label: 'Proveedores', icon: FiTruck },
  { path: '/administracion', label: 'Administración', icon: FiDollarSign },
  { path: '/usuarios', label: 'Usuarios', icon: FiUserCheck },
  { path: '/alertas', label: 'Alertas', icon: FiBell },
]

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()

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

  const NavButton = ({ path, label, icon: Icon }: { path: string; label: string; icon: React.ElementType }) => (
    <Button
      leftIcon={<Icon />}
      variant={isActive(path) ? 'solid' : 'ghost'}
      colorScheme="brand"
      color={isActive(path) ? 'white' : 'gray.700'}
      bg={isActive(path) ? 'brand.500' : undefined}
      _hover={{ bg: isActive(path) ? 'brand.600' : 'gray.100' }}
      onClick={() => { router.push(path); onClose() }}
      size="sm"
      borderRadius="xl"
      justifyContent="flex-start"
      w={{ base: 'full', md: 'auto' }}
    >
      {label}
      {path === '/alertas' && alertas.length > 0 && (
        <Badge ml={2} colorScheme="red" borderRadius="full" fontSize="xs">
          {alertas.length}
        </Badge>
      )}
    </Button>
  )

  return (
    <Box
      bg="white"
      borderBottom="1px"
      borderColor="blackAlpha.100"
      px={{ base: 3, md: 4 }}
      py={3}
      boxShadow="0 1px 3px 0 rgb(0 0 0 / 0.05)"
    >
      <Flex maxW="1600px" mx="auto" justify="space-between" align="center" gap={2}>
        <Heading
          as="button"
          size={{ base: 'sm', md: 'md' }}
          cursor="pointer"
          onClick={() => router.push('/')}
          fontWeight="700"
          color="gray.800"
          _hover={{ color: 'brand.600' }}
          transition="color 0.2s"
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
          maxW={{ base: '180px', sm: '220px', md: 'none' }}
        >
          🥚 Sistema de Alimentos
        </Heading>

        {/* Desktop nav */}
        <HStack spacing={1} display={{ base: 'none', md: 'flex' }} flexWrap="wrap">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Button
              key={path}
              leftIcon={<Icon />}
              variant={isActive(path) ? 'solid' : 'ghost'}
              colorScheme="brand"
              color={isActive(path) ? 'white' : 'gray.700'}
              bg={isActive(path) ? 'brand.500' : undefined}
              _hover={{ bg: isActive(path) ? 'brand.600' : 'gray.100' }}
              onClick={() => router.push(path)}
              size="sm"
              borderRadius="xl"
            >
              {label}
              {path === '/alertas' && alertas.length > 0 && (
                <Badge ml={1} colorScheme="red" borderRadius="full" fontSize="xs">
                  {alertas.length}
                </Badge>
              )}
            </Button>
          ))}
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

        {/* Mobile: hamburger + user menu */}
        <HStack display={{ base: 'flex', md: 'none' }} spacing={1}>
          <IconButton
            aria-label="Abrir menú"
            icon={<FiMenu />}
            variant="ghost"
            size="sm"
            onClick={onOpen}
            colorScheme="brand"
          />
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              color="gray.700"
              size="sm"
              borderRadius="xl"
              _hover={{ bg: 'gray.100' }}
            >
              <Avatar size="xs" bg="brand.400" />
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

      <Drawer placement="left" onClose={onClose} isOpen={isOpen} size="xs">
        <DrawerOverlay />
        <DrawerContent borderRadius="0 2xl 2xl 0">
          <DrawerHeader borderBottomWidth="1px">
            🥚 Sistema de Alimentos
          </DrawerHeader>
          <DrawerBody p={2}>
            <VStack align="stretch" spacing={1}>
              {navItems.map(({ path, label, icon: Icon }) => (
                <NavButton key={path} path={path} label={label} icon={Icon} />
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}




