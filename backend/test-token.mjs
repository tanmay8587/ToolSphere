import crypto from "crypto";

// Test the token generation and hashing
const verificationToken = crypto.randomBytes(32).toString("hex");
console.log("Generated token (plain):", verificationToken);
console.log("Token length:", verificationToken.length);

const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");
console.log("Hashed token:", hashedToken);
console.log("Hashed token length:", hashedToken.length);

// Test URL encoding
const urlToken = encodeURIComponent(verificationToken);
console.log("URL encoded token:", urlToken);

const decodedToken = decodeURIComponent(urlToken);
console.log("Decoded token:", decodedToken);

// Test if the tokens match
console.log("Tokens match:", verificationToken === decodedToken);

// Test hashing the decoded token
const hashedDecodedToken = crypto.createHash("sha256").update(decodedToken).digest("hex");
console.log("Hashed decoded token:", hashedDecodedToken);
console.log("Hashed tokens match:", hashedToken === hashedDecodedToken);

// Test with a token that has special characters
const specialToken = "test-token-with-special-chars-1234567890";
const urlSpecialToken = encodeURIComponent(specialToken);
console.log("\nSpecial token URL encoded:", urlSpecialToken);
const decodedSpecialToken = decodeURIComponent(urlSpecialToken);
console.log("Special token decoded:", decodedSpecialToken);
console.log("Special tokens match:", specialToken === decodedSpecialToken);