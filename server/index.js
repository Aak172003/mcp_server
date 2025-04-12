import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { createPost } from "./mcp.tools.js";

const server = new McpServer({
    name: "example-server",
    version: "1.0.0"
});

// ... set up server resources, tools, and prompts ...

const app = express();


server.tool("addTwoNumbers", "Add two numbers",
    {
        a: z.number(),
        b: z.number(),
    },
    async (arg) => {
        const { a, b } = arg;
        return {
            content: [
                {
                    type: "text",
                    text: `The sum of ${a} and ${b} is ${a + b}`
                }
            ]
        }

    }

);


server.tool(
    "createPost",
    "Create a post on X formally known as Twitter",
    {
        status: z.string(),
    },
    async (arg) => {

        console.log("111111111111111111111111111111111")
        const { status } = arg;
        console.log("222222222222222222222222222222222" , status)
        return createPost(status);
    }
);


// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports = {};


app.get("/", (req, res) => {
    res.send("Hello World");
});

// in this example we use SSE to send messages to the client from the server
app.get("/sse", async (req, res) => {
    const transport = new SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;
    res.on("close", () => {
        delete transports[transport.sessionId];
    });
    await server.connect(transport);
});

// in this example we use POST to send messages to the server from the client
app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId;
    const transport = transports[sessionId];
    if (transport) {
        await transport.handlePostMessage(req, res);
    } else {
        res.status(400).send('No transport found for sessionId');
    }
});

app.listen(3001, () => {
    console.log("Server is running on port http://localhost:3001");
});