const APIFY_BASE = 'https://api.apify.com/v2'

export const handler = async (event) => {
  const { taskId, runId } = event.queryStringParameters || {}

  if (!taskId || !runId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing taskId or runId' }) }
  }

  try {
    const res = await fetch(
      `${APIFY_BASE}/actor-tasks/${taskId}/runs/${runId}/dataset/items`,
      { headers: { Authorization: `Bearer ${process.env.APIFY_API_KEY}` } }
    )

    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: `Failed to fetch dataset: ${res.status}` }) }
    }

    const items = await res.json()
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
