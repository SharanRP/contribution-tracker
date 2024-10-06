import React from 'react'
import { motion } from 'framer-motion'
import { Box, VStack, Spinner, Text } from '@chakra-ui/react'
import TimelineFilter from './TimelineFilter'
import ProgressChart from './ProgressChart'
import Leaderboard from './LeaderBoard'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const HomePage = ({ repositories, startDate, endDate, setStartDate, setEndDate, loading, error }) => {
    return (
        <>
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                <TimelineFilter
                    startDate={startDate}
                    endDate={endDate}
                    setStartDate={setStartDate}
                    setEndDate={setEndDate}
                />
            </motion.div>
            {loading ? (
                <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                    <Box display="flex" justifyContent="center" alignItems="center" mt={8}>
                        <Spinner size="xl" speed="0.65s" color="teal.300" />
                        <Text ml={4}>Fetching repository data...</Text>
                    </Box>
                </motion.div>
            ) : (
                <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                    <VStack spacing={6} width="100%">
                        {error && (
                            <Text color="red.500" mt={4}>
                                {error}
                            </Text>
                        )}
                        {repositories.length > 0 ? (
                            <>
                                <ProgressChart repositories={repositories} startDate={startDate} endDate={endDate} />
                                <Leaderboard repositories={repositories} />
                            </>
                        ) : (
                            <Text mt={6} textAlign="center">
                                No data available for the selected timeline.
                            </Text>
                        )}
                    </VStack>
                </motion.div>
            )}
        </>
    )
}

export default HomePage
