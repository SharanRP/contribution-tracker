import React, { useEffect } from "react";
import { Box, Input, FormLabel, Flex } from "@chakra-ui/react";

const TimelineFilter = ({ startDate, endDate, setStartDate, setEndDate }) => {
  // Set default start date and end date
  useEffect(() => {
    if (!startDate) setStartDate("2023-10-23");
    if (!endDate) setEndDate(new Date().toISOString().split("T")[0]); // Today's date in YYYY-MM-DD format
  }, [startDate, endDate, setStartDate, setEndDate]);

  return (
    <Flex align="center" justify="space-between" wrap="wrap" className="mt-12">
      <Box>
        <FormLabel color="white">Start Date</FormLabel>
        <Input
          type="date"
          value={startDate || ""}
          onChange={(e) => setStartDate(e.target.value)}
          bg="gray.700"
          color="white"
        />
      </Box>

      <Box ml={4}>
        <FormLabel color="white">End Date</FormLabel>
        <Input
          type="date"
          value={endDate || ""}
          onChange={(e) => setEndDate(e.target.value)}
          bg="gray.700"
          color="white"
        />
      </Box>
    </Flex>
  );
};

export default TimelineFilter;
