import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const kieApiKey = process.env.KIE_API_KEY || process.env.VITE_KIE_API_KEY;
const KIE_API_BASE = "https://api.kie.ai";

async function testNanoPro() {
    console.log("Testing nano-banana-pro model...");
    const createResponse = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${kieApiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "nano-banana-pro",
            input: {
                prompt: "A test prompt for image generation",
                aspect_ratio: "16:9",
                resolution: "1K",
                output_format: "png",
            },
        }),
    });

    const createData = await createResponse.json();
    console.log("Response:", JSON.stringify(createData, null, 2));
}

testNanoPro();
