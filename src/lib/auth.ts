export interface DecodedAuthClaims {
  user_id?: number
  id_role?: number
  role_name?: string
  permissions?: string[]
  id_mitra?: number | null
  must_change_password?: boolean
  exp?: number
}

export function decodeJwt(token: string | null): DecodedAuthClaims | null {
  if (!token) return null

  try {
    const base64Url = token.split('.')[1] || ''
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(''),
    )

    return JSON.parse(jsonPayload)
  } catch (error) {
    return null
  }
}
