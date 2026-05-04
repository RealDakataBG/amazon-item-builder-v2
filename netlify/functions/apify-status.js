const APIFY_BASE = 'https://api.apify.com/v2'

export const handler = async (event) => {
  const { taskId, runId } = event.queryStringParameters || {}

  if (!taskId || !runId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing taskId or runId' }) }
  }

  try {
    const res = await fetch(`${APIFY_BASE}/actor-tasks/${taskId}/runs/${runId}`, {
      headers: { Authorization: `Bearer ${process.env.APIFY_API_KEY}` },
    })

    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: `Apify status check failed: ${res.status}` }) }
    }

    const data = await res.json()
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: data.data.status, finishedAt: data.data.finishedAt }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
