const APIFY_BASE = 'https://api.apify.com/v2'

async function createTask(taskBody, apiKey) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const body = attempt === 0
      ? taskBody
      : { ...taskBody, name: taskBody.name.replace(/\d+$/, '') + (Math.floor(Math.random() * 1000) + 1) }

    const res = await fetch(`${APIFY_BASE}/actor-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (res.status === 409 && attempt < 4) continue
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Task creation failed (${res.status}): ${text}`)
    }
    const data = await res.json()
    return data.data.id
  }
  throw new Error('Failed to create Apify task after 5 attempts (name conflict)')
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { taskBody } = JSON.parse(event.body)
    const apiKey = process.env.APIFY_API_KEY

    const taskId = await createTask(taskBody, apiKey)

    const runRes = await fetch(`${APIFY_BASE}/actor-tasks/${taskId}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({}),
    })

    if (!runRes.ok) {
      const text = await runRes.text()
      return { statusCode: 502, body: JSON.stringify({ error: `Run start failed: ${text}` }) }
    }

    const runData = await runRes.json()
    const runId = runData.data.id

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, runId }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
