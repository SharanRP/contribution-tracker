import React from 'react';
import { Box, Flex, Button, Heading, useColorMode, useColorModeValue, Link as ChakraLink } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion'; // Added for animations
import 'tailwindcss/tailwind.css';

const Navbar = ({ isAdmin, onLogout }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue("gray.800", "gray.900");
  const hoverBg = useColorModeValue("blue.500", "blue.600");

  // Animation variants for framer-motion
  const fadeIn = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn}>
      <Box
        className="w-full fixed top-0 left-0 right-0 z-10 shadow-md transition-all duration-300"
        bg={bgColor}
        px={6}
        py={4}
      >
        <Flex className="max-w-7xl mx-auto justify-between items-center">
          {/* Title on the left */}
          <Heading as="h1" size="lg" color="white" fontWeight="bold">
            <ChakraLink
              as={Link}
              to="/"
              _hover={{ textDecoration: "none", color: "blue.400" }}
              transition="color 0.3s ease"
            >
              Repository Progress Tracker
            </ChakraLink>
          </Heading>

          {/* All buttons on the right */}
          <Flex className="space-x-4" alignItems="center">
            {/* Dark/Light Mode Toggle */}
            <Button
              onClick={toggleColorMode}
              mr={4}
              colorScheme="teal"
              variant="ghost"
              whileHover={{ scale: 1.1 }} // Animation on hover
              whileTap={{ scale: 0.9 }} // Animation on click
            >
              {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            </Button>

            {/* Home and Posts buttons */}
            <Button
              as={Link}
              to="/"
              colorScheme="teal"
              variant="ghost"
              _hover={{ bg: hoverBg }}
              transition="background 0.3s ease"
              whileHover={{ scale: 1.1 }} // Animation on hover
              whileTap={{ scale: 0.9 }} // Animation on click
            >
              Home
            </Button>
            <Button
              as={Link}
              to="/posts"
              colorScheme="teal"
              variant="ghost"
              _hover={{ bg: hoverBg }}
              transition="background 0.3s ease"
              whileHover={{ scale: 1.1 }} // Animation on hover
              whileTap={{ scale: 0.9 }} // Animation on click
            >
              Posts
            </Button>

            {/* Admin and Login/Logout buttons */}
            {isAdmin ? (
              <>
                <Button
                  as={Link}
                  to="/admin"
                  colorScheme="blue"
                  variant="solid"
                  _hover={{ bg: hoverBg }}
                  transition="background 0.3s ease"
                  whileHover={{ scale: 1.1 }} // Animation on hover
                  whileTap={{ scale: 0.9 }} // Animation on click
                >
                  Admin Panel
                </Button>
                <Button
                  onClick={onLogout}
                  colorScheme="red"
                  variant="solid"
                  _hover={{ bg: "red.600" }}
                  transition="background 0.3s ease"
                  whileHover={{ scale: 1.1 }} // Animation on hover
                  whileTap={{ scale: 0.9 }} // Animation on click
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                as={Link}
                to="/login"
                colorScheme="blue"
                variant="solid"
                _hover={{ bg: hoverBg }}
                transition="background 0.3s ease"
                whileHover={{ scale: 1.1 }} // Animation on hover
                whileTap={{ scale: 0.9 }} // Animation on click
              >
                Login
              </Button>
            )}
          </Flex>
        </Flex>
      </Box>
    </motion.div>
  );
};

export default Navbar;
