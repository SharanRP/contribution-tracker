import React, { useState } from "react";
import { Box, Button, Flex, Text, Link } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

const Navbar = ({ isAdmin, handleLogin, handleLogout }) => {
  return (
    <Flex as="nav" bg="gray.900" p={4} justify="space-between" align="center">
      <Text color="white" fontSize="2xl" fontWeight="bold">
        Repo Leaderboard
      </Text>

      <Flex align="center">
        <RouterLink to="/">
          <Button mr={4} colorScheme="teal">
            Home
          </Button>
        </RouterLink>

        {isAdmin && (
          <RouterLink to="/announcements">
            <Button mr={4} colorScheme="blue">
              Announcements
            </Button>
          </RouterLink>
        )}

        {isAdmin ? (
          <Button onClick={handleLogout} colorScheme="red">
            Logout
          </Button>
        ) : (
          <Button onClick={handleLogin} colorScheme="green">
            Admin Login
          </Button>
        )}
      </Flex>
    </Flex>
  );
};

export default Navbar;
