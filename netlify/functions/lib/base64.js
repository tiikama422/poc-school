// Base64エンコード・デコード用のユーティリティ（Node.js版）
// 日本語文字を含む文字列を安全に処理

function safeBase64Encode(str) {
  try {
    // Node.jsのBufferを使って安全にエンコード
    return Buffer.from(str, 'utf8').toString('base64')
  } catch (error) {
    console.error('Base64 encode error:', error)
    throw new Error('Failed to encode data')
  }
}

function safeBase64Decode(base64) {
  try {
    // Node.jsのBufferを使って安全にデコード
    return Buffer.from(base64, 'base64').toString('utf8')
  } catch (error) {
    console.error('Base64 decode error:', error)
    throw new Error('Failed to decode data')
  }
}

module.exports = {
  safeBase64Encode,
  safeBase64Decode
}