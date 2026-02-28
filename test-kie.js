const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const KIE_API_BASE = "https://api.kie.ai";
const kieApiKey = process.env.VITE_KIE_API_KEY || process.env.KIE_API_KEY;

async function test() {
    console.log("Using API Key:", kieApiKey.substring(0, 5) + "...");
    const createResponse = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${kieApiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "nano-banana-pro",
            input: {
                prompt: "a futuristic car @fil1",
                image_input: [
                    "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png", 
                ],
                aspect_ratio: "16:9",
                resolution: "1K",
                output_format: "png",
            },
        }),
    });
    const createData = await createResponse.json();
    console.log("Create Data:", createData);

    const taskId = createData.data?.taskId;
    if (!taskId) return;

    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const statusResponse = await fetch(
            `${KIE_API_BASE}/api/v1/jobs/recordInfo?taskId=${taskId}`,
            { headers: { "Authorization": `Bearer ${kieApiKey}` } }
        );
        const statusData = await statusResponse.json();
        console.log(`Poll ${i}: state=${statusData.data?.state} failMsg=${statusData.data?.failMsg}`);
        if (statusData.data?.state === "success") {
            console.log("Result:", statusData.data.resultJson);
            break;
        }
        if (statusData.data?.state === "fail") {
            break;
        }
    }
}
test();
