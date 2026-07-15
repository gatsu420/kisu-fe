
export async function fetchAnswer(
  prompt: string,
  param: string,
): Promise<unknown> {
  const url = new URL('/answer/v1/answer', window.location.origin)
  url.searchParams.set('prompt', prompt)
  url.searchParams.set('param', param)

  const res = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
  })

  if (res.status === 401) {
    throw new Error('unauthorized')
  }

  if (!res.ok) {
    throw new Error('request failed')
  }

  return res.json()
}

export function redirectToLogin() {
  window.location.href = '/auth/v1/get-permission'
}
