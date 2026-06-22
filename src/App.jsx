import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'budgetInputs:v1'

const defaultInputs = {
  income: '',
  rent: '',
  food: '',
  transport: '',
  utilities: '',
  debt: '',
  subs: '',
  other: '',
}

function fmt(n) {
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'
}

function useLocalState(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initial
    } catch (e) {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch (e) {}
  }, [key, state])
  return [state, setState]
}

export default function App() {
  const [inputs, setInputs] = useLocalState(STORAGE_KEY, defaultInputs)

  function setField(k, v) {
    setInputs((s) => ({ ...s, [k]: v }))
  }

  function toNumber(v) {
    const n = parseFloat(String(v).replace(/,/g, ''))
    return Number.isFinite(n) ? n : 0
  }

  const values = useMemo(() => {
    const income = toNumber(inputs.income)
    const rent = toNumber(inputs.rent)
    const food = toNumber(inputs.food)
    const transport = toNumber(inputs.transport)
    const utilities = toNumber(inputs.utilities)
    const debt = toNumber(inputs.debt)
    const subs = toNumber(inputs.subs)
    const other = toNumber(inputs.other)

    const totalExpenses = rent + food + transport + utilities + debt + subs + other
    const moneyLeft = income - totalExpenses
    const savingsRate = income > 0 ? (Math.max(moneyLeft, 0) / income) * 100 : 0

    const recNeeds = income * 0.5
    const recWants = income * 0.3
    const recSavings = income * 0.2

    return {
      income,
      totalExpenses,
      moneyLeft,
      savingsRate,
      recNeeds,
      recWants,
      recSavings,
    }
  }, [inputs])

  function reset() {
    setInputs(defaultInputs)
  }

  function exportSummary() {
    const text = [`Free Budget Calculator Summary`, `Generated: ${new Date().toLocaleString()}`, '', `Inputs:`]
      .concat(
        Object.entries(inputs).map(([k, v]) => `- ${k}: ${v || '0'}`),
      )
      .concat([
        '',
        'Results:',
        `- Total expenses: ${fmt(values.totalExpenses)}`,
        `- Money left after expenses: ${fmt(values.moneyLeft)}`,
        `- Savings rate: ${fmt(values.savingsRate)}%`,
        `- 50/30/20 (Needs/Wants/Savings): ${fmt(values.recNeeds)} / ${fmt(values.recWants)} / ${fmt(values.recSavings)}`,
      ])
      .join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'budget-summary.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const advice = useMemo(() => {
    if (values.totalExpenses > values.income) return { type: 'danger', text: 'Your expenses exceed your income. Consider cutting costs or increasing income.' }
    if (values.savingsRate < 10) return { type: 'warning', text: 'Your savings rate is under 10%. Consider reducing wants or subscriptions.' }
    if (values.savingsRate >= 20) return { type: 'positive', text: 'Great job — your savings rate meets or exceeds 20%!' }
    return { type: 'info', text: 'Keep tracking your spending to improve your savings rate.' }
  }, [values])

  return (
    <div className="app">
      <header className="hero">
        <h1>Free Budget Calculator</h1>
        <p className="tag">Quickly estimate expenses, savings, and a 50/30/20 split</p>
      </header>

      <main className="container">
        <section className="calculator">
          <form onSubmit={(e) => e.preventDefault()} aria-label="Budget calculator form">
            <div className="row">
              <label>Monthly income</label>
              <input
                inputMode="numeric"
                value={inputs.income}
                onChange={(e) => setField('income', e.target.value)}
                placeholder="0"
                aria-label="Monthly income"
              />
            </div>

            <fieldset className="expenses">
              <legend>Expenses</legend>
              {[
                ['rent', 'Rent / Housing'],
                ['food', 'Food / Groceries'],
                ['transport', 'Transport'],
                ['utilities', 'Utilities'],
                ['debt', 'Debt payments'],
                ['subs', 'Subscriptions'],
                ['other', 'Other expenses'],
              ].map(([key, label]) => (
                <div className="row" key={key}>
                  <label>{label}</label>
                  <input
                    inputMode="numeric"
                    value={inputs[key]}
                    onChange={(e) => setField(key, e.target.value)}
                    placeholder="0"
                    aria-label={label}
                  />
                </div>
              ))}
            </fieldset>

            <div className="actions">
              <button type="button" className="btn" onClick={reset}>Reset</button>
              <button type="button" className="btn btn-ghost" onClick={exportSummary}>Export Summary</button>
            </div>
          </form>
        </section>

        <aside className="results" aria-live="polite">
          <h2>Results</h2>
          <div className="result-row">
            <span>Total expenses</span>
            <strong>${fmt(values.totalExpenses)}</strong>
          </div>
          <div className="result-row">
            <span>Money left after expenses</span>
            <strong>${fmt(values.moneyLeft)}</strong>
          </div>
          <div className="result-row">
            <span>Savings rate</span>
            <strong>{fmt(values.savingsRate)}%</strong>
          </div>

          <div className="bars">
            <div className="bar">
              <div className="bar-label">Spending</div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: values.income > 0 ? `${Math.min((values.totalExpenses / values.income) * 100, 100)}%` : '0%' }}
                />
              </div>
            </div>

            <div className="bar">
              <div className="bar-label">Potential savings</div>
              <div className="bar-track">
                <div
                  className="bar-fill savings"
                  style={{ width: values.income > 0 ? `${Math.max((Math.min(values.moneyLeft, values.income) / values.income) * 100, 0)}%` : '0%' }}
                />
              </div>
            </div>
          </div>

          <div className="recommended">
            <h3>50/30/20 recommendation</h3>
            <div className="rec-row"><span>Needs (50%)</span><strong>${fmt(values.recNeeds)}</strong></div>
            <div className="rec-row"><span>Wants (30%)</span><strong>${fmt(values.recWants)}</strong></div>
            <div className="rec-row"><span>Savings / Debt (20%)</span><strong>${fmt(values.recSavings)}</strong></div>
          </div>

          <div className={`advice ${advice.type}`}>{advice.text}</div>
        </aside>
      </main>

      <section className="seo container">
        <h2>How to use this budget calculator</h2>
        <p>Enter your monthly income and list your regular monthly expenses. The calculator shows total expenses, how much you have left, and a simple savings rate.</p>

        <h2>What is the 50/30/20 rule?</h2>
        <p>The 50/30/20 rule suggests allocating 50% of income to needs, 30% to wants, and 20% to savings and debt repayment.</p>

        <h2>How to save more money every month</h2>
        <ul>
          <li>Track and categorize your spending.</li>
          <li>Cut discretionary wants and subscriptions.</li>
          <li>Automate transfers to savings each payday.</li>
        </ul>
      </section>

      <footer className="footer">
        <div className="container">
          <nav>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms</a>
            <a href="#">Contact</a>
          </nav>
          <p>© {new Date().getFullYear()} Free Budget Calculator</p>
        </div>
      </footer>
    </div>
  )
}
