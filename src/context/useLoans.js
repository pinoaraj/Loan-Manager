import { useContext } from 'react';
import { LoanContext } from './loan-context';

export const useLoans = () => useContext(LoanContext);
