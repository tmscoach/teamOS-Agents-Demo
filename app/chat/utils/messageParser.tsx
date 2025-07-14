import React from 'react';

/**
 * Parses a message and applies gradient styling to occurrences of the agent name
 * @param content - The message content to parse
 * @param agentName - The agent name to highlight (default: "OSmos")
 * @returns Array of React elements with styled agent names
 */
export function parseMessageWithAgentName(content: string, agentName: string = "OSmos") {
  // Create a regex that matches the agent name case-insensitively
  // Using word boundaries to match whole words only
  const regex = new RegExp(`\\b(${agentName})\\b`, 'gi');
  
  // Split the content by the agent name, keeping the matched parts
  const parts = content.split(regex);
  
  return parts.map((part, index) => {
    // Check if this part matches the agent name (case-insensitive)
    if (part.toLowerCase() === agentName.toLowerCase()) {
      return (
        <span 
          key={index}
          className="font-semibold bg-clip-text text-transparent"
          style={{
            backgroundImage: 'linear-gradient(to right, #FFF303 0%, #FBA93D 15%, #ED0191 30%, #A763AD 45%, #0185C6 60%, #02B5E6 75%, #01A172 90%, #A2D36F 100%)'
          }}
        >
          {part}
        </span>
      );
    }
    
    // Return regular text for non-matching parts
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * Gradient configurations for different agents
 * Can be extended to support multiple agents with different styles
 */
export const agentGradients = {
  OSmos: 'linear-gradient(to right, #FFF303 0%, #FBA93D 15%, #ED0191 30%, #A763AD 45%, #0185C6 60%, #02B5E6 75%, #01A172 90%, #A2D36F 100%)',
  // Add more agents and their gradients here as needed
};

/**
 * Enhanced parser that supports multiple agents with different gradients
 */
export function parseMessageWithMultipleAgents(content: string, agents: Record<string, string> = agentGradients) {
  // Create a regex pattern that matches any of the agent names
  const agentNames = Object.keys(agents).join('|');
  const regex = new RegExp(`\\b(${agentNames})\\b`, 'gi');
  
  const parts = content.split(regex);
  
  return parts.map((part, index) => {
    // Check if this part matches any agent name
    const matchedAgent = Object.keys(agents).find(
      agent => part.toLowerCase() === agent.toLowerCase()
    );
    
    if (matchedAgent) {
      return (
        <span 
          key={index}
          className="font-semibold bg-clip-text text-transparent"
          style={{
            backgroundImage: agents[matchedAgent]
          }}
        >
          {part}
        </span>
      );
    }
    
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}