import { useState } from 'react'
import type { FormEvent } from 'react'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const endpoint = (path: string) => `${apiBaseUrl}${path}`

type ReceivedCookie = { name: string; value: string; httpOnly: boolean }
type Inspection = { receivedCookies: ReceivedCookie[]; note: string }
type CookieActionResponse = { message: string }

function readVisibleCookies(): Record<string, string> {
  return Object.fromEntries(document.cookie.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf('=')
    const key = index < 0 ? part : part.slice(0, index)
    const value = index < 0 ? '' : part.slice(index + 1)
    return [decodeURIComponent(key), decodeURIComponent(value)]
  }))
}

export default function App() {
  const [visibleCookies, setVisibleCookies] = useState<Record<string, string>>({})
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function refreshVisibleCookies() { setVisibleCookies(readVisibleCookies()) }

  async function request(path: string, method: 'GET' | 'POST' = 'GET') {
    setLoading(true); setError(''); setStatus('')
    try {
      const response = await fetch(endpoint(path), { method, credentials: 'include' })
      if (!response.ok) throw new Error(`Backend вернул HTTP ${response.status}`)
      const data = await response.json() as CookieActionResponse | Inspection
      if ('receivedCookies' in data) setInspection(data)
      else setStatus(data.message)
      refreshVisibleCookies()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Запрос не выполнен')
    } finally { setLoading(false) }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void request('/api/cookies/set', 'POST')
  }

  return (
    <main className="layout">
      <header className="hero">
        <p className="eyebrow">BROWSER STORAGE · HTTP · SPRING BOOT</p>
        <h1>Cookie <span>Lab</span></h1>
        <p className="lead">Исследуй, где живут cookies, кто может их читать и почему HttpOnly-cookie не появляется в JavaScript.</p>
      </header>
      <section className="panel controls">
        <div><p className="step">01 / УСТАНОВИТЬ</p><h2>Попросить backend установить cookies</h2><p>Сервер пришлёт два заголовка Set-Cookie: обычную cookie и cookie с флагом HttpOnly.</p></div>
        <form onSubmit={submit}><button disabled={loading}>Установить cookies <span>↗</span></button></form>
      </section>
      <div className="grid">
        <section className="panel">
          <p className="step">02 / JAVASCRIPT</p><h2>Что видит React</h2>
          <p><code>document.cookie</code> доступен только для cookie текущего сайта и не показывает HttpOnly-cookie.</p>
          <pre>{JSON.stringify(visibleCookies, null, 2)}</pre>
          <p className="hint">В локальном Vite proxy cookie доступна на localhost. При отдельных Cloudflare и Render доменах cookie backend относится к домену backend и не появится в document.cookie frontend, даже если без HttpOnly.</p>
          <button className="secondary" onClick={refreshVisibleCookies}>Обновить document.cookie</button>
        </section>
        <section className="panel">
          <p className="step">03 / СЕРВЕР</p><h2>Что получил Spring</h2>
          <p>Браузер автоматически прикладывает подходящие cookies к запросу с <code>credentials: 'include'</code>.</p>
          <button className="secondary" disabled={loading} onClick={() => void request('/api/cookies/inspect')}>Спросить backend</button>
          {inspection && <><pre>{JSON.stringify(inspection.receivedCookies, null, 2)}</pre><p className="hint">Backend получил HttpOnly-cookie, хотя React не может прочитать её напрямую.</p></>}
        </section>
      </div>
      <section className="panel actions">
        <div><p className="step">04 / УДАЛИТЬ</p><h2>Очистить демонстрационные cookies</h2></div>
        <button className="danger" disabled={loading} onClick={() => void request('/api/cookies/clear', 'POST')}>Удалить обе cookies</button>
      </section>
      {(status || error) && <p className={error ? 'notice error' : 'notice'} role={error ? 'alert' : 'status'}>{error || status}</p>}
      <section className="explain">
        <h2>Три разных понятия</h2>
        <div><strong>HttpOnly</strong><p>Запрещает доступ из JavaScript. Браузер всё ещё может автоматически отправить cookie серверу.</p></div>
        <div><strong>Cookie scope</strong><p>Cookie привязана к host/domain и path, а не к порту. Cookie API-домена не является cookie домена frontend.</p></div>
        <div><strong>CORS ≠ разрешение cookie</strong><p>CORS разрешает странице читать ответ. Нужны точный origin, allowCredentials и fetch credentials include; SameSite/Secure и политика браузера тоже важны.</p></div>
      </section>
      <footer>Учебная демонстрация · Не помещай реальные секреты в demo-cookie</footer>
    </main>
  )
}
