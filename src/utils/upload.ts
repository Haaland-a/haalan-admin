import OSS from 'ali-oss'
import { getOssCredential } from '@/api/admin'

/**
 * 上传文件到阿里云OSS
 * @param file 文件对象
 * @param spuCode SPU编码，用于构建上传路径
 * @param skuCode SKU编码（可选），用于SKU图片的子路径
 * @returns 文件URL
 */
export async function uploadToOSS(file: File, spuCode: string, skuCode?: string): Promise<string> {
  try {
    const credentialRes = await getOssCredential(spuCode, skuCode)
    const credential = credentialRes.data

    const client = new OSS({
      region: credential.regionId,
      endpoint: credential.endpoint,
      accessKeyId: credential.accessKeyId,
      accessKeySecret: credential.accessKeySecret,
      stsToken: credential.securityToken,
      bucket: credential.bucketName,
      secure: true
    })

    // credential.filePrefix = "item/{spuCode}" 或 "item/{spuCode}/{skuCode}"
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${credential.filePrefix}/${timestamp}_${randomStr}.${fileExtension}`

    const result = await client.put(fileName, file)

    return result.url
  } catch (error) {
    console.error('OSS上传失败:', error)
    throw new Error('文件上传失败，请重试')
  }
}

export function validateImageFile(file: File, maxSize: number = 5): { valid: boolean; message?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: '只支持 JPG、PNG、GIF、WEBP 格式的图片' }
  }
  const maxBytes = maxSize * 1024 * 1024
  if (file.size > maxBytes) {
    return { valid: false, message: `图片大小不能超过 ${maxSize}MB` }
  }
  return { valid: true }
}
