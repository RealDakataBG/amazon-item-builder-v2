import crypto from 'node:crypto'

const TEMPLATE_ID = '1FsxYvYaOKK8GWsnts4_CpHP8xzEH8pHo4yf6iBSXkqM'
const DEST_FOLDER_ID = '14VMfZplbMVffi9IyTvnc44-ydf2TGRFm'

function base64url(str) {
  return Buffer.from(str).toString('base64url')
}

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }))
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(`${header}.${payload}`)
  const sig = sign.sign(sa.private_key, 'base64url')
  const jwt = `${header}.${payload}.${sig}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`Google auth failed: ${JSON.stringify(data)}`)
  return data.access_token
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { title, bullets, description, keywords, productName, clientIdentifier } = JSON.parse(event.body)

    const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
    const token = await getAccessToken(sa)

    const sheetName = `${productName} ${clientIdentifier}`

    // Copy the template spreadsheet into the fixed destination folder
    const copyBody = { name: sheetName, parents: [DEST_FOLDER_ID] }

    const copyRes = await fetch(`https://www.googleapis.com/drive/v3/files/${TEMPLATE_ID}/copy`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(copyBody),
    })
    if (!copyRes.ok) {
      const err = await copyRes.json()
      throw new Error(`Failed to copy template: ${err?.error?.message || copyRes.status}`)
    }
    const { id: newFileId } = await copyRes.json()

    // Write outputs to the new sheet
    const batchRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${newFileId}/values:batchUpdate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valueInputOption: 'RAW',
        data: [
          { range: 'D6',  values: [[title]] },
          { range: 'C14', values: [[bullets]] },
          { range: 'C18', values: [[description]] },
          { range: 'C23', values: [[keywords]] },
        ],
      }),
    })
    if (!batchRes.ok) {
      const err = await batchRes.json()
      throw new Error(`Failed to write cells: ${err?.error?.message || batchRes.status}`)
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: `https://docs.google.com/spreadsheets/d/${newFileId}` }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
