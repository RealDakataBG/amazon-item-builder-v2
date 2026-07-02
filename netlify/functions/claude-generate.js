export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { systemPrompt, userPrompt, image, schema, maxTokens } = JSON.parse(event.body)

    const content = image
      ? [
          { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.base64 } },
          { type: 'text', text: userPrompt },
        ]
      : userPrompt

    const requestBody = {
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens ?? 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    }

    if (schema) {
      requestBody.tools = [{ name: 'structured_output', description: 'Output the structured result', input_schema: schema }]
      requestBody.tool_choice = { type: 'tool', name: 'structured_output' }
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!res.ok) {
      const err = await res.text()
      return { statusCode: 502, body: JSON.stringify({ error: `Claude API error (${res.status}): ${err}` }) }
    }

    const data = await res.json()

    if (schema) {
      const toolBlock = data.content.find(b => b.type === 'tool_use')
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structured: toolBlock.input }),
      }
    }

    const text = data.content[0].text
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
