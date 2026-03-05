import { useState } from "react";
import { fetchLLMResponse } from "../api/openRouter";
import { Box, Button, Input, VStack, Text } from "@chakra-ui/react";
import ScrollableFeed from "react-scrollable-feed";

export function Chat() {
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input) return;
    setMessages([...messages, { from: "You", text: input }]);
    setLoading(true);

    const response = await fetchLLMResponse(input);
    setMessages((prev) => [...prev, { from: "AI", text: response }]);
    setInput("");
    setLoading(false);
  };

  return (
    <VStack spacing={4} align="stretch" maxW="600px" mx="auto" mt={10}>
      <Box
        border="1px solid #ccc"
        borderRadius="md"
        p={4}
        h="400px"
        overflowY="auto"
        bg="gray.50"
      >
        <ScrollableFeed>
          {messages.map((msg, idx) => (
            <Text key={idx} color={msg.from === "AI" ? "blue.600" : "black"}>
              <b>{msg.from}:</b> {msg.text}
            </Text>
          ))}
        </ScrollableFeed>
      </Box>
      <Box display="flex" gap={2}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
        />
        <Button colorScheme="blue" onClick={sendMessage} isLoading={loading}>
          Send
        </Button>
      </Box>
    </VStack>
  );
}