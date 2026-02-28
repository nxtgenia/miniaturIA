const dotenv = require('dotenv');
const fs = require('fs');

const envConfig = dotenv.parse(fs.readFileSync('.env'))
for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

const KIE_API_BASE = "https://api.kie.ai";
const kieApiKey = process.env.VITE_KIE_API_KEY || process.env.KIE_API_KEY;

async function test() {
    const createResponse = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${kieApiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "nano-banana-2",
            input: {
                prompt: "a futuristic car @fil1",
                image_input: ["https://files.catbox.moe/hil6of.png"],
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

    for (let i = 0; i < 20; i++) {
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
    }
}
test();
