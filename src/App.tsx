import { Link } from 'react-router-dom'

import './App.css'

export function App() {
  return (
    <div className="App">
      <header className="App-header">
        <ul>
          <li>
            <Link to="/holesky">Holesky</Link>
          </li>
          <li>
            <Link to="/arbitrum">Arbitrum</Link>
          </li>
        </ul>
      </header>
    </div>
  )
}
