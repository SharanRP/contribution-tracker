import React, { useState, useEffect } from "react";
import { Box, Button, Heading, VStack, Text, useToast, HStack, Switch, Grid } from "@chakra-ui/react";
import MDEditor from '@uiw/react-md-editor';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_URL = 'http://localhost:5000';

const Announcements = ({ isAdmin }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [draft, setDraft] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/announcements`);
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: "Error fetching announcements",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSendAnnouncement = async () => {
    if (draft) {
      try {
        const token = localStorage.getItem('token'); 
        await axios.post(`${API_URL}/api/announcements`, 
          { content: draft },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        setDraft("");
        fetchAnnouncements();
        toast({
          title: "Announcement posted successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error posting announcement:', error);
        toast({
          title: "Error posting announcement",
          description: error.response?.data?.error || error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const scaleUp = {
    hidden: { scale: 0.9 },
    visible: { scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn}>
      <Box
        p={8}
        bgGradient="linear(to-br, gray.900, gray.800)"
        minH="100vh"
        minW="90vh"
        color="white"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        className="w-full h-full mt-12"
      >
        <Heading
          mb={6}
          fontSize="3xl"
          textAlign="center"
          textTransform="uppercase"
          color="cyan.400"
          letterSpacing="wider"
        >
          Announcements
        </Heading>

        {isAdmin && (
          <motion.div variants={scaleUp}>
            <Box mb={8} p={6} bg="gray.700" borderRadius="lg" boxShadow="lg" transition="all 0.3s">
              <HStack justify="space-between" align="center" mb={4}>
                <Text fontSize="lg" color="gray.400">Create Announcement</Text>
                <HStack>
                  <Text>Preview Mode</Text>
                  <Switch
                    colorScheme="teal"
                    isChecked={previewMode}
                    onChange={(e) => setPreviewMode(e.target.checked)}
                  />
                </HStack>
              </HStack>

              {/* Grid layout for editor and preview mode */}
              <Grid templateColumns={previewMode ? "1fr 1fr" : "1fr"} gap={4}>
                {/* Editor on the left */}
                <MDEditor
                  value={draft}
                  onChange={setDraft}
                  preview="edit"
                  height={200}
                  className="editor"
                  style={{ backgroundColor: "#2d3748", color: "white" }}
                />

                {/* Preview on the right, visible only if preview mode is enabled */}
                {previewMode && (
                  <Box p={4} bg="gray.600" borderRadius="md" overflowY="auto">
                    <ReactMarkdown>{draft || "_Nothing to preview_"}</ReactMarkdown>
                  </Box>
                )}
              </Grid>

              <Button
                mt={4}
                colorScheme="teal"
                size="lg"
                width="100%"
                onClick={handleSendAnnouncement}
                _hover={{ bg: "cyan.500", transform: "scale(1.05)" }}
                transition="all 0.2s"
              >
                Post Announcement
              </Button>
            </Box>
          </motion.div>
        )}

        <VStack spacing={6} align="stretch" width="100%">
          {announcements.map((announcement) => (
            <motion.div key={announcement.id} initial="hidden" animate="visible" variants={scaleUp}>
              <Box
                bg="gray.800"
                p={6}
                borderRadius="lg"
                boxShadow="md"
                transition="all 0.3s"
                _hover={{ transform: "scale(1.02)", boxShadow: "lg" }}
              >
                <Text fontSize="sm" color="gray.500" mb={2}>
                  {new Date(announcement.created_at).toLocaleString()}
                </Text>
                <ReactMarkdown>{announcement.content}</ReactMarkdown>
              </Box>
            </motion.div>
          ))}
        </VStack>
      </Box>
    </motion.div>
  );
};

export default Announcements;
