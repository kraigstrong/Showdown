import '../ui/fonts';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../ui/styles.css';
import './rules.css';
import { RulesPage } from './RulesPage';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <RulesPage />
  </StrictMode>,
);
