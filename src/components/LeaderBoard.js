import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  RadioGroup,
  Radio,
  Select,
  Badge,
  Flex,
  HStack,
  Container,
  Icon,
  Avatar,
  Tooltip,
  Button,
  AvatarGroup,  
  usePrefersReducedMotion,
} from "@chakra-ui/react";
import { FaStar, FaCodeBranch, FaCode } from "react-icons/fa";
import { MdAccessTime, MdDateRange, MdOpenInNew } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const Leaderboard = ({ repositories }) => {
  const [timePeriod, setTimePeriod] = useState("all-time");
  const [sortBy, setSortBy] = useState("commits");
  const prefersReducedMotion = usePrefersReducedMotion();

  const getFilteredRepositories = () => {
    if (timePeriod === "weekly") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return repositories.filter((repo) => {
        const repoDate = new Date(repo.lastCommitDate);
        return repoDate >= oneWeekAgo;
      });
    }
    return repositories;
  };

  const sortedRepositories = getFilteredRepositories().sort((a, b) => {
    if (sortBy === "commits") return b.commits - a.commits;
    if (sortBy === "stars") return b.stars - a.stars;
    if (sortBy === "forks") return b.forks - a.forks;
    return 0;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Box
    height="600px"
    p={6}
    borderRadius="xl"
    boxShadow="0 0 20px rgba(0, 0, 0, 0.1), 0 0 40px rgba(255, 255, 255, 0.1)"
    position="relative"
    overflow="hidden"
    _before={{
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(26, 32, 44, 0.7)",
      backdropFilter: "blur(70px)",
      zIndex: -1,
    }}
      className="mt-6 border-2 shadow-[0_20px_30px_rgba(75,_112,_184,_0.7)] min-h-[100vh] border-gray-600 w-full "
    >
      <Container maxW="container.2xl">
        <MotionBox
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Heading
            as="h2"
            size="2xl"
            textAlign="center"
            mb={12}
            color="white"
            fontFamily="'Poppins', sans-serif"
            fontWeight="bold"
            letterSpacing="wide"
          >
            Repository Leaderboard
          </Heading>
        </MotionBox>

        <MotionFlex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align="center"
          mb={8}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <RadioGroup
            value={timePeriod}
            onChange={setTimePeriod}
            color="white"
            mb={{ base: 4, md: 0 }}
          >
            <HStack spacing={6}>
              <Radio value="all-time" size="lg">
                <HStack>
                  <Icon as={MdDateRange} w={5} h={5} />
                  <Text fontSize="lg" fontWeight="medium">
                    All-Time
                  </Text>
                </HStack>
              </Radio>
              <Radio value="weekly" size="lg">
                <HStack>
                  <Icon as={MdAccessTime} w={5} h={5} />
                  <Text fontSize="lg" fontWeight="medium">
                    Weekly
                  </Text>
                </HStack>
              </Radio>
            </HStack>
          </RadioGroup>

          <Select
            w={{ base: "full", md: "250px" }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            bg="gray.800"
            color="white"
            fontSize="lg"
            borderColor="gray.600"
            _hover={{ borderColor: "gray.500" }}
          >
            <option value="commits">Sort by Commits</option>
            <option value="stars">Sort by Stars</option>
            <option value="forks">Sort by Forks</option>
          </Select>
        </MotionFlex>

        <AnimatePresence>
          <MotionBox
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <VStack spacing={8} align="stretch">
              {sortedRepositories.map((repo, index) => (
                <MotionBox
                  key={repo.name}
                  variants={itemVariants}
                  bgGradient="linear(to-r, gray.700, gray.800)"
                  p={8}
                  borderRadius="xl"
                  boxShadow="2xl"
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -4, boxShadow: "2xl" }}
                >
                  <Flex justify="space-between" align="center" mb={6}>
                    <HStack spacing={4}>
                      <Text
                        fontSize="5xl"
                        fontWeight="black"
                        color="gray.500"
                        fontFamily="'Roboto', sans-serif"
                      >
                        #{index + 1}
                      </Text>
                      <Heading
                        as="h3"
                        size="xl"
                        color="white"
                        fontFamily="'Poppins', sans-serif"
                        fontWeight="semibold"
                      >
                        {repo.name}
                      </Heading>
                    </HStack>
                    <HStack spacing={6}>
                      <Tooltip label="Stars" hasArrow placement="top">
                        <Badge
                          colorScheme="yellow"
                          fontSize="lg"
                          px={4}
                          py={2}
                          borderRadius="md"
                        >
                          <HStack spacing={2}>
                            <Icon as={FaStar} w={5} h={5} />
                            <Text fontWeight="bold">{repo.stars}</Text>
                          </HStack>
                        </Badge>
                      </Tooltip>
                      <Tooltip label="Forks" hasArrow placement="top">
                        <Badge
                          colorScheme="blue"
                          fontSize="lg"
                          px={4}
                          py={2}
                          borderRadius="md"
                        >
                          <HStack spacing={2}>
                            <Icon as={FaCodeBranch} w={5} h={5} />
                            <Text fontWeight="bold">{repo.forks}</Text>
                          </HStack>
                        </Badge>
                      </Tooltip>
                      <Tooltip label="Commits" hasArrow placement="top">
                        <Badge
                          colorScheme="green"
                          fontSize="lg"
                          px={4}
                          py={2}
                          borderRadius="md"
                        >
                          <HStack spacing={2}>
                            <Icon as={FaCode} w={5} h={5} />
                            <Text fontWeight="bold">{repo.commits}</Text>
                          </HStack>
                        </Badge>
                      </Tooltip>
                    </HStack>
                  </Flex>

                  <Text color="gray.400" fontSize="lg" mb={4} fontWeight="medium">
                    Top Contributors:{" "}
                    {repo.contributors && repo.contributors.length
                      ? repo.contributors.map((contributor) => contributor.name).join(", ")
                      : "No contributors available"}
                  </Text>

                  <HStack spacing={6} wrap="wrap">
                    {(repo.contributors || []).slice(0, 3 ).map((contributor, idx) => (
                      <Tooltip key={idx} label={`${contributor.commits} commits`} hasArrow placement="top">
                        <MotionBox
                          as={HStack}
                          bg="gray.700"
                          p={2}
                          borderRadius="full"
                          whileHover={{ scale: 1.05, backgroundColor: "gray.600" }}
                          transition={{ duration: 0.2 }}
                        >
                          <Avatar size="md" name={contributor.name} src={contributor.avatar} />
                          <Text color="white" fontWeight="medium" fontSize="md">
                            {contributor.name}
                          </Text>
                        </MotionBox>
                      </Tooltip>
                    ))}
                  </HStack>

                  <Flex justify="space-between" align="center">
                    <AvatarGroup size="md" max={5}>
                      {(repo.contributors || []).map((contributor) => (
                        <Avatar
                          key={contributor.name}
                          name={contributor.name}
                          src={contributor.avatar_url}
                        />
                      ))}
                    </AvatarGroup>

                    <Button
                      as="a"
                      href={repo.url}
                      target="_blank"
                      colorScheme="teal"
                      size="lg"
                      rightIcon={<MdOpenInNew />}
                    >
                      View Repository
                    </Button>
                  </Flex>
                </MotionBox>
              ))}
            </VStack>
          </MotionBox>
        </AnimatePresence>
      </Container>
    </Box>
  );
};

export default Leaderboard;
