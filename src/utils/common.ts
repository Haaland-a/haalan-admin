import CryptoJS from 'crypto-js'

export function encryptPassword(password: string): string {
  const key = CryptoJS.enc.Utf8.parse('haalan_seckill_2024_key')
  const iv = CryptoJS.enc.Utf8.parse('haalan_seckill_iv')
  return CryptoJS.AES.encrypt(password, key, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }).toString()
}

export function formatPrice(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return numPrice.toFixed(2)
}

export function formatTime(date: Date | number | string, format = 'YYYY-MM-DD HH:mm:ss'): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return format
    .replace('YYYY', String(year)).replace('MM', month).replace('DD', day)
    .replace('HH', hours).replace('mm', minutes).replace('ss', seconds)
}
