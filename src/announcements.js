import React, { useState, useEffect } from "react";
import { Box, Button, Textarea, Heading, VStack, Text } from "@chakra-ui/react";

const Announcements = ({ repositories }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const declareWeeklyWinner = () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weeklyRepos = repositories.filter(
        (repo) => new Date(repo.lastCommitDate) >= oneWeekAgo
      );

      if (weeklyRepos.length) {
        const winner = weeklyRepos.reduce((max, repo) => 
          repo.commits > max.commits ? repo : max, weeklyRepos[0]);

        setAnnouncements((prev) => [
          ...prev,
          `Weekly Winner: ${winner.name} with ${winner.commits} commits!`,
        ]);
      }
    };

    declareWeeklyWinner();
    const interval = setInterval(declareWeeklyWinner, 7 * 24 * 60 * 60 * 1000); 
    return () => clearInterval(interval); 
  }, [repositories]);

  const handleSendAnnouncement = () => {
    if (draft) {
      setAnnouncements((prev) => [...prev, draft]);
      setDraft("");
    }
  };

  return (
    <Box p={8} bg="gray.900" minH="100vh" color="white">
      <Heading mb={4}>Announcements</Heading>
      
      <Textarea
        placeholder="Write an announcement..."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        bg="gray.700"
        color="white"
        mb={4}
      />
      <Button colorScheme="blue" onClick={handleSendAnnouncement}>
        Send Announcement
      </Button>

      <VStack mt={8} spacing={4} align="stretch">
        {announcements.map((announcement, index) => (
          <Box key={index} bg="gray.800" p={4} borderRadius="md" shadow="md">
            <Text>{announcement}</Text>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default Announcements;
