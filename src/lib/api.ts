
export async function fetchAnswer(
  prompt: string,
  param: string,
  filter: string,
): Promise<unknown> {
  const url = new URL('/answer/v1/answer', window.location.origin)
  url.searchParams.set('prompt', prompt)
  url.searchParams.set('param', param)
  url.searchParams.set('filter', filter)

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

export interface AddToolPayload {
  tool_description: string;
  table_name: string;
  columns: { name: string; type: string; description: string }[];
  query_examples: { description: string; query: string }[];
  param_name: string;
  param_type: string;
  param_description: string;
}

export async function addTool(payload: AddToolPayload): Promise<string> {
  const res = await fetch('/answer/v1/tool', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (res.status === 401) {
    throw new Error('unauthorized')
  }

  if (!res.ok) {
    throw new Error('request failed')
  }

  return res.text()
}

export function redirectToLogin() {
  window.location.href = '/auth/v1/get-permission'
}
