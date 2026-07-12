import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="lux-footer">
      <div>
        <strong>Money<span>Bag</span></strong>
        <p>Private-feeling tools for everyday capital, budgets, goals, debts, and reports.</p>
      </div>
      <nav>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/about">About</Link>
      </nav>
    </footer>
  );
};

export default Footer;
