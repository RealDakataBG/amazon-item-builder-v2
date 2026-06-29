const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function fileToBase64(file) {
  if (file.size > MAX_FILE_SIZE) {
    return Promise.reject(new Error('Image is too large (max 5MB).'))
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const [meta, base64] = reader.result.split(',')
      const mediaType = meta.match(/data:(.*);base64/)?.[1] ?? file.type
      resolve({ base64, mediaType, previewUrl: reader.result })
    }
    reader.onerror = () => reject(new Error('Failed to read image file.'))
    reader.readAsDataURL(file)
  })
}
