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
  const [savingsGoal, setSavingsGoal] = useLocalState('savingsGoal:v1', { current: '', target: '', monthly: '' })
  const [debtPayoff, setDebtPayoff] = useLocalState('debtPayoff:v1', { balance: '', rate: '', payment: '' })

  const setField = (key, value) => setInputs((state) => ({ ...state, [key]: value }))
  const setSavingsField = (key, value) => setSavingsGoal((state) => ({ ...state, [key]: value }))
  const setDebtField = (key, value) => setDebtPayoff((state) => ({ ...state, [key]: value }))

  const toNumber = (value) => {
    const n = parseFloat(String(value).replace(/,/g, ''))
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

  const savingsResults = useMemo(() => {
    const current = toNumber(savingsGoal.current)
    const target = toNumber(savingsGoal.target)
    const monthly = toNumber(savingsGoal.monthly)
    const remaining = Math.max(target - current, 0)
    const months = monthly > 0 ? Math.ceil(remaining / monthly) : null
    const monthlyNeeded = remaining > 0 ? Math.max(0, remaining / Math.max(1, months || 1)) : 0

    return {
      current,
      target,
      monthly,
      remaining,
      months,
      monthlyNeeded,
    }
  }, [savingsGoal])

  const debtResults = useMemo(() => {
    const balance = toNumber(debtPayoff.balance)
    const annualRate = toNumber(debtPayoff.rate)
    const payment = toNumber(debtPayoff.payment)
    const monthlyRate = annualRate / 100 / 12

    let months = null
    if (balance > 0 && payment > 0) {
      if (monthlyRate <= 0) {
        months = Math.ceil(balance / payment)
      } else if (payment > balance * monthlyRate) {
        const numerator = Math.log(payment / (payment - balance * monthlyRate))
        const denominator = Math.log(1 + monthlyRate)
        months = Math.ceil(numerator / denominator)
      }
    }

    const payoffCost = months && balance > 0 ? payment * months : 0
    const interestPaid = Math.max(0, payoffCost - balance)

    return {
      balance,
      annualRate,
      payment,
      months,
      interestPaid,
    }
  }, [debtPayoff])

  const resetBudget = () => setInputs(defaultInputs)

  const exportSummary = () => {
    const text = [
      'Free Budget Calculator Summary',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Inputs:',
      ...Object.entries(inputs).map(([key, value]) => `- ${key}: ${value || '0'}`),
      '',
      'Results:',
      `- Total expenses: ${fmt(values.totalExpenses)}`,
      `- Money left after expenses: ${fmt(values.moneyLeft)}`,
      `- Savings rate: ${fmt(values.savingsRate)}%`,
      `- 50/30/20 (Needs/Wants/Savings): ${fmt(values.recNeeds)} / ${fmt(values.recWants)} / ${fmt(values.recSavings)}`,
    ].join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'budget-summary.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  const advice = useMemo(() => {
    if (values.totalExpenses > values.income) {
      return { type: 'danger', text: 'Your expenses exceed your income. Reduce costs or increase revenue to improve cash flow.' }
    }
    if (values.savingsRate < 10) {
      return { type: 'warning', text: 'Your savings rate is under 10%. Trim discretionary spending and subscriptions.' }
    }
    if (values.savingsRate >= 20) {
      return { type: 'positive', text: 'Excellent work — your savings rate is healthy and sustainable.' }
    }
    return { type: 'info', text: 'Keep tracking your budget and revisit spending categories monthly.' }
  }, [values])

  const healthScore = useMemo(() => {
    if (values.income <= 0) return 0
    const expenseRatio = values.totalExpenses / values.income
    return Math.round(Math.max(0, Math.min(100, 90 - expenseRatio * 30 + Math.min(values.savingsRate, 50) * 0.8)))
  }, [values])

  return (
    <div className="app">
      <header className="site-header">
        <div className="brand-block">
          <div className="brand-mark">BF</div>
          <div>
            <p className="brand-name">BudgetFlow</p>
            <p className="brand-tagline">Modern finance for every plan</p>
          </div>
        </div>
        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#home">Home</a>
          <a href="#budget">Budget Calculator</a>
          <a href="#savings">Savings Calculator</a>
          <a href="#debt">Debt Calculator</a>
          <a href="#about">About</a>
        </nav>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <span className="eyebrow">Fintech-style personal finance</span>
          <h1>Control spending, grow savings, and pay down debt with confidence.</h1>
          <p>Powerful budget planning and financial insights in one premium dashboard designed for modern money management.</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#budget">Start budgeting</a>
            <a className="btn btn-secondary" href="#features">Explore features</a>
          </div>
        </div>
        <div className="hero-highlights">
          <article className="stat-card">
            <p className="stat-title">Budget Planning</p>
            <strong>Track every expense</strong>
            <span>See where cash is going and keep your spending aligned with goals.</span>
          </article>
          <article className="stat-card">
            <p className="stat-title">Savings Tracking</p>
            <strong>Build your emergency fund</strong>
            <span>Measure progress with easy monthly savings and goal timelines.</span>
          </article>
          <article className="stat-card">
            <p className="stat-title">Debt Reduction</p>
            <strong>Pay off smarter</strong>
            <span>Estimate payoff timelines and compare your monthly impact.</span>
          </article>
        </div>
      </section>

      <main className="container">
        <section className="calculator-card" id="budget">
          <div className="section-header">
            <div>
              <span className="eyebrow">Budget Calculator</span>
              <h2>Premium cash flow planning</h2>
            </div>
            <p>Optimize your monthly spending and maximize the money you keep.</p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} aria-label="Budget calculator form">
            <div className="field-grid">
              <div className="field">
                <label htmlFor="income">Monthly income</label>
                <div className="input-group">
                  <span className="currency-icon">$</span>
                  <input
                    id="income"
                    inputMode="numeric"
                    value={inputs.income}
                    onChange={(e) => setField('income', e.target.value)}
                    placeholder="0"
                    aria-label="Monthly income"
                  />
                </div>
              </div>

              {[
                ['rent', 'Rent / Housing'],
                ['food', 'Food / Groceries'],
                ['transport', 'Transport'],
                ['utilities', 'Utilities'],
                ['debt', 'Debt payments'],
                ['subs', 'Subscriptions'],
                ['other', 'Other expenses'],
              ].map(([key, label]) => (
                <div className="field" key={key}>
                  <label htmlFor={key}>{label}</label>
                  <div className="input-group">
                    <span className="currency-icon">$</span>
                    <input
                      id={key}
                      inputMode="numeric"
                      value={inputs[key]}
                      onChange={(e) => setField(key, e.target.value)}
                      placeholder="0"
                      aria-label={label}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={resetBudget}>Reset</button>
              <button type="button" className="btn btn-secondary" onClick={exportSummary}>Export summary</button>
            </div>
          </form>
        </section>

        <aside className="results-card" aria-live="polite">
          <div className="section-header small">
            <div>
              <span className="eyebrow">Financial overview</span>
              <h2>Instant insights</h2>
            </div>
          </div>

          <div className="metric-grid">
            <div className="metric metric-expense">
              <span>Total expenses</span>
              <strong>${fmt(values.totalExpenses)}</strong>
            </div>
            <div className="metric metric-balance">
              <span>Money left</span>
              <strong>${fmt(values.moneyLeft)}</strong>
            </div>
            <div className="metric metric-rate">
              <span>Savings rate</span>
              <strong>{fmt(values.savingsRate)}%</strong>
            </div>
          </div>

          <div className="progress-block">
            <div className="progress-label">
              <span>Spending vs income</span>
              <strong>{values.income > 0 ? `${Math.min((values.totalExpenses / values.income) * 100, 100).toFixed(0)}%` : '0%'}</strong>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill spending"
                style={{ width: values.income > 0 ? `${Math.min((values.totalExpenses / values.income) * 100, 100)}%` : '0%' }}
              />
            </div>
          </div>

          <div className="progress-block">
            <div className="progress-label">
              <span>Potential savings</span>
              <strong>{values.income > 0 ? `${Math.max((Math.min(values.moneyLeft, values.income) / values.income) * 100, 0).toFixed(0)}%` : '0%'}</strong>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill savings"
                style={{ width: values.income > 0 ? `${Math.max((Math.min(values.moneyLeft, values.income) / values.income) * 100, 0)}%` : '0%' }}
              />
            </div>
          </div>

          <div className="summary-card">
            <h3>Monthly summary</h3>
            <ul>
              <li>Recommended needs: ${fmt(values.recNeeds)}</li>
              <li>Recommended wants: ${fmt(values.recWants)}</li>
              <li>Recommended savings / debt: ${fmt(values.recSavings)}</li>
            </ul>
          </div>

          <div className="health-card">
            <div className="health-score">
              <div
                className="health-ring"
                style={{
                  background: `conic-gradient(${healthScore >= 75 ? 'var(--accent-success)' : healthScore >= 50 ? 'var(--accent-warn)' : 'var(--accent-danger)'} ${healthScore}%, var(--ring-bg) ${healthScore}% 100%)`,
                }}
                aria-hidden
              >
                <strong>{healthScore}</strong>
              </div>
              <span className="health-label">Financial health score</span>
            </div>
            <p>{healthScore >= 75 ? 'Your budget is on a strong path.' : healthScore >= 50 ? 'A few changes could improve your cash flow.' : 'Review your spending and savings strategy.'}</p>
          </div>

          <div className={`advice ${advice.type}`}>{advice.text}</div>
        </aside>
      </main>

      <section className="subcalculators container">
        <div className="sub-card" id="savings">
          <div className="section-header small">
            <div>
              <span className="eyebrow">Savings Goal Calculator</span>
              <h3>Plan your next savings milestone</h3>
            </div>
          </div>
          <div className="sub-grid">
            <div className="field-grid small">
              <div className="field">
                <label htmlFor="current-savings">Current savings</label>
                <div className="input-group">
                  <span className="currency-icon">$</span>
                  <input
                    id="current-savings"
                    inputMode="numeric"
                    value={savingsGoal.current}
                    onChange={(e) => setSavingsField('current', e.target.value)}
                    placeholder="0"
                    aria-label="Current savings"
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="target-savings">Target amount</label>
                <div className="input-group">
                  <span className="currency-icon">$</span>
                  <input
                    id="target-savings"
                    inputMode="numeric"
                    value={savingsGoal.target}
                    onChange={(e) => setSavingsField('target', e.target.value)}
                    placeholder="0"
                    aria-label="Target amount"
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="monthly-savings">Monthly deposit</label>
                <div className="input-group">
                  <span className="currency-icon">$</span>
                  <input
                    id="monthly-savings"
                    inputMode="numeric"
                    value={savingsGoal.monthly}
                    onChange={(e) => setSavingsField('monthly', e.target.value)}
                    placeholder="0"
                    aria-label="Monthly deposit"
                  />
                </div>
              </div>
            </div>
            <div className="result-panel">
              <div className="result-stat">
                <span>Remaining</span>
                <strong>${fmt(savingsResults.remaining)}</strong>
              </div>
              <div className="result-stat">
                <span>Months to goal</span>
                <strong>{savingsResults.months || '--'}</strong>
              </div>
              <p className="result-summary">
                {savingsResults.months ? `At $${fmt(savingsResults.monthly)} per month, you will reach your goal in ${savingsResults.months} months.` : 'Enter a monthly deposit to estimate your timeline.'}
              </p>
            </div>
          </div>
        </div>

        <div className="sub-card" id="debt">
          <div className="section-header small">
            <div>
              <span className="eyebrow">Debt Payoff Calculator</span>
              <h3>Estimate your repayment timeline</h3>
            </div>
          </div>
          <div className="sub-grid">
            <div className="field-grid small">
              <div className="field">
                <label htmlFor="debt-balance">Debt balance</label>
                <div className="input-group">
                  <span className="currency-icon">$</span>
                  <input
                    id="debt-balance"
                    inputMode="numeric"
                    value={debtPayoff.balance}
                    onChange={(e) => setDebtField('balance', e.target.value)}
                    placeholder="0"
                    aria-label="Debt balance"
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="debt-rate">APR</label>
                <div className="input-group">
                  <span className="currency-icon">%</span>
                  <input
                    id="debt-rate"
                    inputMode="numeric"
                    value={debtPayoff.rate}
                    onChange={(e) => setDebtField('rate', e.target.value)}
                    placeholder="0"
                    aria-label="Debt APR"
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="debt-payment">Monthly payment</label>
                <div className="input-group">
                  <span className="currency-icon">$</span>
                  <input
                    id="debt-payment"
                    inputMode="numeric"
                    value={debtPayoff.payment}
                    onChange={(e) => setDebtField('payment', e.target.value)}
                    placeholder="0"
                    aria-label="Debt monthly payment"
                  />
                </div>
              </div>
            </div>
            <div className="result-panel">
              <div className="result-stat">
                <span>Estimated payoff</span>
                <strong>{debtResults.months ? `${debtResults.months} months` : '--'}</strong>
              </div>
              <div className="result-stat">
                <span>Estimated interest</span>
                <strong>${fmt(debtResults.interestPaid)}</strong>
              </div>
              <p className="result-summary">
                {debtResults.months ? `A ${fmt(debtResults.payment)} monthly payment will clear your balance in ${debtResults.months} months.` : 'Enter a payment above interest to calculate your payoff timeline.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="ad-banner container" aria-label="Advertisement section">
        <div className="ad-slot" data-ad-placeholder>
          {/*
            Google AdSense placeholder:
            - Replace `ca-pub-XXXXXXXXXXXX` with your publisher ID.
            - Use one responsive ad unit per visible slot.
            Example (uncomment and replace IDs when ready):

            <ins className="adsbygoogle"
                 style={{display:'block'}}
                 data-ad-client="ca-pub-XXXXXXXXXXXX"
                 data-ad-slot="YYYYYYYYYY"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>

            See README_DEPLOY.md for placement and policy guidance.
          */}
          <div style={{padding:'22px', color:'var(--text)'}}>Ad space for Google AdSense (placeholder)</div>
        </div>
      </section>

      <section className="features container" id="about">
        <div className="section-header">
          <div>
            <span className="eyebrow">Key features</span>
            <h2>Everything you need for smart money decisions</h2>
          </div>
        </div>
        <div className="feature-grid">
          <article>
            <h3>Modern dashboard</h3>
            <p>High-contrast cards, clean spacing, and actionable metrics make decisions easier.</p>
          </article>
          <article>
            <h3>Goal tracking</h3>
            <p>Set savings targets and compare your actual cash flow against realistic goals.</p>
          </article>
          <article>
            <h3>Debt planning</h3>
            <p>Estimate payoff timelines and understand how payments reduce interest over time.</p>
          </article>
          <article>
            <h3>SEO-ready content</h3>
            <p>Built with headline hierarchy and keywords to improve search visibility.</p>
          </article>
        </div>
      </section>

      <section className="faq container">
        <div className="section-header">
          <div>
            <span className="eyebrow">FAQ</span>
            <h2>Frequently asked questions</h2>
          </div>
        </div>
        <div className="faq-grid">
          <article>
            <h3>How accurate are the results?</h3>
            <p>This tool provides estimates based on common budgeting rules and your monthly values. For exact financial advice, consult a professional.</p>
          </article>
          <article>
            <h3>Can I save my plan?</h3>
            <p>Your budget inputs are saved locally in the browser so you can return to your calculations later.</p>
          </article>
          <article>
            <h3>Is this good for debt reduction?</h3>
            <p>Yes. The debt payoff calculator compares balance, APR, and payment to estimate how long it will take to repay.</p>
          </article>
          <article>
            <h3>Can I use this on mobile?</h3>
            <p>The layout is responsive and maintains the same polished width while stacking content elegantly on smaller screens.</p>
          </article>
        </div>
      </section>

      <section className="seo container">
        <h2>Budget calculator for modern finance</h2>
        <p>Use this budgeting tool to plan expenses, improve savings, and reduce debt with fintech-inspired design. Optimized for Google AdSense placement and search engine friendly headings.</p>
        <h3>Why use a budget calculator?</h3>
        <p>Budget calculators help you understand cash flow, identify unnecessary spending, and create a stronger savings plan. This version gives a professional layout and premium metrics for easy financial decisions.</p>
      </section>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <p className="brand-name">BudgetFlow</p>
            <p className="footer-copy">Premium budgeting tools for confident financial planning.</p>
          </div>
          <nav className="footer-nav" aria-label="Footer navigation">
            <a href="#home">Home</a>
            <a href="#budget">Budget Calculator</a>
            <a href="#savings">Savings</a>
            <a href="#debt">Debt</a>
            <a href="#about">About</a>
          </nav>
        </div>
        <p className="footer-bottom">© {new Date().getFullYear()} BudgetFlow. Built for smart spending and long-term savings.</p>
      </footer>
    </div>
  )
}
