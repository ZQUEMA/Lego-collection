import { describe, expect, it } from 'vitest'
import { hasDriveScope } from './google'

describe('hasDriveScope', () => {
  it('reconnaît un jeton qui donne accès au dossier de l’app', () => {
    expect(hasDriveScope('email profile https://www.googleapis.com/auth/drive.appdata openid')).toBe(true)
  })

  it('refuse un jeton sans la case Drive cochée', () => {
    expect(hasDriveScope('email profile openid https://www.googleapis.com/auth/userinfo.email')).toBe(false)
    expect(hasDriveScope(undefined)).toBe(false)
  })
})
