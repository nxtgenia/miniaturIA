const fetch = require('node-fetch');

const KIE_API_BASE = "https://api.kie.ai";
const kieApiKey = "829cd2d2053471505b30f196c5d5cc61";

async function testModel(modelName) {
    console.log(`\nTesting model: ${modelName}`);
    const createResponse = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${kieApiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: modelName,
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

    for (let i = 0; i < 5; i++) {
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
        } else if (statusData.data?.state === "fail") {
             break;
        }
    }
}

async function run() {
    await testModel("nano-banana-pro");
    await testModel("nano-banana-2");
}
run();
