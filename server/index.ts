import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import cors from 'cors';
import ytSearch from 'yt-search';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory store for kie.ai callback results
// taskId → { state, url?, error? }
const kieTaskResults = new Map<string, { state: string; url?: string; error?: string }>();

// CORS configuration (allow requests from the frontend flexibly)
app.use(cors({
    origin: (origin, callback) => {
        // Permitir solicitudes sin origen (como curl o webhooks de Stripe) o cualquier origen Vercel/localhost
        if (!origin || origin.includes('localhost') || origin.includes('miniatur-ia.com') || origin.includes('vercel.app') || origin === process.env.FRONTEND_URL) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
});

// Supabase admin client (uses service role key for webhook operations)
const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// PRODUCT / PRICE CONFIGURATION
// ============================================

// Subscription plans
const SUBSCRIPTION_PLANS = {
    starter_monthly: { name: 'Starter Mensual', price: 1999, credits: 400, interval: 'month' as const },
    starter_annual: { name: 'Starter Anual', price: 19900, credits: 4500, interval: 'year' as const },
    pro_monthly: { name: 'Pro Mensual', price: 3999, credits: 900, interval: 'month' as const },
    pro_annual: { name: 'Pro Anual', price: 39900, credits: 9000, interval: 'year' as const },
    agency_monthly: { name: 'Agency Mensual', price: 7999, credits: 1800, interval: 'month' as const },
    agency_annual: { name: 'Agency Anual', price: 79900, credits: 18000, interval: 'year' as const },
};

// Credit packs (one-time purchases)
const CREDIT_PACKS = {
    micro: { name: 'Pack Micro', price: 499, credits: 50 },
    basic: { name: 'Pack Basic', price: 799, credits: 100 },
    plus: { name: 'Pack Plus', price: 1499, credits: 250 },
    boost: { name: 'Pack Boost', price: 2499, credits: 500 },
    ultra: { name: 'Pack Ultra', price: 4499, credits: 1000 },
};

// Store created Stripe price IDs (populated on first run)
let stripePriceIds: Record<string, string> = {};

// ============================================
// INITIALIZE STRIPE PRODUCTS
// ============================================

async function initializeStripeProducts() {
    console.log('🔧 Initializing Stripe products...');

    // Check for existing products
    const existingProducts = await stripe.products.list({ limit: 100, active: true });
    const existingPrices = await stripe.prices.list({ limit: 100, active: true });

    // Create subscription products
    for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
        const existingProduct = existingProducts.data.find(p => p.metadata?.plan_key === key);

        let product: Stripe.Product;
        if (existingProduct) {
            product = existingProduct;
            // Find existing price
            const existingPrice = existingPrices.data.find(
                p => p.product === product.id && p.unit_amount === plan.price && p.recurring?.interval === plan.interval
            );
            if (existingPrice) {
                stripePriceIds[key] = existingPrice.id;
                console.log(`  ✅ ${plan.name} ya existe (${existingPrice.id})`);
                continue;
            }
        } else {
            product = await stripe.products.create({
                name: `MiniaturIA ${plan.name}`,
                metadata: { plan_key: key, credits: plan.credits.toString() },
            });
        }

        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.price,
            currency: 'eur',
            recurring: { interval: plan.interval },
            metadata: { plan_key: key, credits: plan.credits.toString() },
        });

        stripePriceIds[key] = price.id;
        console.log(`  ✅ ${plan.name}: ${price.id}`);
    }

    // Create credit pack products
    for (const [key, pack] of Object.entries(CREDIT_PACKS)) {
        const packKey = `pack_${key}`;
        const existingProduct = existingProducts.data.find(p => p.metadata?.plan_key === packKey);

        let product: Stripe.Product;
        if (existingProduct) {
            product = existingProduct;
            const existingPrice = existingPrices.data.find(
                p => p.product === product.id && p.unit_amount === pack.price && !p.recurring
            );
            if (existingPrice) {
                stripePriceIds[packKey] = existingPrice.id;
                console.log(`  ✅ ${pack.name} ya existe (${existingPrice.id})`);
                continue;
            }
        } else {
            product = await stripe.products.create({
                name: `MiniaturIA ${pack.name}`,
                metadata: { plan_key: packKey, credits: pack.credits.toString() },
            });
        }

        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: pack.price,
            currency: 'eur',
            metadata: { plan_key: packKey, credits: pack.credits.toString() },
        });

        stripePriceIds[packKey] = price.id;
        console.log(`  ✅ ${pack.name}: ${price.id}`);
    }

    console.log('✅ Stripe products ready!');
}

// ============================================
// ROUTES
// ============================================

// IMPORTANT: Webhook route must use raw body parser
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
        if (webhookSecret && webhookSecret !== 'whsec_TU_WEBHOOK_SECRET_AQUI') {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
            // For development without webhook secret
            event = JSON.parse(req.body.toString());
            console.log('⚠️  Webhook sin verificar (development mode)');
        }
    } catch (err: any) {
        console.error(`❌ Webhook signature verification failed [${sig?.substring(0, 10)}...]:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`📩 Webhook Event Received: ${event.type} [ID: ${event.id}]`);

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutComplete(session);
                break;
            }
            case 'invoice.paid': {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaid(invoice);
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdated(subscription);
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subscription);
                break;
            }
        }
    } catch (err) {
        console.error(`❌ Webhook handler error for ${event.type}:`, err);
        return res.status(500).json({ error: 'Internal handler error' });
    }

    res.json({ received: true });
});

// JSON parser for other routes
app.use(express.json({ limit: '50mb' }));

// Memory cache for proxying images to Kie.ai
const imageCache = new Map<string, { buffer: Buffer, mime: string, expires: number }>();
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of imageCache.entries()) {
        if (now > value.expires) imageCache.delete(key);
    }
}, 60000); // Cleanup every minute

app.get('/api/cached-image/:id', (req, res) => {
    const img = imageCache.get(req.params.id);
    if (!img) return res.status(404).send('Not found or expired');
    res.setHeader('Content-Type', img.mime);
    res.send(img.buffer);
});

app.get('/api/proxy-image', async (req, res) => {
    try {
        const imageUrl = req.query.url as string;
        if (!imageUrl) {
            return res.status(400).send('Missing url parameter');
        }

        if (!imageUrl.startsWith('https://')) {
            return res.status(400).send('Only HTTPS URLs are allowed');
        }

        try {
            const urlObj = new URL(imageUrl);
            const allowedDomains = ['tmpfiles.org', 'img.youtube.com', 'i.ytimg.com', 'googleapis.com', 'catbox.moe', 'aiquickdraw.com'];
            if (!allowedDomains.some(d => urlObj.hostname.endsWith(d))) {
                return res.status(403).send('Domain not allowed');
            }
        } catch (e) {
            return res.status(400).send('Invalid URL');
        }

        const response = await fetch(imageUrl);
        if (!response.ok) {
            return res.status(response.status).send(`Failed to fetch image: ${response.statusText}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        res.setHeader('Content-Type', response.headers.get('content-type') || 'image/png');
        res.setHeader('Content-Length', buffer.length.toString());
        res.end(buffer);
    } catch (err: any) {
        res.status(500).send(`Proxy error: ${err.message}`);
    }
});

app.post('/api/upload-image', async (req, res) => {
    try {
        const dataUri = req.body.dataUri;

        if (!dataUri) {
            return res.status(400).json({ error: 'Missing dataUri' });
        }

        if (dataUri.startsWith('http')) {
            return res.json({ url: dataUri });
        }

        const matches = dataUri.match(/^data:(.+?);base64,(.+)$/);
        if (!matches) {
            return res.status(400).json({ error: 'Invalid data URI' });
        }

        const mime = matches[1];
        const imageBuffer = Buffer.from(matches[2], 'base64');

        const id = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
        imageCache.set(id, { buffer: imageBuffer, mime, expires: Date.now() + 5 * 60 * 1000 }); // Expires in 5 minutes

        // Get server URL to construct the public link
        const serverUrl = process.env.SERVER_URL || process.env.RENDER_EXTERNAL_URL || `${req.protocol}://${req.get('host')}`;
        const url = `${serverUrl}/api/cached-image/${id}`;

        res.json({ url });
    } catch (err: any) {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/youtube-search', async (req, res) => {
    try {
        const query = req.query.q as string;
        const page = parseInt(req.query.page as string || '1', 10);
        const pageSize = 12;

        if (!query) {
            return res.status(400).json({ error: 'Missing query parameter' });
        }

        const searchQuery = page > 1 ? `${query} ${page}` : query;
        const result = await ytSearch(searchQuery);

        const allVideos = result.videos.map(v => ({
            id: v.videoId,
            title: v.title,
            author: v.author.name,
            views: v.views,
            thumbnail: `https://img.youtube.com/vi/${v.videoId}/maxresdefault.jpg`,
            url: v.url
        }));

        const start = 0;
        const videos = allVideos.slice(start, pageSize);
        const hasMore = allVideos.length > pageSize || page < 5;

        res.json({ videos, page, hasMore, totalResults: allVideos.length });
    } catch (err: any) {
        console.error('YouTube Search error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Middleware to verify Supabase Auth token
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    (req as any).user = user;
    next();
};

// Callback endpoint: kie.ai POSTs here when a task completes (no auth needed, called by kie.ai)
app.post('/api/kie-callback', async (req, res) => {
    try {
        const data = req.body?.data;
        const taskId = data?.taskId;
        if (!taskId) return res.sendStatus(200);

        if (data.state === 'success') {
            const resultJson = JSON.parse(data.resultJson || '{}');
            const url = resultJson.resultUrls?.[0];
            kieTaskResults.set(taskId, { state: 'success', url });
        } else if (data.state === 'fail') {
            kieTaskResults.set(taskId, { state: 'fail', error: data.failMsg || 'Generation failed' });
        }

        res.sendStatus(200);
    } catch {
        res.sendStatus(200); // Always 200 so kie.ai doesn't retry
    }
});

// Step 1: Create the generation task and return taskId immediately (no blocking)
app.post('/api/start-generation', authenticateUser, async (req, res) => {
    try {
        const { fullPrompt, imageUrls } = req.body;
        const kieApiKey = process.env.KIE_API_KEY || process.env.VITE_KIE_API_KEY;
        const KIE_API_BASE = "https://api.kie.ai";
        const serverUrl = process.env.SERVER_URL || process.env.RENDER_EXTERNAL_URL;

        if (!kieApiKey) {
            return res.status(500).json({ error: 'KIE_API_KEY is not configured on the server' });
        }
        if (!fullPrompt || !imageUrls || !Array.isArray(imageUrls)) {
            return res.status(400).json({ error: 'Missing fullPrompt or imageUrls' });
        }

        const body: any = {
            model: "nano-banana-2",
            input: {
                prompt: fullPrompt,
                image_input: imageUrls,
                aspect_ratio: "16:9",
                resolution: "1K",
                output_format: "jpg",
            },
        };

        if (serverUrl) {
            body.callBackUrl = `${serverUrl}/api/kie-callback`;
        }

        const createResponse = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${kieApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!createResponse.ok) {
            const errorData = await createResponse.json().catch(() => ({}));
            throw new Error(`Kie.ai error (${createResponse.status}): ${errorData?.msg || createResponse.statusText}`);
        }

        const createData = await createResponse.json();
        if (createData.code !== 200) {
            throw new Error(`Kie.ai error: ${createData.msg || "Unknown error"}`);
        }

        const taskId = createData.data?.taskId;
        if (!taskId) {
            throw new Error("Kie.ai response missing taskId");
        }

        return res.json({ taskId });
    } catch (err: any) {
        console.error('Start generation error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Step 2: Check generation status — returns callback result instantly if available, otherwise polls kie.ai
app.get('/api/generation-status/:taskId', authenticateUser, async (req, res) => {
    try {
        const { taskId } = req.params;

        // Fast path: callback already arrived
        const cached = kieTaskResults.get(taskId);
        if (cached) {
            kieTaskResults.delete(taskId); // free memory once delivered
            return res.json(cached);
        }

        // Fallback: poll kie.ai directly
        const kieApiKey = process.env.KIE_API_KEY || process.env.VITE_KIE_API_KEY;
        const KIE_API_BASE = "https://api.kie.ai";

        if (!kieApiKey) {
            return res.status(500).json({ error: 'KIE_API_KEY is not configured on the server' });
        }

        const statusResponse = await fetch(
            `${KIE_API_BASE}/api/v1/jobs/recordInfo?taskId=${taskId}`,
            { headers: { "Authorization": `Bearer ${kieApiKey}` } }
        );

        if (!statusResponse.ok) {
            return res.status(statusResponse.status).json({ error: 'Error checking status' });
        }

        const statusData = await statusResponse.json();
        const state = statusData.data?.state;

        if (state === "fail") {
            return res.json({ state: 'fail', error: statusData.data?.failMsg || 'Generation failed' });
        }

        if (state === "success") {
            const resultJsonStr = statusData.data?.resultJson;
            if (!resultJsonStr) return res.json({ state: 'fail', error: 'No result found' });

            const resultJson = JSON.parse(resultJsonStr);
            if (resultJson.resultUrls?.length > 0) {
                return res.json({ state: 'success', url: resultJson.resultUrls[0] });
            }
            return res.json({ state: 'fail', error: 'No image URLs found' });
        }

        return res.json({ state: 'waiting' });
    } catch (err: any) {
        console.error('Status check error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create checkout session
app.post('/api/create-checkout-session', authenticateUser, async (req, res) => {
    const { planKey, userId, userEmail, successUrl, cancelUrl } = req.body;

    if (!planKey || !userId) {
        return res.status(400).json({ error: 'Missing planKey or userId' });
    }

    // Ensure the authenticated user matches the requested user
    if ((req as any).user.id !== userId) {
        return res.status(403).json({ error: 'Forbidden: userId mismatch' });
    }

    const priceId = stripePriceIds[planKey];
    if (!priceId) {
        return res.status(400).json({ error: `Plan "${planKey}" not found` });
    }

    const isSubscription = !planKey.startsWith('pack_');

    try {
        // Find or create Stripe customer
        let customerId: string;
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();

        if (profile?.stripe_customer_id) {
            customerId = profile.stripe_customer_id;
        } else {
            const customer = await stripe.customers.create({
                email: userEmail,
                metadata: { supabase_user_id: userId },
            });
            customerId = customer.id;

            // Save customer ID to profile
            await supabaseAdmin
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', userId);
        }

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: isSubscription ? 'subscription' : 'payment',
            success_url: successUrl || `${req.headers.origin || process.env.FRONTEND_URL || 'https://miniatur-ia.com'}/app?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${req.headers.origin || process.env.FRONTEND_URL || 'https://miniatur-ia.com'}/app?payment=cancelled`,
            metadata: {
                supabase_user_id: userId,
                plan_key: planKey,
            },
        };

        // For subscriptions, pass metadata to subscription too
        if (isSubscription) {
            sessionParams.subscription_data = {
                metadata: {
                    supabase_user_id: userId,
                    plan_key: planKey,
                },
            };
        }

        const session = await stripe.checkout.sessions.create(sessionParams);
        res.json({ url: session.url });
    } catch (err: any) {
        console.error('❌ Checkout error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Manual payment confirmation (Verification Fallback)
app.post('/api/confirm-payment', authenticateUser, async (req, res) => {
    const { sessionId: bodySessionId } = req.body;
    const userId = (req as any).user.id;
    let sessionId = bodySessionId;

    console.log(`🔍 Verifying payment for user ${userId}...`);

    try {
        if (!sessionId) {
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('stripe_customer_id')
                .eq('id', userId)
                .single();

            if (profile?.stripe_customer_id) {
                const sessions = await stripe.checkout.sessions.list({
                    customer: profile.stripe_customer_id,
                    limit: 1
                });
                if (sessions.data.length > 0) sessionId = sessions.data[0].id;
            }
        }

        if (!sessionId) return res.status(400).json({ error: 'No session found' });

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription', 'subscription.latest_invoice'],
        });

        if (session.metadata?.supabase_user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized session access' });
        }

        if (session.payment_status === 'paid') {
            if (session.mode === 'payment') {
                await handleCheckoutComplete(session);
            } else if (session.mode === 'subscription' && session.subscription) {
                const sub = session.subscription as Stripe.Subscription;
                const inv = sub.latest_invoice as Stripe.Invoice;
                if (inv && inv.status === 'paid') await handleInvoicePaid(inv);
            }
            return res.json({ success: true, status: 'paid' });
        }

        res.json({ success: false, status: session.payment_status });
    } catch (err: any) {
        console.error('❌ Verification error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user's subscription status
app.get('/api/subscription-status/:userId', authenticateUser, async (req, res) => {
    const { userId } = req.params;

    if ((req as any).user.id !== userId) {
        return res.status(403).json({ error: 'Forbidden: userId mismatch' });
    }

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('credits, plan, plan_period, stripe_subscription_id')
        .eq('id', userId)
        .single();

    if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
});

// Customer portal (manage subscription)
app.post('/api/customer-portal', authenticateUser, async (req, res) => {
    const { userId } = req.body;

    if ((req as any).user.id !== userId) {
        return res.status(403).json({ error: 'Forbidden: userId mismatch' });
    }

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

    if (!profile?.stripe_customer_id) {
        return res.status(400).json({ error: 'No Stripe customer found' });
    }

    try {
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: `${req.headers.origin}/app`,
        });
        res.json({ url: portalSession.url });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// WEBHOOK HANDLERS
// ============================================

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.supabase_user_id;
    const planKey = session.metadata?.plan_key;

    if (!userId || !planKey) {
        console.error('❌ Missing metadata in checkout session:', session.id);
        return;
    }

    const transactionDesc = planKey.startsWith('pack_')
        ? `Compra: ${planKey.replace('pack_', '')} (Session: ${session.id})`
        : `Suscripción: ${planKey} (Session: ${session.id})`;

    // Idempotency: check if transaction exists
    const { data: existing } = await supabaseAdmin
        .from('credit_transactions')
        .select('id')
        .eq('description', transactionDesc)
        .maybeSingle();

    if (existing) {
        console.log(`ℹ️ Session ${session.id} already processed. Skipping.`);
        return;
    }

    console.log(`✅ Processing checkout: user=${userId}, plan=${planKey} (Session: ${session.id})`);

    // Credit pack purchase (one-time)
    if (planKey.startsWith('pack_')) {
        const packName = planKey.replace('pack_', '') as keyof typeof CREDIT_PACKS;
        const pack = CREDIT_PACKS[packName];
        if (!pack) return;

        // Add credits manually in JS (to avoid RPC dependent failures)
        const { data: profile } = await supabaseAdmin.from('profiles').select('credits').eq('id', userId).single();
        const newCredits = (profile?.credits || 0) + pack.credits;

        const { error: updateError } = await supabaseAdmin.from('profiles').update({ credits: newCredits }).eq('id', userId);

        if (updateError) {
            console.error(`❌ Error adding credits for user ${userId}:`, updateError);
        } else {
            console.log(`  💰 Added ${pack.credits} credits to user ${userId}`);

            // Register transaction log
            await supabaseAdmin.from('credit_transactions').insert({
                user_id: userId,
                amount: pack.credits,
                type: 'purchase',
                description: transactionDesc
            });
        }
    }
    // Subscription mode is usually followed by invoice.paid, so subscriptions handled there
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
    const subscriptionId = (invoice as any).subscription as string;
    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.supabase_user_id;
    const planKey = subscription.metadata?.plan_key;

    if (!userId || !planKey) {
        console.error('❌ Missing metadata in subscription:', subscriptionId);
        return;
    }

    const plan = SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan) return;

    const transactionDesc = `Renovación: ${plan.name} (Invoice: ${invoice.id})`;

    // Idempotency check
    const { data: existing } = await supabaseAdmin
        .from('credit_transactions')
        .select('id')
        .eq('description', transactionDesc)
        .maybeSingle();

    if (existing) {
        console.log(`ℹ️ Invoice ${invoice.id} already processed. Skipping.`);
        return;
    }

    const planName = planKey.split('_')[0];
    const planPeriod = planKey.split('_')[1];

    // 1. Update status metadata (plan, period, subscription_id)
    await supabaseAdmin
        .from('profiles')
        .update({
            plan: planName,
            plan_period: planPeriod,
            stripe_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

    // 2. Add credits
    const { data: profile } = await supabaseAdmin.from('profiles').select('credits').eq('id', userId).single();
    const newCredits = (profile?.credits || 0) + plan.credits;

    const { error: updateError } = await supabaseAdmin.from('profiles').update({ credits: newCredits }).eq('id', userId);

    if (updateError) {
        console.error(`❌ Error adding renewal credits for user ${userId}:`, updateError);
    } else {
        console.log(`  💎 Subscription renewed and credits ADDED: ${plan.name} (+${plan.credits}) for user ${userId} (Invoice: ${invoice.id})`);

        // Register transaction log
        await supabaseAdmin.from('credit_transactions').insert({
            user_id: userId,
            amount: plan.credits,
            type: 'purchase',
            description: transactionDesc
        });
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.supabase_user_id;
    if (!userId) return;

    if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
        console.log(`⚠️  Subscription ${subscription.id} is ${subscription.status}`);
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.supabase_user_id;
    if (!userId) return;

    // Downgrade to free
    await supabaseAdmin
        .from('profiles')
        .update({
            plan: 'free',
            plan_period: null,
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

    console.log(`  ❌ Subscription cancelled for user ${userId}, downgraded to free`);
}

// ============================================
// START SERVER
// ============================================

async function start() {
    try {
        await initializeStripeProducts();
    } catch (err) {
        console.error('⚠️  Could not initialize Stripe products:', err);
        console.log('   Server will start anyway, but checkout may not work.');
    }

    app.listen(PORT, () => {
        console.log(`\n🚀 MiniaturIA API server running on http://localhost:${PORT}`);
    });
}

start();
