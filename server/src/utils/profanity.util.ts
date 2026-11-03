// A basic, lightweight list of offensive words to filter
const badWords = [
  "fuck", "shit", "bitch", "asshole", "cunt", 
  "nigger", "faggot", "dick", "pussy", "slut", 
  "whore", "bastard", "cock", "retard"
];

export const filterProfanity = (text: string): string => {
  if (!text) return text;
  
  let filteredText = text;
  badWords.forEach((word) => {
    // Case-insensitive regex to catch whole words
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    filteredText = filteredText.replace(regex, (match) => "*".repeat(match.length));
  });

  return filteredText;
};