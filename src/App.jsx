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

function fmt(value) {
  return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'
}

function useSafeNumber(value) {
  const number = parseFloat(String(value).replace(/,/g, ''))
  return Number.isFinite(number) ? number : 0
}

function useLocalState(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // ignore storage errors
    }
  }, [key, state])

  return [state, setState]
}

function CompoundCalculator() {
  const [state, setState] = useLocalState('compoundCalc:v1', {
    principal: '',
    rate: '',
    years: '',
    contribution: '',
    compoundsPerYear: '12',
  })

  const result = useMemo(() => {
    const principal = useSafeNumber(state.principal)
    const rate = useSafeNumber(state.rate) / 100
    const years = Math.max(0, parseFloat(state.years) || 0)
    const contribution = useSafeNumber(state.contribution)
    const compoundsPerYear = Math.max(1, parseInt(state.compoundsPerYear, 10) || 1)
    const accumulated = principal * Math.pow(1 + rate / compoundsPerYear, compoundsPerYear * years)
    const contributions = contribution * years
    const contributionGrowth = rate > 0
      ? contribution * ((Math.pow(1 + rate / compoundsPerYear, compoundsPerYear * years) - 1) / (rate / compoundsPerYear))
      : contribution * years
    const futureValue = accumulated + contributionGrowth
    return {
      futureValue,
      totalInterest: Math.max(0, futureValue - principal - contributions),
    }
  }, [state])

  return (
    <div className="section-body container">
      <div className="calculator-card">
        <p className="section-copy">Use compound interest to see how savings and contributions grow over time.</p>
        <div className="sub-grid">
          <div className="field-grid small">
            <div className="field">
              <label htmlFor="compound-principal">Starting principal</label>
              <div className="input-group">
                <span className="currency-icon">$</span>
                <input
                  id="compound-principal"
                  inputMode="numeric"
                  value={state.principal}
                  onChange={(e) => setState((s) => ({ ...s, principal: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="compound-rate">Annual rate</label>
              <div className="input-group">
                <span className="currency-icon">%</span>
                <input
                  id="compound-rate"
                  inputMode="numeric"
                  value={state.rate}
                  onChange={(e) => setState((s) => ({ ...s, rate: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="compound-years">Years</label>
              <div className="input-group">
                <input
                  id="compound-years"
                  inputMode="numeric"
                  value={state.years}
                  onChange={(e) => setState((s) => ({ ...s, years: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="compound-contribution">Annual contribution</label>
              <div className="input-group">
                <span className="currency-icon">$</span>
                <input
                  id="compound-contribution"
                  inputMode="numeric"
                  value={state.contribution}
                  onChange={(e) => setState((s) => ({ ...s, contribution: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="compound-frequency">Compounds per year</label>
              <div className="input-group">
                <input
                  id="compound-frequency"
                  inputMode="numeric"
                  value={state.compoundsPerYear}
                  onChange={(e) => setState((s) => ({ ...s, compoundsPerYear: e.target.value }))}
                  placeholder="12"
                />
              </div>
            </div>
          </div>
          <div className="result-panel">
            <div className="result-stat">
              <span>Future value</span>
              <strong>${fmt(result.futureValue)}</strong>
            </div>
            <div className="result-stat">
              <span>Total interest</span>
              <strong>${fmt(result.totalInterest)}</strong>
            </div>
            <p className="result-summary">Compound interest grows your balance faster when earnings are reinvested.</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setState({ principal: '', rate: '', years: '', contribution: '', compoundsPerYear: '12' })}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoanCalculator() {
  const [state, setState] = useLocalState('loanCalc:v1', {
    amount: '',
    rate: '',
    term: '',
  })

  const result = useMemo(() => {
    const amount = useSafeNumber(state.amount)
    const monthlyRate = useSafeNumber(state.rate) / 100 / 12
    const payments = Math.max(1, Math.round(useSafeNumber(state.term) * 12))
    const monthlyPayment = monthlyRate > 0 ? amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -payments)) : amount / payments
    const totalCost = monthlyPayment * payments
    return {
      monthlyPayment,
      totalCost,
      totalInterest: Math.max(0, totalCost - amount),
    }
  }, [state])

  return (
    <div className="section-body container">
      <div className="calculator-card">
        <p className="section-copy">Calculate monthly payments and the long-term cost of a loan.</p>
        <div className="sub-grid">
          <div className="field-grid small">
            <div className="field">
              <label htmlFor="loan-amount">Loan amount</label>
              <div className="input-group">
                <span className="currency-icon">$</span>
                <input
                  id="loan-amount"
                  inputMode="numeric"
                  value={state.amount}
                  onChange={(e) => setState((s) => ({ ...s, amount: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="loan-rate">Annual rate</label>
              <div className="input-group">
                <span className="currency-icon">%</span>
                <input
                  id="loan-rate"
                  inputMode="numeric"
                  value={state.rate}
                  onChange={(e) => setState((s) => ({ ...s, rate: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="loan-term">Term (years)</label>
              <div className="input-group">
                <input
                  id="loan-term"
                  inputMode="numeric"
                  value={state.term}
                  onChange={(e) => setState((s) => ({ ...s, term: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <div className="result-panel">
            <div className="result-stat">
              <span>Monthly payment</span>
              <strong>${fmt(result.monthlyPayment)}</strong>
            </div>
            <div className="result-stat">
              <span>Total interest</span>
              <strong>${fmt(result.totalInterest)}</strong>
            </div>
            <p className="result-summary">Compare loan terms and select the payment that fits your budget.</p>
            <button type="button" className="btn btn-secondary" onClick={() => setState({ amount: '', rate: '', term: '' })}>Reset</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MortgageCalculator() {
  const [state, setState] = useLocalState('mortgageCalc:v1', {
    price: '',
    down: '',
    rate: '',
    term: '',
  })

  const result = useMemo(() => {
    const price = useSafeNumber(state.price)
    const down = useSafeNumber(state.down)
    const loanAmount = Math.max(0, price - down)
    const monthlyRate = useSafeNumber(state.rate) / 100 / 12
    const payments = Math.max(1, Math.round(useSafeNumber(state.term) * 12))
    const monthlyPayment = monthlyRate > 0 ? loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -payments)) : loanAmount / payments
    const totalCost = monthlyPayment * payments
    return {
      loanAmount,
      monthlyPayment,
      totalCost,
      totalInterest: Math.max(0, totalCost - loanAmount),
    }
  }, [state])

  return (
    <div className="section-body container">
      <div className="calculator-card">
        <p className="section-copy">Estimate monthly mortgage costs and total interest on a home loan.</p>
        <div className="sub-grid">
          <div className="field-grid small">
            <div className="field">
              <label htmlFor="mortgage-price">Home price</label>
              <div className="input-group">
                <span className="currency-icon">$</span>
                <input
                  id="mortgage-price"
                  inputMode="numeric"
                  value={state.price}
                  onChange={(e) => setState((s) => ({ ...s, price: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="mortgage-down">Down payment</label>
              <div className="input-group">
                <span className="currency-icon">$</span>
                <input
                  id="mortgage-down"
                  inputMode="numeric"
                  value={state.down}
                  onChange={(e) => setState((s) => ({ ...s, down: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="mortgage-rate">Interest rate</label>
              <div className="input-group">
                <span className="currency-icon">%</span>
                <input
                  id="mortgage-rate"
                  inputMode="numeric"
                  value={state.rate}
                  onChange={(e) => setState((s) => ({ ...s, rate: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="mortgage-term">Term (years)</label>
              <div className="input-group">
                <input
                  id="mortgage-term"
                  inputMode="numeric"
                  value={state.term}
                  onChange={(e) => setState((s) => ({ ...s, term: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <div className="result-panel">
            <div className="result-stat">
              <span>Loan amount</span>
              <strong>${fmt(result.loanAmount)}</strong>
            </div>
            <div className="result-stat">
              <span>Monthly payment</span>
              <strong>${fmt(result.monthlyPayment)}</strong>
            </div>
            <p className="result-summary">This calculator helps you estimate what a mortgage payment will feel like month to month.</p>
            <button type="button" className="btn btn-secondary" onClick={() => setState({ price: '', down: '', rate: '', term: '' })}>Reset</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RetirementCalculator() {
  const [state, setState] = useLocalState('retirementCalc:v1', {
    current: '',
    annual: '',
    rate: '',
    years: '',
  })

  const result = useMemo(() => {
    const current = useSafeNumber(state.current)
    const annual = useSafeNumber(state.annual)
    const rate = useSafeNumber(state.rate) / 100
    const years = Math.max(0, parseFloat(state.years) || 0)
    const futureCurrent = current * Math.pow(1 + rate, years)
    const futureContributions = rate > 0
      ? annual * ((Math.pow(1 + rate, years) - 1) / rate)
      : annual * years
    const futureValue = futureCurrent + futureContributions
    return {
      futureValue,
      totalGrowth: Math.max(0, futureValue - current - annual * years),
    }
  }, [state])

  return (
    <div className="section-body container">
      <div className="calculator-card">
        <p className="section-copy">Project how much your retirement savings can grow with consistent contributions.</p>
        <div className="sub-grid">
          <div className="field-grid small">
            <div className="field">
              <label htmlFor="retirement-current">Current savings</label>
              <div className="input-group">
                <span className="currency-icon">$</span>
                <input
                  id="retirement-current"
                  inputMode="numeric"
                  value={state.current}
                  onChange={(e) => setState((s) => ({ ...s, current: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="retirement-annual">Annual contribution</label>
              <div className="input-group">
                <span className="currency-icon">$</span>
                <input
                  id="retirement-annual"
                  inputMode="numeric"
                  value={state.annual}
                  onChange={(e) => setState((s) => ({ ...s, annual: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="retirement-rate">Average return</label>
              <div className="input-group">
                <span className="currency-icon">%</span>
                <input
                  id="retirement-rate"
                  inputMode="numeric"
                  value={state.rate}
                  onChange={(e) => setState((s) => ({ ...s, rate: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="retirement-years">Years until retirement</label>
              <div className="input-group">
                <input
                  id="retirement-years"
                  inputMode="numeric"
                  value={state.years}
                  onChange={(e) => setState((s) => ({ ...s, years: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <div className="result-panel">
            <div className="result-stat">
              <span>Estimated balance</span>
              <strong>${fmt(result.futureValue)}</strong>
            </div>
            <div className="result-stat">
              <span>Estimated growth</span>
              <strong>${fmt(result.totalGrowth)}</strong>
            </div>
            <p className="result-summary">Use this estimate to keep your retirement contributions on track.</p>
            <button type="button" className="btn btn-secondary" onClick={() => setState({ current: '', annual: '', rate: '', years: '' })}>Reset</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmergencyCalculator() {
  const [state, setState] = useLocalState('emergencyCalc:v1', {
    monthlyExpenses: '',
    months: '3',
    currentSavings: '',
  })

  const result = useMemo(() => {
    const monthlyExpenses = useSafeNumber(state.monthlyExpenses)
    const months = Math.max(1, parseFloat(state.months) || 1)
    const currentSavings = useSafeNumber(state.currentSavings)
    const target = monthlyExpenses * months
    const remaining = Math.max(0, target - currentSavings)
    const neededPerMonth = remaining / months
    return { target, remaining, neededPerMonth, funded: currentSavings >= target }
  }, [state])

  return (
    <div className="section-body container">
      <div className="calculator-card">
        <p className="section-copy">Plan an emergency fund so you can weather unexpected expenses with confidence.</p>
        <div className="sub-grid">
          <div className="field-grid small">
            <div className="field">
              <label htmlFor="emergency-expenses">Monthly expenses</label>
              <div className="input-group">
                <span className="currency-icon">$</span>
                <input
                  id="emergency-expenses"
                  inputMode="numeric"
                  value={state.monthlyExpenses}
                  onChange={(e) => setState((s) => ({ ...s, monthlyExpenses: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="emergency-months">Target months</label>
              <div className="input-group">
                <input
                  id="emergency-months"
                  inputMode="numeric"
                  value={state.months}
                  onChange={(e) => setState((s) => ({ ...s, months: e.target.value }))}
                  placeholder="3"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="emergency-current">Current savings</label>
              <div className="input-group">
                <span className="currency-icon">$</span>
                <input
                  id="emergency-current"
                  inputMode="numeric"
                  value={state.currentSavings}
                  onChange={(e) => setState((s) => ({ ...s, currentSavings: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <div className="result-panel">
            <div className="result-stat">
              <span>Fund target</span>
              <strong>${fmt(result.target)}</strong>
            </div>
            <div className="result-stat">
              <span>Monthly needed</span>
              <strong>${fmt(result.neededPerMonth)}</strong>
            </div>
            <p className="result-summary">This helps you build a reserve for at least several months of living costs.</p>
            <button type="button" className="btn btn-secondary" onClick={() => setState({ monthlyExpenses: '', months: '3', currentSavings: '' })}>Reset</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [inputs, setInputs] = useLocalState(STORAGE_KEY, defaultInputs)
  const [savingsGoal, setSavingsGoal] = useLocalState('savingsGoal:v1', { current: '', target: '', monthly: '' })
  const [debtPayoff, setDebtPayoff] = useLocalState('debtPayoff:v1', { balance: '', rate: '', payment: '' })
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
  }, [menuOpen])

  const setField = (key, value) => setInputs((state) => ({ ...state, [key]: value }))
  const setSavingsField = (key, value) => setSavingsGoal((state) => ({ ...state, [key]: value }))
  const setDebtField = (key, value) => setDebtPayoff((state) => ({ ...state, [key]: value }))

  const values = useMemo(() => {
    const income = useSafeNumber(inputs.income)
    const rent = useSafeNumber(inputs.rent)
    const food = useSafeNumber(inputs.food)
    const transport = useSafeNumber(inputs.transport)
    const utilities = useSafeNumber(inputs.utilities)
    const debt = useSafeNumber(inputs.debt)
    const subs = useSafeNumber(inputs.subs)
    const other = useSafeNumber(inputs.other)
    const totalExpenses = rent + food + transport + utilities + debt + subs + other
    const moneyLeft = income - totalExpenses
    const savingsRate = income > 0 ? (Math.max(moneyLeft, 0) / income) * 100 : 0
    const recNeeds = income * 0.5
    const recWants = income * 0.3
    const recSavings = income * 0.2
    return { income, totalExpenses, moneyLeft, savingsRate, recNeeds, recWants, recSavings }
  }, [inputs])

  const savingsResults = useMemo(() => {
    const current = useSafeNumber(savingsGoal.current)
    const target = useSafeNumber(savingsGoal.target)
    const monthly = useSafeNumber(savingsGoal.monthly)
    const remaining = Math.max(target - current, 0)
    const months = monthly > 0 ? Math.ceil(remaining / monthly) : null
    return { current, target, monthly, remaining, months }
  }, [savingsGoal])

  const debtResults = useMemo(() => {
    const balance = useSafeNumber(debtPayoff.balance)
    const annualRate = useSafeNumber(debtPayoff.rate)
    const payment = useSafeNumber(debtPayoff.payment)
    const monthlyRate = annualRate / 100 / 12
    let months = null
    if (balance > 0 && payment > 0) {
      if (monthlyRate <= 0) months = Math.ceil(balance / payment)
      else if (payment > balance * monthlyRate) {
        const numerator = Math.log(payment / (payment - balance * monthlyRate))
        const denominator = Math.log(1 + monthlyRate)
        months = Math.ceil(numerator / denominator)
      }
    }
    const payoffCost = months && balance > 0 ? payment * months : 0
    const interestPaid = Math.max(0, payoffCost - balance)
    return { balance, annualRate, payment, months, interestPaid }
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
    if (values.totalExpenses > values.income) return { type: 'danger', text: 'Your expenses exceed your income. Reduce costs or increase revenue to improve cash flow.' }
    if (values.savingsRate < 10) return { type: 'warning', text: 'Your savings rate is under 10%. Trim discretionary spending and subscriptions.' }
    if (values.savingsRate >= 20) return { type: 'positive', text: 'Excellent work — your savings rate is healthy and sustainable.' }
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
        <button
          className={`nav-toggle ${menuOpen ? 'open' : ''}`}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
        <nav className={`site-nav ${menuOpen ? 'active' : ''}`} aria-label="Primary navigation">
          <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#budget" onClick={() => setMenuOpen(false)}>Budget</a>
          <a href="#savings" onClick={() => setMenuOpen(false)}>Savings</a>
          <a href="#debt" onClick={() => setMenuOpen(false)}>Debt</a>
          <a href="#compound" onClick={() => setMenuOpen(false)}>Compound</a>
          <a href="#loan" onClick={() => setMenuOpen(false)}>Loan</a>
          <a href="#mortgage" onClick={() => setMenuOpen(false)}>Mortgage</a>
          <a href="#retirement" onClick={() => setMenuOpen(false)}>Retirement</a>
          <a href="#emergency" onClick={() => setMenuOpen(false)}>Emergency</a>
          <a href="#articles" onClick={() => setMenuOpen(false)}>Articles</a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <span className="eyebrow">Fintech-style finance toolkit</span>
          <h1>BudgetFlow makes finance simple, smart, and mobile-ready.</h1>
          <p>Track expenses, compare calculators, and plan long-term goals with a professional toolkit built for modern money management.</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#budget" onClick={() => setMenuOpen(false)}>Start budgeting</a>
            <a className="btn btn-secondary" href="#articles" onClick={() => setMenuOpen(false)}>Read finance guides</a>
          </div>
        </div>
        <div className="hero-highlights">
          <article className="stat-card">
            <p className="stat-title">Toolkit overview</p>
            <strong>Five powerful calculators</strong>
            <span>Budget, savings, debts, retirement, and more — all in one finance hub.</span>
          </article>
          <article className="stat-card">
            <p className="stat-title">Built for clarity</p>
            <strong>Accurate results</strong>
            <span>Clear formulas and result summaries make smart money choices easier.</span>
          </article>
          <article className="stat-card">
            <p className="stat-title">Fast and responsive</p>
            <strong>Mobile-first design</strong>
            <span>Touch-friendly inputs, responsive navigation, and no horizontal scrolling.</span>
          </article>
        </div>
      </section>

      <section className="toolkit-overview container" id="search">
        <div className="section-header">
          <div>
            <span className="eyebrow">Explore calculators</span>
            <h2>Choose the right tool for your financial goal</h2>
          </div>
        </div>
        <div className="toolkit-grid">
          {[
            { id: 'budget', title: 'Budget Calculator', description: 'Plan monthly spending and cash flow.' },
            { id: 'savings', title: 'Savings Goal', description: 'Track your savings milestones.' },
            { id: 'debt', title: 'Debt Payoff', description: 'Estimate repayment timelines.' },
            { id: 'compound', title: 'Compound Interest', description: 'See how savings grow over time.' },
            { id: 'loan', title: 'Loan Calculator', description: 'Compare payments and interest.' },
            { id: 'mortgage', title: 'Mortgage Calculator', description: 'Estimate home loan costs.' },
            { id: 'retirement', title: 'Retirement Planner', description: 'Project your retirement savings.' },
            { id: 'emergency', title: 'Emergency Fund', description: 'Plan a safety net for 3–6 months.' },
          ].map((item) => (
            <article className="toolkit-card" key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <a className="link-button" href={`#${item.id}`} onClick={() => setMenuOpen(false)}>Open tool</a>
            </article>
          ))}
        </div>
      </section>

      <main className="container">
        <section className="calculator-card page-section" id="budget">
          <div className="section-header">
            <div>
              <span className="eyebrow">Budget Calculator</span>
              <h2>Premium cash flow planning</h2>
            </div>
          </div>
          <p className="section-copy">BudgetFlow helps you see monthly income, expenses, and what remains for saving or investing.</p>
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
          <div className="page-info-card">
            <h3>Why this matters</h3>
            <p>Use the 50/30/20 rule to compare your actual expenses with recommended savings and needs for a healthier financial plan.</p>
          </div>
          <div className="calculator-faq">
            <h4>Budget Calculator FAQ</h4>
            <article>
              <h5>What is total expenses?</h5>
              <p>Total expenses are the sum of all monthly outflows, including housing, food, utilities, debt, and subscriptions.</p>
            </article>
            <article>
              <h5>How can I improve my savings rate?</h5>
              <p>Reduce non-essential spending and increase income; then reallocate the money to savings or debt repayment.</p>
            </article>
          </div>
        </section>

        <section className="results-card page-section" aria-live="polite">
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
        </section>
      </main>

      <section className="calculator-section page-section" id="savings">
        <div className="container section-header">
          <div>
            <span className="eyebrow">Savings Goal Calculator</span>
            <h2>Plan your next savings milestone</h2>
          </div>
        </div>
        <div className="section-body container">
          <div className="calculator-card">
            <p className="section-copy">Estimate when your savings goal will be reached based on current balance and monthly contributions.</p>
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
                <button className="btn btn-secondary" type="button" onClick={() => setSavingsGoal({ current: '', target: '', monthly: '' })}>Reset</button>
              </div>
            </div>
          </div>
          <aside className="summary-card">
            <h3>Saving smarter</h3>
            <p>Set a clear target and track every contribution so you can build momentum toward your emergency fund or down payment.</p>
          </aside>
        </div>
        <div className="container calculator-faq">
          <article>
            <h4>How should I choose a savings goal?</h4>
            <p>Start with a realistic monthly amount and set a deadline. Adjust the goal based on your income, expenses, and short-term priorities.</p>
          </article>
          <article>
            <h4>What if I can’t save every month?</h4>
            <p>Revisit the amount and timeline, then make incremental increases. Even small consistent deposits will grow over time.</p>
          </article>
        </div>
      </section>

      <section className="calculator-section page-section" id="debt">
        <div className="container section-header">
          <div>
            <span className="eyebrow">Debt Payoff Calculator</span>
            <h2>Estimate your repayment timeline</h2>
          </div>
        </div>
        <div className="section-body container">
          <div className="calculator-card">
            <p className="section-copy">Understand how monthly payments, interest, and balance affect your debt payoff schedule.</p>
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
                <p className="result-summary">A larger payment shortens your timeline and reduces total interest.</p>
                <button className="btn btn-secondary" type="button" onClick={() => setDebtPayoff({ balance: '', rate: '', payment: '' })}>Reset</button>
              </div>
            </div>
          </div>
          <aside className="summary-card">
            <h3>How debt payments work</h3>
            <p>Higher payments reduce interest faster and shorten the payoff timeline. Use this tool to find a payment you can sustain.</p>
          </aside>
        </div>
      </section>

      <section className="calculator-section page-section" id="compound">
        <div className="container section-header">
          <div>
            <span className="eyebrow">Compound Interest Calculator</span>
            <h2>See how savings grow with time</h2>
          </div>
        </div>
        <CompoundCalculator />
      </section>

      <section className="calculator-section page-section" id="loan">
        <div className="container section-header">
          <div>
            <span className="eyebrow">Loan Calculator</span>
            <h2>Compare payments and total interest</h2>
          </div>
        </div>
        <LoanCalculator />
      </section>

      <section className="calculator-section page-section" id="mortgage">
        <div className="container section-header">
          <div>
            <span className="eyebrow">Mortgage Calculator</span>
            <h2>Estimate monthly mortgage costs</h2>
          </div>
        </div>
        <MortgageCalculator />
      </section>

      <section className="calculator-section page-section" id="retirement">
        <div className="container section-header">
          <div>
            <span className="eyebrow">Retirement Planner</span>
            <h2>Project your retirement savings</h2>
          </div>
        </div>
        <RetirementCalculator />
      </section>

      <section className="calculator-section page-section" id="emergency">
        <div className="container section-header">
          <div>
            <span className="eyebrow">Emergency Fund Calculator</span>
            <h2>Build your safety net</h2>
          </div>
        </div>
        <EmergencyCalculator />
      </section>

      <section className="page-section container" id="articles">
        <div className="section-header">
          <div>
            <span className="eyebrow">Finance articles</span>
            <h2>Learn smart money habits</h2>
          </div>
        </div>
        <div className="article-grid">
          {[
            { title: 'How to create a monthly budget', summary: 'Build a realistic budget that keeps your expenses and savings in sync.' },
            { title: 'What is the 50/30/20 rule?', summary: 'Learn the popular budgeting method for needs, wants, and savings.' },
            { title: 'How to save money fast', summary: 'Practical tips for boosting savings without cutting essentials.' },
            { title: 'How to build an emergency fund', summary: 'Why a three-to-six month reserve is essential for financial stability.' },
            { title: 'How to pay off debt faster', summary: 'Use strategy and momentum to reduce debt stress and interest costs.' },
            { title: 'Budgeting mistakes to avoid', summary: 'Common planning errors that derail your financial progress.' },
            { title: 'Compound interest explained', summary: 'Understand how interest multiplies your savings over time.' },
            { title: 'How loan payments work', summary: 'Learn what makes up a monthly loan payment and total cost.' },
            { title: 'How to plan for retirement', summary: 'A simple framework for setting long-term savings goals.' },
            { title: 'How to track monthly expenses', summary: 'Easy ways to monitor spending and refine your budget.' },
          ].map((item) => (
            <article className="article-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-section container" id="faq">
        <div className="section-header">
          <div>
            <span className="eyebrow">Full FAQ</span>
            <h2>Answers to common finance questions</h2>
          </div>
        </div>
        <div className="faq-grid">
          <article>
            <h3>How do I use the calculators?</h3>
            <p>Enter your values and review the summary card; reset buttons let you start over quickly.</p>
          </article>
          <article>
            <h3>Are the calculators accurate?</h3>
            <p>They use standard financial formulas for budgeting, savings, loans, mortgages, and retirement.</p>
          </article>
          <article>
            <h3>Can I use these tools on mobile?</h3>
            <p>Yes. The site is fully responsive and built for touch-friendly inputs and navigation.</p>
          </article>
          <article>
            <h3>Do I need to sign in?</h3>
            <p>No sign-in is required. Inputs are stored locally in your browser for convenience.</p>
          </article>
        </div>
      </section>

      <section className="page-section container" id="about">
        <div className="section-header">
          <div>
            <span className="eyebrow">About BudgetFlow</span>
            <h2>A modern toolkit for everyday finance</h2>
          </div>
        </div>
        <p className="section-copy">BudgetFlow combines budgeting, savings planning, borrowing, investing, and protection calculators into a single polished experience. Designed for users who want clarity and fast results.</p>
      </section>

      <section className="page-section container" id="contact">
        <div className="section-header">
          <div>
            <span className="eyebrow">Contact</span>
            <h2>Get help or send feedback</h2>
          </div>
        </div>
        <div className="contact-card">
          <p>Have questions about BudgetFlow? Send feedback or ask for a new feature.</p>
          <a className="link-button" href="mailto:hello@example.com">Email support</a>
        </div>
      </section>

      <section className="page-section container" id="privacy">
        <div className="section-header">
          <div>
            <span className="eyebrow">Privacy Policy</span>
            <h2>Your privacy is respected</h2>
          </div>
        </div>
        <p className="section-copy">This app stores no user information on servers. Inputs remain in your browser unless you choose to export your summary.</p>
      </section>

      <section className="page-section container" id="terms">
        <div className="section-header">
          <div>
            <span className="eyebrow">Terms & Conditions</span>
            <h2>Usage terms for BudgetFlow</h2>
          </div>
        </div>
        <p className="section-copy">BudgetFlow is provided for educational and planning purposes only. It is not a substitute for professional financial advice.</p>
      </section>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <p className="brand-name">BudgetFlow</p>
            <p className="footer-copy">Financial tools designed for fast, modern planning.</p>
          </div>
          <nav className="footer-nav" aria-label="Footer navigation">
            <a href="#home">Home</a>
            <a href="#articles">Articles</a>
            <a href="#faq">FAQ</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
          </nav>
        </div>
        <p className="footer-bottom">© {new Date().getFullYear()} BudgetFlow. Built for smart spending and long-term savings.</p>
      </footer>
    </div>
  )
}
