const dotenv = require('dotenv');
const fs = require('fs');

const envConfig = dotenv.parse(fs.readFileSync('.env'))
for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

const KIE_API_BASE = "https://api.kie.ai";
const kieApiKey = process.env.VITE_KIE_API_KEY || process.env.KIE_API_KEY;

async function check() {
    const taskId = '8d35d86aed6145097f5223f979964e53';
    const statusResponse = await fetch(
        `${KIE_API_BASE}/api/v1/jobs/recordInfo?taskId=${taskId}`,
        { headers: { "Authorization": `Bearer ${kieApiKey}` } }
    );
    const statusData = await statusResponse.json();
    console.log("State:", statusData.data?.state);
    if(statusData.data?.resultJson) {
        console.log("Result:", statusData.data.resultJson);
    }
}
check();
