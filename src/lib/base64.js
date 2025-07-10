// Base64エンコード・デコード用のユーティリティ
// 日本語文字を含む文字列を安全に処理

export function safeBase64Encode(str) {
  try {
    // TextEncoderを使って安全にエンコード
    const encoder = new TextEncoder()
    const data = encoder.encode(str)
    
    // Uint8ArrayをBase64に変換
    let binary = ''
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i])
    }
    
    return btoa(binary)
  } catch (error) {
    console.error('Base64 encode error:', error)
    throw new Error('Failed to encode data')
  }
}

export function safeBase64Decode(base64) {
  try {
    // Base64をデコード
    const binary = atob(base64)
    
    // バイナリ文字列をUint8Arrayに変換
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    
    // TextDecoderを使って安全にデコード
    const decoder = new TextDecoder()
    return decoder.decode(bytes)
  } catch (error) {
    console.error('Base64 decode error:', error)
    throw new Error('Failed to decode data')
  }
}