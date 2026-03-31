export const SYMBOLS = {
  Forex: ['USD/ZAR', 'EUR/USD', 'GBP/USD', 'USD/JPY'],
  Crypto: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD'],
  Stocks: ['APPLE', 'TESLA', 'NVIDIA', 'AMAZON'],
};

export const LOT_SIZES = [
  { label: 'Macro', pipValue: 0.10, sublabel: 'R0.10/pip' },
  { label: 'Mini', pipValue: 1.00, sublabel: 'R1/pip' },
  { label: 'Standard', pipValue: 10.00, sublabel: 'R10/pip' },
];

export const USD_TO_ZAR = 18.5;

export const COLORS = {
  bg: '#05050e',
  panel: '#0d0820',
  border: '#1e1e3a',
  borderBright: '#3a3a6a',
  label: '#8080aa',
  labelDim: '#5050a0',
  entryCol: '#38bdf8',
  tpCol: '#4ade80',
  slCol: '#f87171',
  buyBorder: '#4ade80',
  buyText: '#4ade80',
  sellBorder: '#f87171',
  sellText: '#f87171',
};
