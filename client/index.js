import readline from 'readline/promises'
import { GoogleGenAI } from "@google/genai"

import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js"

import 'dotenv/config'


let tools = []
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });



// console.log("ai ::::::::::: ", ai)


const mcpClient = new Client({
    name: "example-client",
    version: "1.0.0",
})



const chatHistory = [];


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});



// Create a transport to connect to the client and the server
// Here we connect to the server using SSE and giving the mcp server url
mcpClient.connect(new SSEClientTransport(new URL("http://localhost:3001/sse")))
    .then(async () => {

        console.log("Connected to mcp server")

        tools = (await mcpClient.listTools()).tools.map(tool => {
            return {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: tool.inputSchema.type,
                    properties: tool.inputSchema.properties,
                    required: tool.inputSchema.required
                }
            }
        })
        console.log("Available tools : ", tools)
        chatLoop()


    })

async function chatLoop(toolCall) {


    if (toolCall) {

        console.log("calling tool ", toolCall.name)

        chatHistory.push({
            role: "model",
            parts: [
                {
                    text: `calling tool ${toolCall.name}`,
                    type: "text"
                }
            ]
        })

        const toolResult = await mcpClient.callTool({
            name: toolCall.name,
            arguments: toolCall.args
        })

        console.log("toolResult : ", toolResult)

        chatHistory.push({
            role: "user",
            parts: [
                {
                    text: "Tool result : " + toolResult.content[0].text,
                    type: "text"
                }
            ]
        })

        // After handling tool call, proceed with the chat without asking for input again
        await processAIResponse();
    }
    else {
        // Only ask for user input if not handling a tool call
        const question = await rl.question('You: ');
        chatHistory.push({
            role: "user",
            parts: [
                {
                    text: question,
                    type: "text"
                }
            ]
        })
        
        await processAIResponse();
    }

    async function processAIResponse() {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: chatHistory,
                config: {
                    tools: [
                        {
                            functionDeclarations: tools,
                        }
                    ]
                }
            });

            const responseData = response.candidates[0].content;
            console.log("Response data:", responseData);

            // Check if the response contains a function call
            if (responseData.parts[0].functionCall) {
                console.log("functionCall:", responseData.parts[0].functionCall);
                return chatLoop(responseData.parts[0].functionCall);
            }

            // Handle text response
            const responseText = responseData.parts[0].text || "";
            console.log(`AI: ${responseText}`);

            chatHistory.push({
                role: "model",
                parts: [
                    {
                        text: responseText,
                        type: "text"
                    }
                ]
            });

            // Continue the chat loop
            chatLoop();
        } catch (error) {
            console.error("Error processing AI response:", error);
            chatLoop(); // Continue despite error
        }
    }
}
