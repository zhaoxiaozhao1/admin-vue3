import compression from 'vite-plugin-compression2'

export default function createCompression(env) {
  const { VITE_BUILD_COMPRESS } = env
  const plugin = []
  if (VITE_BUILD_COMPRESS) {
    const compressList = VITE_BUILD_COMPRESS.split(',')
    if (compressList.includes('gzip')) {
      plugin.push(
        compression({
          algorithm: 'gzip',
          exclude: [/\.(br)$/i, /\.(gz)$/i]
        })
      )
    }
    if (compressList.includes('brotli')) {
      plugin.push(
        compression({
          algorithm: 'brotliCompress',
          exclude: [/\.(br)$/i, /\.(gz)$/i]
        })
      )
    }
  }
  return plugin
}
